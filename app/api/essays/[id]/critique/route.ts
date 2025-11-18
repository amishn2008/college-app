import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Essay from '@/models/Essay';
import { critiqueEssay, rewriteEssay, coachEssay, chatEssay } from '@/lib/openai';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

export const dynamic = 'force-dynamic';

export async function POST(
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
    const { mode, instruction, messages } = await req.json();
    const requiresEditing = mode === 'rewrite';
    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: requiresEditing ? 'editEssays' : 'viewEssays',
    });
    const essay = await Essay.findOne({ _id: params.id, userId: targetUserId });

    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
    }

    if (mode === 'critique') {
      const critique = await critiqueEssay(essay.currentContent, essay.prompt, essay.wordLimit, essay.title);
      return NextResponse.json(critique);
    } else if (mode === 'rewrite' && instruction) {
      const rewritten = await rewriteEssay(essay.currentContent, instruction, essay.prompt, essay.wordLimit);
      return NextResponse.json({ rewritten });
    } else if (mode === 'coach') {
      const coaching = await coachEssay(essay.currentContent, essay.prompt, essay.wordLimit);
      return NextResponse.json({ coaching });
    } else if (mode === 'chat' && Array.isArray(messages)) {
      const reply = await chatEssay(essay.currentContent, essay.prompt, essay.wordLimit, messages);
      return NextResponse.json({ message: reply });
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    console.error('AI critique error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
