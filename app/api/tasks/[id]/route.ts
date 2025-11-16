import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import College from '@/models/College';
import { computeNextReminder } from '@/lib/notifications';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const task = await Task.findOne({ _id: params.id, userId: targetUserId });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updates = await req.json();
    
    // Handle completion toggle
    if (updates.completed !== undefined) {
      task.completed = updates.completed;
      task.completedAt = updates.completed ? new Date() : undefined;

      // Update college progress
      if (task.collegeId) {
        const college = await College.findById(task.collegeId);
        if (college) {
          if (updates.completed) {
            college.progress.tasksCompleted += 1;
          } else {
            college.progress.tasksCompleted = Math.max(0, college.progress.tasksCompleted - 1);
          }
          await college.save();
        }
      }
    }

    // Handle snooze
    if (updates.snoozedUntil) {
      task.snoozedUntil = new Date(updates.snoozedUntil);
    }

    if (updates.reminderFrequency !== undefined) {
      task.reminderFrequency = updates.reminderFrequency;
      delete updates.reminderFrequency;
    }

    if (Array.isArray(updates.reminderChannels)) {
      task.reminderChannels = updates.reminderChannels;
      delete updates.reminderChannels;
    }

    if (updates.acknowledged !== undefined) {
      if (updates.acknowledged) {
        task.acknowledgedAt = new Date();
        task.acknowledgedBy = session.user.id as any;
      } else {
        task.acknowledgedAt = undefined;
        task.acknowledgedBy = undefined;
      }
      delete updates.acknowledged;
    }

    // Update other fields
    Object.assign(task, updates);

    if (task.reminderFrequency && task.reminderFrequency !== 'none') {
      task.nextReminderAt = computeNextReminder(task);
    } else {
      task.nextReminderAt = undefined;
    }

    await task.save();

    return NextResponse.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const task = await Task.findOneAndDelete({ _id: params.id, userId: targetUserId });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.collegeId) {
      const college = await College.findById(task.collegeId);
      if (college) {
        college.progress.tasksTotal = Math.max(0, (college.progress.tasksTotal || 0) - 1);
        if (task.completed) {
          college.progress.tasksCompleted = Math.max(
            0,
            (college.progress.tasksCompleted || 0) - 1
          );
        }
        await college.save();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
