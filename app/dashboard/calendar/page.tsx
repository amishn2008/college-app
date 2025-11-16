import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import College from '@/models/College';
import User from '@/models/User';
import { CalendarClient } from './CalendarClient';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

async function getCalendarData(viewerId: string, requestedStudentId?: string | null) {
  await connectDB();
  const { targetUserId } = await resolveStudentContext({
    actorUserId: viewerId,
    studentId: requestedStudentId,
    requiredPermission: 'viewTasks',
  });

  const [tasks, colleges, user] = await Promise.all([
    Task.find({ userId: targetUserId }).sort({ dueDate: 1 }).lean(),
    College.find({ userId: targetUserId }).lean(),
    User.findById(targetUserId).lean(),
  ]);

  const serializedTasks = tasks.map((task) => ({
    _id: task._id.toString(),
    title: task.title,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    label: task.label,
    completed: task.completed,
  }));

  const serializedColleges = colleges.map((college) => ({
    _id: college._id.toString(),
    name: college.name,
    deadline: college.deadline ? college.deadline.toISOString() : null,
  }));

  return {
    tasks: serializedTasks,
    colleges: serializedColleges,
    syncToken: user?.calendarSync?.token || null,
  };
}

export default async function CalendarPage({
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
    data = await getCalendarData(session.user.id, requestedStudentId);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect('/dashboard/collaboration');
    }
    throw error;
  }

  return <CalendarClient data={data} />;
}
