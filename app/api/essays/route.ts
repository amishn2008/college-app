import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Essay from '@/models/Essay';
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
    const requestedStudentId = searchParams.get('studentId');

    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: 'viewEssays',
    });

    const query: any = { userId: targetUserId };
    if (collegeId) query.collegeId = collegeId;

    const essays = await Essay.find(query).sort({ createdAt: -1 });

    return NextResponse.json(essays);
  } catch (error) {
    console.error('Get essays error:', error);
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
    const context = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: 'editEssays',
    });
    const { collegeId, title, prompt, wordLimit } = await req.json();

    const payload: any = {
      userId: context.targetUserId,
      title,
      prompt: prompt || '',
      wordLimit: wordLimit || 650,
      currentContent: '',
      currentWordCount: 0,
      versions: [],
    };

    if (collegeId) {
      payload.collegeId = collegeId;
    }

    const essay = await Essay.create(payload);

    return NextResponse.json(essay);
  } catch (error) {
    console.error('Create essay error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
