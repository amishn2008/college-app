export type ChecklistCategory = 'application' | 'testing' | 'financial' | 'custom';

export interface ChecklistItem {
  key: string;
  title: string;
  description: string;
  category: ChecklistCategory;
  completed: boolean;
  dueLabel?: string;
  isCustom?: boolean;
}

export interface TestingPlan {
  nextTestDate?: string | null;
  goalScore?: string;
  registered?: boolean;
  notes?: string;
}

export interface FinancialAidPlan {
  fafsaSubmitted?: boolean;
  cssProfileSubmitted?: boolean;
  priorityDeadline?: string | null;
  notes?: string;
}

export type ScholarshipStatus = 'researching' | 'drafting' | 'submitted' | 'won' | 'lost';

export interface ScholarshipEntry {
  id: string;
  name: string;
  amount?: string;
  deadline?: string | null;
  status: ScholarshipStatus;
  notes?: string;
}

export type RecommenderStatus = 'not_started' | 'requested' | 'submitted';

export interface RecommenderEntry {
  id: string;
  name: string;
  email?: string;
  role?: string;
  status: RecommenderStatus;
}

export interface HelpfulLink {
  id: string;
  title: string;
  url: string;
}

export interface BrainstormCluster {
  id: string;
  title: string;
  sparks: string[];
  lesson?: string;
  emotion?: string;
}

export interface BrainstormWorkspace {
  prompt: string;
  centralTheme: string;
  outcome?: string;
  clusters: BrainstormCluster[];
  outline: string[];
  nextSteps?: string;
}

export interface WorkspaceData {
  checklist: ChecklistItem[];
  testingPlan: TestingPlan;
  financialAid: FinancialAidPlan;
  scholarships: ScholarshipEntry[];
  recommenders: RecommenderEntry[];
  helpfulLinks: HelpfulLink[];
  generalNotes: string;
  brainstorm: BrainstormWorkspace;
}
