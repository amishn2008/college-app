import type {
  CollaboratorPermissions,
  CollaboratorRelationship,
} from '@/types/collaboration';
import { buildDefaultPermissions } from '@/types/collaboration';

export const sanitizePermissionsPayload = (
  permissions?: Partial<CollaboratorPermissions> | null,
  relationship: CollaboratorRelationship = 'counselor'
): CollaboratorPermissions => {
  const base = buildDefaultPermissions(relationship);
  if (!permissions) return base;

  return Object.keys(base).reduce((acc, key) => {
    const typedKey = key as keyof CollaboratorPermissions;
    if (permissions[typedKey] === undefined) {
      acc[typedKey] = base[typedKey];
    } else {
      acc[typedKey] = Boolean(permissions[typedKey]);
    }
    return acc;
  }, {} as CollaboratorPermissions);
};
