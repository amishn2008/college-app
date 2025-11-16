import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Essay from '@/models/Essay';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

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
    const body = await req.json();
    const selection: string = body.selection;
    const note: string = body.note;
    const selectionStart = typeof body.selectionStart === 'number' ? body.selectionStart : Number(body.selectionStart);
    const selectionEnd = typeof body.selectionEnd === 'number' ? body.selectionEnd : Number(body.selectionEnd);

    if (!selection || !note) {
      return NextResponse.json({ error: 'Selection and note are required' }, { status: 400 });
    }

    if (!Number.isFinite(selectionStart) || !Number.isFinite(selectionEnd)) {
      return NextResponse.json(
        { error: 'Selection start and end positions are required' },
        { status: 400 }
      );
    }

    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: session.user.activeStudentId || undefined,
      requiredPermission: 'editEssays',
      fallbackToSelf: false,
    });

    const essay = await Essay.findOne({ _id: params.id, userId: targetUserId });
    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
    }

    essay.set('rewriteApprovals', [
      ...(essay.rewriteApprovals || []),
      {
        content: selection,
        instruction: note,
        approvedBy: { userId: session.user.id, name: session.user.name },
        approvedAt: new Date(),
        selectionStart,
        selectionEnd,
      },
    ]);

    await essay.save();

    return NextResponse.json(essay.toObject());
  } catch (error) {
    console.error('Essay feedback error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
