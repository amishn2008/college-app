import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import College from '@/models/College';
import { computeNextReminder } from '@/lib/notifications';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const collegeId = searchParams.get('collegeId');
    const label = searchParams.get('label');
    const status = searchParams.get('status');
    const requestedStudentId = searchParams.get('studentId');

    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: 'viewTasks',
    });

    const query: any = { userId: targetUserId };
    if (collegeId) query.collegeId = collegeId;
    if (label) query.label = label;
    if (status === 'completed') query.completed = true;
    if (status === 'pending') query.completed = false;

    const tasks = await Task.find(query).sort({ dueDate: 1, priority: -1 });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const requestedStudentId = searchParams.get('studentId');
    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: 'manageTasks',
    });
    const { title, notes, label, dueDate, reminderDate, priority, collegeId, reminderFrequency, reminderChannels } = await req.json();

    const task = await Task.create({
      userId: targetUserId,
      collegeId,
      title,
      notes,
      label: label || 'Other',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      reminderDate: reminderDate ? new Date(reminderDate) : undefined,
      priority: priority || 'medium',
      reminderFrequency: reminderFrequency || 'none',
      reminderChannels: Array.isArray(reminderChannels) && reminderChannels.length > 0 ? reminderChannels : ['email'],
    });
    if (task.reminderFrequency && task.reminderFrequency !== 'none') {
      task.nextReminderAt = computeNextReminder(task);
      await task.save();
    }

    // Update college progress
    if (collegeId) {
      const college = await College.findById(collegeId);
      if (college) {
        college.progress.tasksTotal += 1;
        await college.save();
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Create task error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
