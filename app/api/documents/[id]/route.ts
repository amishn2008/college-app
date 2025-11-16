import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ApplicationDocument from '@/models/ApplicationDocument';
import { sanitizeDocumentPayload, serializeDocument } from '../utils';
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

    const document = await ApplicationDocument.findOne({
      _id: params.id,
      userId: targetUserId,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const payload = await req.json();
    const sanitized = sanitizeDocumentPayload(payload);

    if (!sanitized.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    document.set({
      ...sanitized,
      lastTouchedBy: session.user.id,
      lastTouchedAt: new Date(),
    });
    await document.save();

    return NextResponse.json(serializeDocument(document));
  } catch (error) {
    console.error('Update document error:', error);
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

    const deleted = await ApplicationDocument.findOneAndDelete({
      _id: params.id,
      userId: targetUserId,
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
