import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

export async function GET(req: NextRequest) {
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
      requiredPermission: 'viewTasks',
    });

    const activities = await Activity.find({ userId: targetUserId }).sort({ order: 1, createdAt: 1 });
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
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

    const body = await req.json();
    const activity = await Activity.create({
      userId: targetUserId,
      title: body.title,
      role: body.role,
      organization: body.organization,
      description: body.description,
      impact: body.impact,
      category: body.category || 'Other',
      gradeLevels: Array.isArray(body.gradeLevels) ? body.gradeLevels : [],
      hoursPerWeek: body.hoursPerWeek,
      weeksPerYear: body.weeksPerYear,
      commitmentLevel: body.commitmentLevel || 'medium',
      order: Number.isFinite(body.order) ? body.order : Date.now(),
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Create activity error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
