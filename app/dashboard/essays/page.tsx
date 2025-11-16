import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Essay from '@/models/Essay';
import College from '@/models/College';
import User from '@/models/User';
import { EssayDashboardClient } from './EssayDashboardClient';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

async function getEssayDashboardData(viewerId: string, requestedStudentId?: string | null) {
  await connectDB();
  const { targetUserId, viewer } = await resolveStudentContext({
    actorUserId: viewerId,
    studentId: requestedStudentId,
    requiredPermission: 'viewEssays',
  });

  const [essays, colleges] = await Promise.all([
    Essay.find({ userId: targetUserId }).sort({ updatedAt: -1 }).lean(),
    College.find({ userId: targetUserId }).sort({ name: 1 }).select('name plan deadline').lean(),
  ]);

  const UNASSIGNED_ID = 'unassigned';

  const collegeMap = new Map(
    colleges.map((college) => [college._id.toString(), college])
  );

  const serializedEssays = essays.map((essay) => {
    const collegeId = essay.collegeId?.toString() ?? UNASSIGNED_ID;
    const college = collegeMap.get(collegeId);

    const annotations =
      (essay.rewriteApprovals || [])
        .filter(
          (approval) =>
            typeof approval.selectionStart === 'number' &&
            typeof approval.selectionEnd === 'number'
        )
        .map((approval) => ({
          _id: approval._id?.toString() || '',
          selection: approval.content || '',
          note: approval.instruction || '',
          selectionStart: approval.selectionStart ?? 0,
          selectionEnd: approval.selectionEnd ?? 0,
          author: approval.approvedBy?.name,
          createdAt: approval.approvedAt ? approval.approvedAt.toISOString() : null,
        })) || [];

    return {
      _id: essay._id.toString(),
      collegeId,
      collegeName: college?.name ?? 'Unassigned / Common App',
      title: essay.title,
      prompt: essay.prompt || '',
      wordLimit: essay.wordLimit,
      currentContent: essay.currentContent || '',
      currentWordCount: essay.currentWordCount || 0,
      versions: (essay.versions || []).map((version) => ({
        name: version.name,
        content: version.content,
        wordCount: version.wordCount,
        createdAt: version.createdAt ? version.createdAt.toISOString() : new Date().toISOString(),
      })),
      completed: essay.completed || false,
      completedAt: essay.completedAt ? essay.completedAt.toISOString() : null,
      createdAt: essay.createdAt ? essay.createdAt.toISOString() : null,
      updatedAt: essay.updatedAt ? essay.updatedAt.toISOString() : null,
      wordLimitProgress: essay.wordLimit ? (essay.currentWordCount / essay.wordLimit) * 100 : 0,
      rewriteApprovals: (essay.rewriteApprovals || []).map((approval) => ({
        _id: approval._id?.toString(),
        instruction: approval.instruction,
        content: approval.content,
        approvedAt: approval.approvedAt ? approval.approvedAt.toISOString() : null,
        approvedBy: approval.approvedBy
          ? {
              userId: approval.approvedBy.userId?.toString(),
              name: approval.approvedBy.name,
            }
          : undefined,
        selectionStart: approval.selectionStart,
        selectionEnd: approval.selectionEnd,
      })),
      annotations,
    };
  });

  const unassignedOption = {
    _id: UNASSIGNED_ID,
    name: 'Unassigned / Common App',
    plan: 'General',
    deadline: null,
  };

  const serializedColleges = [
    unassignedOption,
    ...colleges.map((college) => ({
      _id: college._id.toString(),
      name: college.name,
      plan: college.plan,
      deadline: college.deadline ? college.deadline.toISOString() : null,
    })),
  ];

  const student = await User.findById(targetUserId)
    .select('name email intakeYear role')
    .lean();

  return {
    initialEssays: serializedEssays,
    colleges: serializedColleges,
    viewerRole: viewer.role,
    studentMeta: student
      ? {
          id: student._id.toString(),
          name: student.name || student.email || 'Student',
          email: student.email,
          intakeYear: student.intakeYear,
        }
      : null,
  };
}

export default async function EssayDashboardPage({
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
    data = await getEssayDashboardData(session.user.id, requestedStudentId);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect('/dashboard/collaboration');
    }
    throw error;
  }
  return (
    <EssayDashboardClient
      initialEssays={data.initialEssays}
      colleges={data.colleges}
      viewerRole={session.user.role as 'student' | 'counselor' | 'parent'}
      studentMeta={data.studentMeta}
    />
  );
}
