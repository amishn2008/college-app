import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import College from '@/models/College';
import Task from '@/models/Task';
import Essay from '@/models/Essay';
import { CollegeDetailClient } from './CollegeDetailClient';
import {
  calculateReadinessScore,
  getDaysUntilDeadline,
  summarizeRequirementProgress,
} from '@/lib/utils';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

async function getCollegeDetail(
  collegeId: string,
  viewerId: string,
  requestedStudentId?: string | null
) {
  await connectDB();
  const { targetUserId } = await resolveStudentContext({
    actorUserId: viewerId,
    studentId: requestedStudentId,
    requiredPermission: 'viewTasks',
  });
  const college = await College.findOne({ _id: collegeId, userId: targetUserId });
  if (!college) {
    return null;
  }

  const tasks = await Task.find({ collegeId, userId: targetUserId });
  const essays = await Essay.find({ collegeId, userId: targetUserId });

  const tasksCompleted = tasks.filter((t) => t.completed).length;
  const tasksTotal = tasks.length;
  const essaysCompleted = essays.filter((e) => e.completed).length;
  const essaysTotal = essays.length;

  const requirementSummary = summarizeRequirementProgress({
    requirementStatus: college.requirementStatus,
    customRequirements: college.requirements?.custom,
    includeMainEssay: college.requirements?.mainEssay !== false,
    mainEssayComplete: essaysCompleted > 0,
  });

  const readinessScore = calculateReadinessScore(
    tasksCompleted,
    tasksTotal,
    essaysCompleted,
    essaysTotal,
    requirementSummary.completed,
    requirementSummary.total
  );

  college.progress.readinessScore = readinessScore;
  college.progress.tasksCompleted = tasksCompleted;
  college.progress.tasksTotal = tasksTotal;
  college.progress.essaysCompleted = essaysCompleted;
  college.progress.essaysTotal = essaysTotal;
  await college.save();

  return {
    college: {
      ...college.toObject(),
      daysUntil: getDaysUntilDeadline(college.deadline),
    },
    tasks,
    essays,
  };
}

export default async function CollegeDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
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
    data = await getCollegeDetail(params.id, session.user.id, requestedStudentId);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect('/dashboard/collaboration');
    }
    throw error;
  }
  if (!data) {
    redirect('/dashboard');
  }

  return <CollegeDetailClient data={data} />;
}
