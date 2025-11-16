import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';
import { ShareClient } from './ShareClient';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

async function getShareData(viewerId: string, requestedStudentId?: string | null) {
  await connectDB();
  const { targetUserId } = await resolveStudentContext({
    actorUserId: viewerId,
    studentId: requestedStudentId,
    requiredPermission: 'editEssays',
  });
  const shareLink = await ShareLink.findOne({ userId: targetUserId }).lean();
  return shareLink;
}

export default async function SharePage({
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
  let shareLink;
  try {
    shareLink = await getShareData(session.user.id, requestedStudentId);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect('/dashboard/collaboration');
    }
    throw error;
  }

  return <ShareClient initialShareLink={shareLink} />;
}
