import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';
import College from '@/models/College';
import Task from '@/models/Task';
import Essay from '@/models/Essay';
import { ShareViewClient } from './ShareViewClient';
import { calculateReadinessScore, summarizeRequirementProgress } from '@/lib/utils';

async function getShareData(token: string) {
  await connectDB();
  const shareLink = await ShareLink.findOne({ token });
  
  if (!shareLink) {
    return null;
  }

  const colleges = await College.find({ userId: shareLink.userId }).sort({ deadline: 1 });
  
  const collegesWithProgress = await Promise.all(
    colleges.map(async (college) => {
      const tasks = await Task.find({ collegeId: college._id });
      const essays = await Essay.find({ collegeId: college._id });

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

      return {
        ...college.toObject(),
        progress: {
          ...college.progress,
          readinessScore,
        },
        essays: shareLink.showEssayContent
          ? essays.map((e) => ({
              _id: e._id,
              title: e.title,
              currentContent: e.currentContent,
              currentWordCount: e.currentWordCount,
              completed: e.completed,
            }))
          : essays.map((e) => ({
              _id: e._id,
              title: e.title,
              currentWordCount: e.currentWordCount,
              completed: e.completed,
            })),
      };
    })
  );

  const upcomingTasks = await Task.find({
    userId: shareLink.userId,
    completed: false,
  })
    .sort({ dueDate: 1 })
    .limit(10)
    .populate('collegeId', 'name');

  return {
    shareLink,
    colleges: collegesWithProgress,
    upcomingTasks,
  };
}

export default async function ShareViewPage({
  params,
}: {
  params: { token: string };
}) {
  const data = await getShareData(params.token);

  if (!data) {
    redirect('/');
  }

  return <ShareViewClient data={data} />;
}
