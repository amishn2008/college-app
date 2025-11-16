import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import CollaboratorLink from '@/models/CollaboratorLink';
import { CollaborationClient } from './CollaborationClient';

async function getCollaborationLinks(userId: string, role: string) {
  await connectDB();
  const filter =
    role === 'counselor' || role === 'parent'
      ? { collaboratorId: userId }
      : { studentId: userId };

  const links = await CollaboratorLink.find(filter)
    .populate('studentId', 'name email image role intakeYear')
    .populate('collaboratorId', 'name email image role')
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(links));
}

export default async function CollaborationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const links = await getCollaborationLinks(session.user.id, session.user.role || 'student');

  return <CollaborationClient initialLinks={links} viewerRole={session.user.role || 'student'} />;
}
