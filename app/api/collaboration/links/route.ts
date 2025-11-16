import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import CollaboratorLink from '@/models/CollaboratorLink';
import User from '@/models/User';
import type { CollaboratorRelationship, CollaboratorPermissions } from '@/types/collaboration';
import { buildDefaultPermissions } from '@/types/collaboration';
import { sanitizePermissionsPayload } from '@/app/api/collaboration/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const includeRevoked = searchParams.get('includeRevoked') === 'true';

    const filter: Record<string, any> = {};
    const role = session.user.role || 'student';
    if (role === 'counselor' || role === 'parent') {
      filter.collaboratorId = session.user.id;
    } else {
      filter.studentId = session.user.id;
    }
    if (!includeRevoked) {
      filter.status = { $ne: 'revoked' };
    }

    const links = await CollaboratorLink.find(filter)
      .populate('studentId', 'name email image role')
      .populate('collaboratorId', 'name email image role')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(links);
  } catch (error) {
    console.error('Collaboration links fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can invite collaborators' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const collaboratorEmail: string | undefined = body.collaboratorEmail;
    const relationship: CollaboratorRelationship =
      body.relationship === 'parent' ? 'parent' : 'counselor';
    const note: string | undefined = body.note;
    const permissions: CollaboratorPermissions = sanitizePermissionsPayload(
      body.permissions,
      relationship
    );

    if (!collaboratorEmail) {
      return NextResponse.json({ error: 'Collaborator email is required' }, { status: 400 });
    }

    const normalizedEmail = collaboratorEmail.trim().toLowerCase();
    let collaborator = await User.findOne({ email: normalizedEmail });
    if (!collaborator) {
      try {
        collaborator = await User.create({
          email: normalizedEmail,
          role: relationship,
          intakeYear: new Date().getFullYear() + 1,
          regions: [],
          targetCollegeCount: 0,
        });
      } catch (error) {
        const maybeMongoError = error as { code?: number };
        if (maybeMongoError?.code === 11000) {
          collaborator = await User.findOne({ email: normalizedEmail });
        } else {
          throw error;
        }
      }
    }

    if (collaborator?._id?.toString() === session.user.id) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }

    if (!collaborator) {
      return NextResponse.json(
        { error: 'Could not resolve collaborator account' },
        { status: 500 }
      );
    }

    if (collaborator.role !== relationship) {
      if (collaborator.role === 'student') {
        const update: Record<string, unknown> = { role: relationship };
        if (relationship === 'counselor') {
          update.counselorProfile =
            collaborator.counselorProfile || {
              defaultPermissions: buildDefaultPermissions('counselor'),
            };
        }
        collaborator = await User.findByIdAndUpdate(
          collaborator._id,
          { $set: update },
          { new: true }
        );
        if (!collaborator) {
          return NextResponse.json(
            { error: 'Failed to reassign collaborator role' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Target user must be a ${relationship}` },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    let link = await CollaboratorLink.findOne({
      studentId: session.user.id,
      collaboratorId: collaborator._id,
    });

    if (!link) {
      link = new CollaboratorLink({
        studentId: session.user.id,
        collaboratorId: collaborator._id,
        relationship,
        permissions,
        status: 'active',
        note,
        createdBy: session.user.id,
        acceptedAt: now,
      });
    } else {
      link.relationship = relationship;
      link.permissions = permissions;
      link.status = 'active';
      link.note = note;
      link.createdBy = link.createdBy || session.user.id;
      link.acceptedAt = now;
    }

    await link.save();
    await link.populate('studentId', 'name email image role');
    await link.populate('collaboratorId', 'name email image role');

    return NextResponse.json(link.toObject());
  } catch (error) {
    console.error('Collaboration link create error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
