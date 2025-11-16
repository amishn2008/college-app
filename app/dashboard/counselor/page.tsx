import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import type { Types } from 'mongoose';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import CollaboratorLink from '@/models/CollaboratorLink';
import Task from '@/models/Task';
import College from '@/models/College';
import Essay from '@/models/Essay';
import { CounselorDashboardClient } from './CounselorDashboardClient';
import type { CounselorStudentSnapshot } from './types';

async function getCounselorStudents(userId: string): Promise<CounselorStudentSnapshot[]> {
  await connectDB();
  const links = await CollaboratorLink.find({
    collaboratorId: userId,
    status: { $ne: 'revoked' },
  })
    .populate('studentId', 'name email image intakeYear role')
    .sort({ createdAt: -1 })
    .lean();

  if (links.length === 0) {
    return [];
  }

  const studentIds = links
    .map((link) => {
      const student = link.studentId as { _id?: Types.ObjectId } | null;
      return student?._id?.toString() || null;
    })
    .filter((id): id is string => Boolean(id));

  if (studentIds.length === 0) {
    return [];
  }

  const objectIds = studentIds.map((id) => new mongoose.Types.ObjectId(id));
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(now.getDate() + 7);

  const [taskAgg, collegeAgg, essayAgg] = await Promise.all([
    Task.aggregate([
      { $match: { userId: { $in: objectIds }, completed: false } },
      {
        $group: {
          _id: '$userId',
          openTasks: { $sum: 1 },
          urgentTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$dueDate', null] },
                    { $lte: ['$dueDate', soon] },
                    { $gte: ['$dueDate', now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [{ $ne: ['$dueDate', null] }, { $lt: ['$dueDate', now] }],
                },
                1,
                0,
              ],
            },
          },
          highPriority: {
            $sum: {
              $cond: [{ $eq: ['$priority', 'high'] }, 1, 0],
            },
          },
        },
      },
    ]),
    College.aggregate([
      { $match: { userId: { $in: objectIds } } },
      {
        $group: {
          _id: '$userId',
          collegeCount: { $sum: 1 },
          nextDeadline: { $min: '$deadline' },
        },
      },
    ]),
    Essay.aggregate([
      { $match: { userId: { $in: objectIds } } },
      {
        $group: {
          _id: '$userId',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$completed', true] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const taskMap = new Map(
    taskAgg.map((row) => [
      row._id.toString(),
      {
        openTasks: row.openTasks ?? 0,
        urgentTasks: row.urgentTasks ?? 0,
        overdueTasks: row.overdueTasks ?? 0,
        highPriority: row.highPriority ?? 0,
      },
    ])
  );

  const collegeMap = new Map(
    collegeAgg.map((row) => [
      row._id.toString(),
      {
        colleges: row.collegeCount ?? 0,
        nextDeadline: row.nextDeadline ? new Date(row.nextDeadline).toISOString() : null,
      },
    ])
  );

  const essayMap = new Map(
    essayAgg.map((row) => [
      row._id.toString(),
      {
        total: row.total ?? 0,
        completed: row.completed ?? 0,
      },
    ])
  );

  return links
    .map((link) => {
      const student = link.studentId as { _id?: Types.ObjectId; name?: string; email?: string; intakeYear?: number } | null;
      if (!student?._id) {
        return null;
      }
      const id = student._id.toString();
      const taskMetrics = taskMap.get(id);
      const collegeMetrics = collegeMap.get(id);
      const essayMetrics = essayMap.get(id);

      return {
        id,
        linkId: link._id.toString(),
        name: student.name || student.email || 'Unnamed student',
        email: student.email || '',
        intakeYear: student.intakeYear,
        status: link.status,
        relationship: link.relationship,
        permissions: link.permissions || {},
        updatedAt: link.updatedAt ? link.updatedAt.toISOString() : null,
        acceptedAt: link.acceptedAt ? link.acceptedAt.toISOString() : null,
        metrics: {
          openTasks: taskMetrics?.openTasks || 0,
          urgentTasks: taskMetrics?.urgentTasks || 0,
          overdueTasks: taskMetrics?.overdueTasks || 0,
          highPriority: taskMetrics?.highPriority || 0,
          colleges: collegeMetrics?.colleges || 0,
          nextDeadline: collegeMetrics?.nextDeadline || null,
          essayDrafts:
            (essayMetrics?.total || 0) - (essayMetrics?.completed || 0),
          essaysCompleted: essayMetrics?.completed || 0,
        },
      } satisfies CounselorStudentSnapshot;
    })
    .filter((entry): entry is CounselorStudentSnapshot => Boolean(entry));
}

export default async function CounselorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const role = session.user.role || 'student';
  if (!['counselor', 'parent'].includes(role)) {
    redirect('/dashboard');
  }

  const students = await getCounselorStudents(session.user.id);

  return <CounselorDashboardClient initialStudents={students} />;
}
