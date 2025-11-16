import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';
import { generateShareToken } from '@/lib/utils';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const requestedStudentId = searchParams.get('studentId');
    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: 'editEssays',
    });
    const { showEssayContent } = await req.json();

    // Delete existing link if any
    await ShareLink.deleteOne({ userId: targetUserId });

    // Create new link
    const token = generateShareToken();
    const shareLink = await ShareLink.create({
      userId: targetUserId,
      token,
      showEssayContent: showEssayContent || false,
    });

    return NextResponse.json(shareLink);
  } catch (error) {
    console.error('Create share link error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
