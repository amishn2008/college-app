import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import College from '@/models/College';
import Task from '@/models/Task';
import Activity from '@/models/Activity';
import { DashboardClient } from './DashboardClient';
import {
  getDaysUntilDeadline,
  calculateReadinessScore,
  summarizeRequirementProgress,
} from '@/lib/utils';
import User from '@/models/User';
import { ensureWorkspace } from '@/lib/workspace';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

async function getDashboardData(viewerId: string, requestedStudentId?: string | null) {
  await connectDB();
  const { targetUserId } = await resolveStudentContext({
    actorUserId: viewerId,
    studentId: requestedStudentId,
    requiredPermission: 'viewTasks',
  });

  const colleges = await College.find({ userId: targetUserId }).sort({ deadline: 1 });
  const tasks = await Task.find({ userId: targetUserId, completed: false })
    .sort({ dueDate: 1, priority: -1 })
    .limit(10);
  const serializedTasks = tasks.map((task) => ({
    _id: task._id.toString(),
    title: task.title,
    label: task.label,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    completed: task.completed,
    priority: task.priority,
    collegeId: task.collegeId ? task.collegeId.toString() : null,
  }));

  // Get today's tasks (due today or overdue)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTasks = serializedTasks.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today;
  }).slice(0, 3);

  // Calculate readiness scores for colleges
  const collegesWithScores = await Promise.all(
    colleges.map(async (college) => {
      const collegeTasks = await Task.find({ collegeId: college._id });
      const collegeEssays = await (await import('@/models/Essay')).default.find({
        collegeId: college._id,
      });

      const tasksCompleted = collegeTasks.filter((t) => t.completed).length;
      const tasksTotal = collegeTasks.length;
      const essaysCompleted = collegeEssays.filter((e) => e.completed).length;
      const essaysTotal = collegeEssays.length;

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
      await college.save();

      return {
        ...college.toObject(),
        daysUntil: getDaysUntilDeadline(college.deadline),
      };
    })
  );

  const activities = await Activity.find({ userId: targetUserId }).sort({ order: 1, createdAt: 1 });

  const serializedActivities = activities.map((activity) => ({
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
  }));

  const user = await User.findById(targetUserId);
  const workspace = ensureWorkspace(user?.workspace);

  if (user && (!user.workspace || user.workspace.checklist?.length === 0)) {
    user.workspace = workspace;
    await user.save();
  }

  return {
    colleges: collegesWithScores,
    todayTasks,
    allTasks: serializedTasks,
    workspace,
    studentId: targetUserId,
    activities: serializedActivities,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { studentId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'student') {
    redirect('/dashboard/counselor');
  }

  const defaultStudentId =
    session.user.role === 'student' ? session.user.id : session.user.activeStudentId || undefined;
  const requestedStudentId = searchParams?.studentId || defaultStudentId;
  let data;
  try {
    data = await getDashboardData(session.user.id, requestedStudentId);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect('/dashboard/collaboration');
    }
    throw error;
  }

  return <DashboardClient initialData={data} />;
}
