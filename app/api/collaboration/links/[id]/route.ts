import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import CollaboratorLink from '@/models/CollaboratorLink';
import { sanitizePermissionsPayload } from '@/app/api/collaboration/utils';

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
    const link = await CollaboratorLink.findById(params.id);
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const viewerId = session.user.id;
    const isOwner = link.studentId.toString() === viewerId;
    const isCollaborator = link.collaboratorId.toString() === viewerId;
    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (body.permissions && isOwner) {
      link.permissions = sanitizePermissionsPayload(body.permissions, link.relationship);
    }

    if (typeof body.note === 'string' && isOwner) {
      link.note = body.note;
    }

    if (body.status) {
      const nextStatus = body.status;
      const validStatuses = ['pending', 'active', 'revoked'];
      if (!validStatuses.includes(nextStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      if (nextStatus === 'revoked' && !(isOwner || isCollaborator)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (nextStatus === 'active' && !isOwner && !isCollaborator) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      link.status = nextStatus;
      if (nextStatus === 'active') {
        link.acceptedAt = new Date();
      }
    }

    if (isCollaborator) {
      link.lastSeenAt = new Date();
    }

    await link.save();
    await link.populate('studentId', 'name email image role');
    await link.populate('collaboratorId', 'name email image role');

    return NextResponse.json(link);
  } catch (error) {
    console.error('Collaboration link update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const link = await CollaboratorLink.findById(params.id);
    if (!link) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const viewerId = session.user.id;
    if (
      link.studentId.toString() !== viewerId &&
      link.collaboratorId.toString() !== viewerId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    link.status = 'revoked';
    await link.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Collaboration link delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
