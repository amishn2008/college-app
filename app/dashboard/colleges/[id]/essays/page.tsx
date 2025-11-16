import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import College from '@/models/College';
import Essay from '@/models/Essay';
import { EssayWorkspaceClient } from './EssayWorkspaceClient';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

async function getCollegeData(
  collegeId: string,
  viewerId: string,
  requestedStudentId?: string | null
) {
  await connectDB();
  const { targetUserId } = await resolveStudentContext({
    actorUserId: viewerId,
    studentId: requestedStudentId,
    requiredPermission: 'viewEssays',
  });
  const college = await College.findOne({ _id: collegeId, userId: targetUserId });
  if (!college) {
    return null;
  }
  const essays = await Essay.find({ collegeId, userId: targetUserId });
  return { college, essays };
}

export default async function EssaysPage({
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
    data = await getCollegeData(params.id, session.user.id, requestedStudentId);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect('/dashboard/collaboration');
    }
    throw error;
  }
  if (!data) {
    redirect('/dashboard');
  }

  return <EssayWorkspaceClient college={data.college} essays={data.essays} />;
}
