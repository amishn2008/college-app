import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const regenerate = body?.regenerate;
    if (!user.calendarSync?.token || regenerate) {
      const token = crypto.randomUUID().replace(/-/g, '');
      user.calendarSync = {
        token,
        provider: 'ics',
        connectedAt: new Date(),
      };
      await user.save();
    }

    return NextResponse.json({ token: user.calendarSync?.token });
  } catch (error) {
    console.error('Calendar sync error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.calendarSync = undefined;
    await user.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar sync delete error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
