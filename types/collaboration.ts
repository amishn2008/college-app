export type CollaboratorRelationship = 'counselor' | 'parent';

export interface CollaboratorPermissions {
  viewTasks: boolean;
  manageTasks: boolean;
  viewEssays: boolean;
  editEssays: boolean;
  viewCalendar: boolean;
  manageCalendar: boolean;
  viewFinancial: boolean;
  approveAiSuggestions: boolean;
}

export type CollaboratorPermissionKey = keyof CollaboratorPermissions;

export const COLLABORATION_PERMISSION_LABELS: Record<CollaboratorPermissionKey, string> = {
  viewTasks: 'View tasks & deadlines',
  manageTasks: 'Create & edit tasks',
  viewEssays: 'See essay drafts',
  editEssays: 'Edit essays',
  viewCalendar: 'See synced calendar feed',
  manageCalendar: 'Sync & update calendars',
  viewFinancial: 'See financial aid info',
  approveAiSuggestions: 'Approve AI rewrite suggestions',
};

export const DEFAULT_COLLABORATOR_PERMISSIONS: CollaboratorPermissions = {
  viewTasks: true,
  manageTasks: true,
  viewEssays: true,
  editEssays: true,
  viewCalendar: true,
  manageCalendar: true,
  viewFinancial: true,
  approveAiSuggestions: true,
};

export const DEFAULT_PARENT_PERMISSIONS: CollaboratorPermissions = {
  viewTasks: true,
  manageTasks: false,
  viewEssays: true,
  editEssays: false,
  viewCalendar: true,
  manageCalendar: false,
  viewFinancial: true,
  approveAiSuggestions: false,
};

export const buildDefaultPermissions = (
  relationship: CollaboratorRelationship
): CollaboratorPermissions =>
  relationship === 'parent' ? { ...DEFAULT_PARENT_PERMISSIONS } : { ...DEFAULT_COLLABORATOR_PERMISSIONS };
