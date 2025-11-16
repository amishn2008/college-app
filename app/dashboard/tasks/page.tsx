import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import College from '@/models/College';
import { TasksClient } from './TasksClient';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

async function getTasksData(viewerId: string, requestedStudentId?: string | null) {
  await connectDB();
  const { targetUserId } = await resolveStudentContext({
    actorUserId: viewerId,
    studentId: requestedStudentId,
    requiredPermission: 'viewTasks',
  });

  const [tasks, colleges] = await Promise.all([
    Task.find({ userId: targetUserId }).sort({ dueDate: 1, priority: -1 }).lean(),
    College.find({ userId: targetUserId }).select('name').lean(),
  ]);

  const serializedColleges = colleges.map((college) => ({
    _id: college._id.toString(),
    name: college.name,
  }));

  const collegeMap = new Map(serializedColleges.map((college) => [college._id, college.name]));

  const serializedTasks = tasks.map((task) => {
    const collegeId = task.collegeId ? task.collegeId.toString() : null;
    return {
      _id: task._id.toString(),
      title: task.title,
      notes: task.notes || '',
      label: task.label,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      completed: task.completed,
      priority: task.priority,
      collegeId,
      collegeName: collegeId ? collegeMap.get(collegeId) || null : null,
      snoozedUntil: task.snoozedUntil ? task.snoozedUntil.toISOString() : null,
      reminderFrequency: task.reminderFrequency || 'none',
      reminderChannels: task.reminderChannels || [],
      nextReminderAt: task.nextReminderAt ? task.nextReminderAt.toISOString() : null,
      acknowledgedAt: task.acknowledgedAt ? task.acknowledgedAt.toISOString() : null,
    };
  });

  return { tasks: serializedTasks, colleges: serializedColleges };
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { studentId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const defaultStudentId =
    session.user.role === 'student' ? session.user.id : session.user.activeStudentId || undefined;
  const requestedStudentId = searchParams?.studentId || defaultStudentId;
  let data;
  try {
    data = await getTasksData(session.user.id, requestedStudentId);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect('/dashboard/collaboration');
    }
    throw error;
  }

  return <TasksClient initialData={data} />;
}
