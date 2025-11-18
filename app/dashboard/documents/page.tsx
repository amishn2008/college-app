import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';
import Honor from '@/models/Honor';
import User from '@/models/User';
import { ensureWorkspace } from '@/lib/workspace';
import { DocumentsClient } from './DocumentsClient';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

async function getDocumentsData(viewerId: string, requestedStudentId?: string | null) {
  await connectDB();

  const { targetUserId } = await resolveStudentContext({
    actorUserId: viewerId,
    studentId: requestedStudentId,
    requiredPermission: 'viewTasks',
  });

  const [honors, activities, user] = await Promise.all([
    Honor.find({ userId: targetUserId }).sort({ order: 1, createdAt: 1 }),
    Activity.find({ userId: targetUserId }).sort({ order: 1, createdAt: 1 }),
    User.findById(targetUserId),
  ]);

  const workspace = ensureWorkspace(user?.workspace);
  if (user && (!user.workspace || user.workspace.checklist?.length === 0)) {
    user.workspace = workspace;
    await user.save();
  }

  return {
    honors: honors.map((honor) => ({
      _id: honor._id.toString(),
      title: honor.title,
      level: honor.level,
      organization: honor.organization || '',
      description: honor.description || '',
      year: honor.year || '',
      order: honor.order,
    })),
    activities: activities.map((activity) => ({
      _id: activity._id.toString(),
      title: activity.title,
      role: activity.role || '',
      organization: activity.organization || '',
      description: activity.description || '',
      impact: activity.impact || '',
      category: activity.category,
      gradeLevels: activity.gradeLevels || [],
      hoursPerWeek: activity.hoursPerWeek ?? null,
      weeksPerYear: activity.weeksPerYear ?? null,
      commitmentLevel: activity.commitmentLevel,
      order: activity.order,
    })),
    documentPrep: workspace.documentPrep || [],
    applicationNotes: workspace.generalNotes || '',
  };
}

export default async function DocumentsPage({
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
    data = await getDocumentsData(session.user.id, requestedStudentId);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect('/dashboard/collaboration');
    }
    throw error;
  }

  return <DocumentsClient initialData={data} />;
}
