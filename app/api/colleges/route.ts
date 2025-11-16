import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import College from '@/models/College';
import Task from '@/models/Task';
import { DEFAULT_REQUIREMENT_STATUS } from '@/types/college';
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
    const colleges = await College.find({ userId: targetUserId }).sort({ deadline: 1 });

    return NextResponse.json(colleges);
  } catch (error) {
    console.error('Get colleges error:', error);
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
    const {
      name,
      plan,
      deadline,
      intake,
      region,
      portalUrl,
      notes,
      requirementStatus,
      requirements,
    } = body;

    const normalizedRequirementStatus = {
      ...DEFAULT_REQUIREMENT_STATUS,
      ...(requirementStatus || {}),
    };

    const requirementConfig = {
      mainEssay: requirements?.mainEssay !== false,
      supplements: requirements?.supplements === true,
      recommendations: requirements?.recommendations === true,
      testing: requirements?.testing === true,
      transcript: requirements?.transcript === true,
      fees: requirements?.fees === true,
      custom: [],
    };

    const college = await College.create({
      userId: targetUserId,
      name,
      plan,
      deadline: new Date(deadline),
      intake: intake || 'Fall',
      region: region || 'US',
      requirements: requirementConfig,
      requirementStatus: normalizedRequirementStatus,
      portal: portalUrl
        ? {
            url: portalUrl,
          }
        : undefined,
      notes,
      status: {
        phase: 'researching',
        decision: 'pending',
      },
    });

    // Create starter tasks
    const starterTasks = [
      {
        userId: targetUserId,
        collegeId: college._id,
        title: `Complete main essay for ${name}`,
        label: 'Essay' as const,
        dueDate: new Date(new Date(deadline).getTime() - 7 * 24 * 60 * 60 * 1000),
        priority: 'high' as const,
      },
      {
        userId: targetUserId,
        collegeId: college._id,
        title: `Request teacher recommendations for ${name}`,
        label: 'Rec' as const,
        dueDate: new Date(new Date(deadline).getTime() - 14 * 24 * 60 * 60 * 1000),
        priority: 'high' as const,
      },
      {
        userId: targetUserId,
        collegeId: college._id,
        title: `Submit application fee for ${name}`,
        label: 'Fees' as const,
        dueDate: new Date(deadline),
        priority: 'medium' as const,
      },
    ];

    await Task.insertMany(starterTasks);

    return NextResponse.json(college);
  } catch (error) {
    console.error('Create college error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
