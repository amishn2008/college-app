import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ApplicationDocument from '@/models/ApplicationDocument';
import { sanitizeDocumentPayload, serializeDocument } from './utils';
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
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const collegeId = searchParams.get('collegeId');

    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: 'viewTasks',
    });

    const query: Record<string, unknown> = { userId: targetUserId };
    if (category) query.category = category;
    if (status) query.status = status;
    if (collegeId) query.collegeIds = collegeId;

    const documents = await ApplicationDocument.find(query).sort({ updatedAt: -1 });
    return NextResponse.json(documents.map(serializeDocument));
  } catch (error) {
    console.error('Get documents error:', error);
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

    const payload = await req.json();
    const sanitized = sanitizeDocumentPayload(payload);

    if (!sanitized.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const document = await ApplicationDocument.create({
      ...sanitized,
      userId: targetUserId,
      lastTouchedBy: session.user.id,
      lastTouchedAt: new Date(),
    });

    return NextResponse.json(serializeDocument(document));
  } catch (error) {
    console.error('Create document error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
