import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ApplicationDocument from '@/models/ApplicationDocument';
import College from '@/models/College';
import { DocumentVaultClient } from './DocumentVaultClient';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

async function getDocumentVaultData(viewerId: string, requestedStudentId?: string | null) {
  await connectDB();

  const { targetUserId } = await resolveStudentContext({
    actorUserId: viewerId,
    studentId: requestedStudentId,
    requiredPermission: 'viewTasks',
  });

  const [documents, colleges] = await Promise.all([
    ApplicationDocument.find({ userId: targetUserId }).sort({ updatedAt: -1 }).lean(),
    College.find({ userId: targetUserId }).sort({ name: 1 }).select('name plan deadline').lean(),
  ]);

  const collegeMap = new Map(colleges.map((college) => [college._id.toString(), college.name]));

  const serializedDocuments = documents.map((doc) => ({
    _id: doc._id.toString(),
    title: doc.title,
    category: doc.category,
    status: doc.status,
    description: doc.description || '',
    fileUrl: doc.fileUrl || '',
    tags: doc.tags || [],
    collegeIds: Array.isArray(doc.collegeIds) ? doc.collegeIds.map((id) => id.toString()) : [],
    collegeNames: Array.isArray(doc.collegeIds)
      ? doc.collegeIds.map((id) => collegeMap.get(id.toString()) || 'Unassigned')
      : [],
    metadata: doc.metadata
      ? {
          ...doc.metadata,
          testDate: doc.metadata.testDate ? doc.metadata.testDate.toISOString() : undefined,
        }
      : {},
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
  }));

  const serializedColleges = colleges.map((college) => ({
    _id: college._id.toString(),
    name: college.name,
    plan: college.plan,
    deadline: college.deadline ? college.deadline.toISOString() : null,
  }));

  return { documents: serializedDocuments, colleges: serializedColleges };
}

export default async function DocumentVaultPage({
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
    data = await getDocumentVaultData(session.user.id, requestedStudentId);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect('/dashboard/collaboration');
    }
    throw error;
  }

  return <DocumentVaultClient initialData={data} />;
}
