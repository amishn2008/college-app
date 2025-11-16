import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Essay from '@/models/Essay';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';
import { listEssayPresence, updateEssayPresence } from '@/lib/presenceStore';

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

    const essay = await Essay.findOne({ _id: params.id, userId: targetUserId }).select('_id');
    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
    }

    const presence = listEssayPresence(params.id, session.user.id);
    return NextResponse.json({ presence });
  } catch (error) {
    console.error('Presence GET error', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: 'editEssays',
    });

    const essay = await Essay.findOne({ _id: params.id, userId: targetUserId }).select('_id');
    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
    }

    const payload = await req.json();
    const cursor = typeof payload.cursor === 'number' ? payload.cursor : 0;
    const selectionStart =
      typeof payload.selectionStart === 'number' ? payload.selectionStart : cursor;
    const selectionEnd =
      typeof payload.selectionEnd === 'number' ? payload.selectionEnd : cursor;

    updateEssayPresence(params.id, {
      userId: session.user.id,
      name: session.user.name || session.user.email,
      cursor,
      selectionStart,
      selectionEnd,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Presence POST error', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
