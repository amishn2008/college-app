import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import CollaboratorLink from '@/models/CollaboratorLink';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const nextStudentId: string | null = body.studentId || null;

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!['counselor', 'parent'].includes(user.role)) {
      return NextResponse.json({ error: 'Only collaborators can change context' }, { status: 403 });
    }

    if (!nextStudentId) {
      user.activeStudentId = null;
      await user.save();
      return NextResponse.json({ success: true });
    }

    const link = await CollaboratorLink.findOne({
      studentId: nextStudentId,
      collaboratorId: user._id,
      status: 'active',
    });

    if (!link) {
      return NextResponse.json({ error: 'Collaboration link not found' }, { status: 404 });
    }

    user.activeStudentId = link.studentId;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Context update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
