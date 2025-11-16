import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import CollaboratorLink from '@/models/CollaboratorLink';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const role = session.user.role || 'student';
    const filter: Record<string, any> = { status: 'active' };
    if (role === 'counselor' || role === 'parent') {
      filter.collaboratorId = session.user.id;
    } else {
      filter.studentId = session.user.id;
    }

    const links = await CollaboratorLink.find(filter)
      .populate('studentId', 'name email image role intakeYear timezone')
      .populate('collaboratorId', 'name email image role timezone')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(links);
  } catch (error) {
    console.error('Collaboration students fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
