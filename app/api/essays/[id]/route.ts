import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Essay from '@/models/Essay';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

export async function GET(
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
      requiredPermission: 'viewEssays',
    });
    const essay = await Essay.findOne({ _id: params.id, userId: targetUserId });

    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
    }

    return NextResponse.json(essay);
  } catch (error) {
    console.error('Get essay error:', error);
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

    await connectDB();
    const { searchParams } = new URL(req.url);
    const requestedStudentId = searchParams.get('studentId');
    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: 'editEssays',
    });
    const essay = await Essay.findOne({ _id: params.id, userId: targetUserId });

    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
    }

    const updates = await req.json();

    if (updates.currentContent !== undefined) {
      essay.currentContent = updates.currentContent;
      essay.currentWordCount = countWords(updates.currentContent);
    }

    if (updates.saveVersion) {
      const versionName = updates.versionName || `Version ${essay.versions.length + 1}`;
      essay.versions.push({
        name: versionName,
        content: essay.currentContent,
        wordCount: essay.currentWordCount,
        createdAt: new Date(),
      });
    }

    if (updates.completed !== undefined) {
      essay.completed = updates.completed;
      essay.completedAt = updates.completed ? new Date() : undefined;
    }

    Object.assign(essay, updates);
    await essay.save();

    return NextResponse.json(essay);
  } catch (error) {
    console.error('Update essay error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
