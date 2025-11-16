import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Task from '@/models/Task';
import College from '@/models/College';
import { buildCalendarFeed } from '@/lib/calendar';

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    await connectDB();
    const user = await User.findOne({ 'calendarSync.token': params.token });
    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const [tasks, colleges] = await Promise.all([
      Task.find({ userId: user._id }).lean(),
      College.find({ userId: user._id }).lean(),
    ]);

    const feed = buildCalendarFeed({ user, tasks, colleges });
    return new NextResponse(feed, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('ICS feed error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
