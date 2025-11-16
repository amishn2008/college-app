import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { buildDefaultPermissions } from '@/types/collaboration';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { intakeYear, regions, targetCollegeCount, role, timezone } = body;

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.intakeYear = intakeYear ?? user.intakeYear;
    user.regions = Array.isArray(regions) ? regions : user.regions;
    if (typeof targetCollegeCount === 'number') {
      user.targetCollegeCount = targetCollegeCount;
    }
    if (typeof timezone === 'string' && timezone.trim()) {
      user.timezone = timezone.trim();
    }

    if (role && ['student', 'counselor', 'parent'].includes(role)) {
      user.role = role;
    }

    if (user.role === 'counselor') {
      user.counselorProfile = {
        ...(user.counselorProfile || {}),
        organization: body.organization ?? user.counselorProfile?.organization,
        website: body.website ?? user.counselorProfile?.website,
        bio: body.bio ?? user.counselorProfile?.bio,
        defaultPermissions:
          user.counselorProfile?.defaultPermissions ||
          buildDefaultPermissions('counselor'),
      };
    }

    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
