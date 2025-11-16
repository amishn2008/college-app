import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';
import { shouldSendReminder, computeNextReminder, sendTaskReminder } from '@/lib/notifications';

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const tasks = await Task.find({
      completed: false,
      reminderFrequency: { $ne: 'none' },
      nextReminderAt: { $lte: new Date() },
    });

    let sent = 0;
    for (const task of tasks) {
      if (!shouldSendReminder(task)) continue;
      const user = await User.findById(task.userId);
      if (!user) continue;
      await sendTaskReminder(task, user);
      task.lastReminderSentAt = new Date();
      task.nextReminderAt = computeNextReminder(task);
      await task.save();
      sent += 1;
    }

    return NextResponse.json({ sent });
  } catch (error) {
    console.error('Reminder worker error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
