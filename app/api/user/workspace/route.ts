import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { ensureWorkspace, mergeWorkspace } from '@/lib/workspace';
import { resolveStudentContext, AuthorizationError } from '@/lib/collaboration';

export async function GET(req: NextRequest) {
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
      requiredPermission: 'viewTasks',
    });
    const user = await User.findById(targetUserId);
    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const workspace = ensureWorkspace(user.workspace);
    if (!user.workspace || user.workspace.checklist?.length === 0) {
      user.workspace = workspace;
      await user.save();
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Workspace fetch error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspace: workspacePatch } = await req.json();
    if (!workspacePatch) {
      return NextResponse.json({ error: 'Missing workspace payload' }, { status: 400 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const requestedStudentId = searchParams.get('studentId');
    const { targetUserId } = await resolveStudentContext({
      actorUserId: session.user.id,
      studentId: requestedStudentId,
      requiredPermission: 'manageTasks',
    });
    const user = await User.findById(targetUserId);
    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const nextWorkspace = mergeWorkspace(user.workspace, workspacePatch);
    user.workspace = nextWorkspace;
    await user.save();

    return NextResponse.json(nextWorkspace);
  } catch (error) {
    console.error('Workspace update error:', error);
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
