import type { Types } from 'mongoose';
import CollaboratorLink, { ICollaboratorLink } from '@/models/CollaboratorLink';
import User, { IUser, UserRole } from '@/models/User';
import type { CollaboratorPermissionKey } from '@/types/collaboration';

export class AuthorizationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

export interface StudentContextOptions {
  actorUserId: string;
  studentId?: string | null;
  requiredPermission?: CollaboratorPermissionKey;
  fallbackToSelf?: boolean;
}

export interface StudentContextResult {
  viewer: IUser;
  targetUserId: string;
  collaboratorLink?: ICollaboratorLink | null;
}

const normalizeId = (id?: Types.ObjectId | string | null): string | null => {
  if (!id) return null;
  return typeof id === 'string' ? id : id.toString();
};

const ensureStudentId = (
  viewer: IUser,
  requestedStudentId?: string | null,
  fallbackToSelf?: boolean
): string | null => {
  if (requestedStudentId) {
    return requestedStudentId;
  }

  if (viewer.role === 'student' && fallbackToSelf !== false) {
    return viewer._id.toString();
  }

  return normalizeId(viewer.activeStudentId);
};

export async function resolveStudentContext({
  actorUserId,
  studentId,
  requiredPermission,
  fallbackToSelf = true,
}: StudentContextOptions): Promise<StudentContextResult> {
  const viewer = await User.findById(actorUserId);
  if (!viewer) {
    throw new AuthorizationError('User not found', 401);
  }

  // Ensure student users always default to themselves.
  if (viewer.role === 'student' && !viewer.activeStudentId) {
    viewer.activeStudentId = viewer._id;
    await viewer.save();
  }

  const isCollaborator = ['counselor', 'parent'].includes(viewer.role as UserRole);
  const buildFallbackFilter = () => {
    const filter: Record<string, unknown> = {
      collaboratorId: viewer._id,
      status: 'active',
    };
    if (requiredPermission) {
      filter[`permissions.${requiredPermission}`] = true;
    }
    return filter;
  };

  const applyFallbackLink = async (link: ICollaboratorLink | null) => {
    if (!link) return null;
    viewer.activeStudentId = link.studentId;
    await viewer.save();
    return link;
  };

  let effectiveStudentId = ensureStudentId(viewer, studentId, fallbackToSelf);
  let collaboratorLink: ICollaboratorLink | null = null;

  if (!effectiveStudentId) {
    if (!isCollaborator) {
      throw new AuthorizationError('Select a student to continue', 400);
    }
    collaboratorLink = await applyFallbackLink(
      await CollaboratorLink.findOne(buildFallbackFilter()).sort({
        lastSeenAt: -1,
        updatedAt: -1,
        createdAt: -1,
      })
    );
    if (!collaboratorLink) {
      throw new AuthorizationError(
        'No shared students available yet. Ask a student to grant you access from their Collaboration settings.',
        400
      );
    }
    effectiveStudentId = collaboratorLink.studentId.toString();
  }

  const viewerId = viewer._id.toString();
  if (viewerId === effectiveStudentId) {
    return { viewer, targetUserId: effectiveStudentId };
  }

  if (!isCollaborator) {
    throw new AuthorizationError('Not allowed to act on behalf of another user');
  }

  if (!collaboratorLink) {
    collaboratorLink = await CollaboratorLink.findOne({
      studentId: effectiveStudentId,
      collaboratorId: viewer._id,
      status: 'active',
    });
  }

  if (!collaboratorLink) {
    collaboratorLink = await applyFallbackLink(
      await CollaboratorLink.findOne(buildFallbackFilter()).sort({
        lastSeenAt: -1,
        updatedAt: -1,
        createdAt: -1,
      })
    );
    if (collaboratorLink) {
      effectiveStudentId = collaboratorLink.studentId.toString();
    }
  }

  if (!collaboratorLink) {
    throw new AuthorizationError('Collaboration link not found');
  }

  if (requiredPermission && !collaboratorLink.permissions?.[requiredPermission]) {
    throw new AuthorizationError('Missing required permission');
  }

  return { viewer, targetUserId: effectiveStudentId, collaboratorLink };
}

export const hasPermission = (
  link: Pick<ICollaboratorLink, 'permissions'> | null | undefined,
  permission: CollaboratorPermissionKey
): boolean => {
  if (!link) return false;
  return Boolean(link.permissions?.[permission]);
};
