import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';

interface ExternalEvent {
  taskId?: string;
  title?: string;
  dueDate?: string;
  completed?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const body = await req.json();
    const events: ExternalEvent[] = Array.isArray(body.events) ? body.events : [];
    let updated = 0;
    for (const event of events) {
      if (!event.taskId) continue;
      const task = await Task.findOne({ _id: event.taskId, userId: session.user.id });
      if (!task) continue;
      if (event.dueDate) {
        task.dueDate = new Date(event.dueDate);
      }
      if (typeof event.completed === 'boolean') {
        task.completed = event.completed;
        task.completedAt = event.completed ? new Date() : undefined;
      }
      if (event.title) {
        task.title = event.title;
      }
      await task.save();
      updated += 1;
    }
    return NextResponse.json({ updated });
  } catch (error) {
    console.error('Calendar import error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
