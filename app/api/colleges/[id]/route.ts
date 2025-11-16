import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import College from '@/models/College';
import Task from '@/models/Task';
import Essay from '@/models/Essay';
import { DEFAULT_REQUIREMENT_STATUS } from '@/types/college';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

const parseDate = (value?: string | null) => (value ? new Date(value) : undefined);

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(_req.url);
    const requestedStudentId = searchParams.get('studentId');
    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: 'viewTasks',
    });
    const college = await College.findOne({
      _id: params.id,
      userId: targetUserId,
    });

    if (!college) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(college);
  } catch (error) {
    console.error('Get college error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    await connectDB();
    const { searchParams } = new URL(req.url);
    const requestedStudentId = searchParams.get('studentId');
    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: 'manageTasks',
    });
    const college = await College.findOne({
      _id: params.id,
      userId: targetUserId,
    });

    if (!college) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (body.portal) {
      college.portal = {
        ...(college.portal || {}),
        ...body.portal,
      };
    }

    if (body.status) {
      college.status = {
        ...(college.status || {}),
        ...body.status,
        submittedAt: parseDate(body.status.submittedAt) ?? college.status?.submittedAt,
        decisionDate: parseDate(body.status.decisionDate) ?? college.status?.decisionDate,
      };
    }

    if (body.financialAid) {
      college.financialAid = {
        ...(college.financialAid || {}),
        ...body.financialAid,
        priorityDeadline:
          parseDate(body.financialAid.priorityDeadline) ??
          college.financialAid?.priorityDeadline,
      };
    }

    if (body.requirementStatus) {
      const currentStatus =
        (typeof (college.requirementStatus as any)?.toObject === 'function'
          ? (college.requirementStatus as any).toObject()
          : college.requirementStatus) || {};

      college.requirementStatus = {
        ...DEFAULT_REQUIREMENT_STATUS,
        ...currentStatus,
        ...body.requirementStatus,
      };
      college.markModified('requirementStatus');
    }

    if (body.requirements) {
      const currentRequirements =
        (typeof (college.requirements as any)?.toObject === 'function'
          ? (college.requirements as any).toObject()
          : college.requirements) || {};

      college.requirements = {
        ...currentRequirements,
        ...body.requirements,
      };

      if (Array.isArray(body.requirements.custom)) {
        college.requirements.custom = body.requirements.custom.map((entry: any) => ({
          title: entry.title,
          completed: !!entry.completed,
          _id: entry._id || entry.id,
        }));
      }
      college.markModified('requirements');
    }

    if (body.interview) {
      college.interview = {
        ...(college.interview || {}),
        ...body.interview,
        scheduledAt:
          parseDate(body.interview.scheduledAt) ?? college.interview?.scheduledAt,
      };
    }

    if (body.notes !== undefined) {
      college.notes = body.notes;
    }

    await college.save();

    return NextResponse.json(college);
  } catch (error) {
    console.error('Update college error:', error);
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

    const college = await College.findOne({
      _id: params.id,
      userId: targetUserId,
    });

    if (!college) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await Promise.all([
      Task.deleteMany({ userId: targetUserId, collegeId: college._id }),
      Essay.deleteMany({ userId: targetUserId, collegeId: college._id }),
      college.deleteOne(),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete college error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
