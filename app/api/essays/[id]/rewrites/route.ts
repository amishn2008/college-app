import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Essay from '@/models/Essay';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter((word) => word.length > 0).length;

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
    const body = await req.json();
    const content: string | undefined = body.content;
    if (!content) {
      return NextResponse.json({ error: 'Missing rewritten content' }, { status: 400 });
    }

    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: 'approveAiSuggestions',
    });

    const essay = await Essay.findOne({ _id: params.id, userId: targetUserId });
    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
    }

    const previousContent = essay.currentContent;
    essay.currentContent = content;
    essay.currentWordCount = countWords(content);
    essay.rewriteApprovals = essay.rewriteApprovals || [];
    essay.rewriteApprovals.push({
      instruction: body.instruction,
      content,
      previousContent,
      approvedBy: {
        userId: session.user.id,
        name: session.user.name || session.user.email,
      },
      approvedAt: new Date(),
    });

    await essay.save();

    return NextResponse.json({
      currentContent: essay.currentContent,
      currentWordCount: essay.currentWordCount,
      rewriteApprovals: essay.rewriteApprovals,
    });
  } catch (error) {
    console.error('Rewrite approval error', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
