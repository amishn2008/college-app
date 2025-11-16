export interface CounselorStudentSnapshot {
  id: string;
  linkId: string;
  name: string;
  email: string;
  intakeYear?: number;
  status: 'pending' | 'active' | 'revoked';
  relationship: 'counselor' | 'parent';
  permissions: Record<string, boolean>;
  updatedAt: string | null;
  acceptedAt: string | null;
  metrics: {
    openTasks: number;
    urgentTasks: number;
    overdueTasks: number;
    highPriority: number;
    colleges: number;
    nextDeadline: string | null;
    essayDrafts: number;
    essaysCompleted: number;
  };
}
