import { randomUUID } from 'crypto';
import {
  ChecklistItem,
  WorkspaceData,
  ScholarshipEntry,
  RecommenderEntry,
  HelpfulLink,
  BrainstormCluster,
  DocumentPrepItem,
} from '@/types/workspace';

const baseChecklist: ChecklistItem[] = [
  {
    key: 'common-app-profile',
    title: 'Complete Common App profile',
    description: 'Fill in personal info, activities, and coursework.',
    category: 'application',
    completed: false,
    dueLabel: 'August',
  },
  {
    key: 'essay-draft',
    title: 'Lock main personal statement draft',
    description: 'Finalize a solid draft before supplement season ramps up.',
    category: 'application',
    completed: false,
    dueLabel: 'September',
  },
  {
    key: 'fafsa',
    title: 'Submit FAFSA',
    description: 'Gather tax documents and submit as soon as it opens.',
    category: 'financial',
    completed: false,
    dueLabel: 'October',
  },
  {
    key: 'css-profile',
    title: 'Submit CSS Profile (if required)',
    description: 'Private colleges often require this in addition to FAFSA.',
    category: 'financial',
    completed: false,
    dueLabel: 'October',
  },
  {
    key: 'testing-plan',
    title: 'Book final SAT/ACT test date',
    description: 'Give yourself enough runway for score release.',
    category: 'testing',
    completed: false,
    dueLabel: '2+ months before deadlines',
  },
  {
    key: 'recommenders',
    title: 'Confirm recommenders & send brag sheet',
    description: 'Provide context, deadlines, and submission instructions.',
    category: 'application',
    completed: false,
    dueLabel: 'September',
  },
];

const clone = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

const withIds = <T extends { id?: string }>(items: T[], prefix: string): (T & { id: string })[] =>
  items.map((item, index) => ({
    ...item,
    id: item.id || `${prefix}-${randomUUID?.() ?? `${Date.now()}-${index}`}`,
  }));

const withClusterIds = (clusters: BrainstormCluster[]): BrainstormCluster[] =>
  clusters.map((cluster, index) => ({
    ...cluster,
    id: cluster.id || `cluster-${randomUUID?.() ?? `${Date.now()}-${index}`}`,
    sparks: cluster.sparks || [],
  }));

export const buildDefaultWorkspace = (): WorkspaceData => ({
  checklist: baseChecklist.map((item) => ({ ...item })),
  testingPlan: {
    registered: false,
    goalScore: '',
    nextTestDate: null,
    notes: '',
  },
  financialAid: {
    fafsaSubmitted: false,
    cssProfileSubmitted: false,
    priorityDeadline: null,
    notes: '',
  },
  scholarships: [],
  recommenders: [],
  helpfulLinks: [],
  generalNotes: '',
  brainstorm: {
    prompt: 'What story ties your values and impact together?',
    centralTheme: '',
    outcome: '',
    clusters: withClusterIds([
      {
        id: '',
        title: 'Formative moments',
        sparks: ['Family traditions', 'Community challenges', 'Personal turning points'],
        lesson: 'Identity + values',
      },
      {
        id: '',
        title: 'Impact & action',
        sparks: ['Projects you led', 'Teams you lifted', 'Problems you solved'],
        lesson: 'Leadership & service',
      },
    ]),
    outline: [],
    nextSteps: '',
  },
  documentPrep: withIds<DocumentPrepItem>(
    [
      { id: '', title: 'Brag sheet or resume PDF', status: 'not_started' },
      { id: '', title: 'Unofficial transcript saved', status: 'not_started' },
      { id: '', title: 'Testing score report (SAT/ACT/AP)', status: 'not_started' },
      { id: '', title: 'Activities + honors list drafted', status: 'not_started' },
    ],
    'doc'
  ),
});

export const ensureWorkspace = (data?: WorkspaceData | null): WorkspaceData => {
  if (!data) {
    return buildDefaultWorkspace();
  }

  const workspace = clone(data);
  if (!workspace.checklist || workspace.checklist.length === 0) {
    workspace.checklist = buildDefaultWorkspace().checklist;
  }

  workspace.scholarships = withIds(workspace.scholarships || [], 'sch');
  workspace.recommenders = withIds(workspace.recommenders || [], 'rec');
  workspace.helpfulLinks = withIds(workspace.helpfulLinks || [], 'link');
  workspace.documentPrep = withIds(
    workspace.documentPrep || buildDefaultWorkspace().documentPrep,
    'doc'
  );

  workspace.testingPlan ??= buildDefaultWorkspace().testingPlan;
  workspace.financialAid ??= buildDefaultWorkspace().financialAid;
  workspace.generalNotes ??= '';
  workspace.brainstorm = withBrainstormDefaults(workspace.brainstorm);

  return workspace;
};

const withBrainstormDefaults = (brainstorm?: WorkspaceData['brainstorm']): WorkspaceData['brainstorm'] => {
  if (!brainstorm) {
    return buildDefaultWorkspace().brainstorm;
  }
  return {
    prompt: brainstorm.prompt ?? buildDefaultWorkspace().brainstorm.prompt,
    centralTheme: brainstorm.centralTheme ?? '',
    outcome: brainstorm.outcome ?? '',
    clusters: withClusterIds(brainstorm.clusters || buildDefaultWorkspace().brainstorm.clusters),
    outline: Array.isArray(brainstorm.outline) ? brainstorm.outline : [],
    nextSteps: brainstorm.nextSteps ?? '',
  };
};

export const mergeWorkspace = (
  current: WorkspaceData | null | undefined,
  patch: Partial<WorkspaceData>
): WorkspaceData => {
  const base = ensureWorkspace(current);

  if (patch.checklist) {
    base.checklist = patch.checklist;
  }

  if (patch.testingPlan) {
    base.testingPlan = {
      ...base.testingPlan,
      ...patch.testingPlan,
    };
  }

  if (patch.financialAid) {
    base.financialAid = {
      ...base.financialAid,
      ...patch.financialAid,
    };
  }

  if (patch.generalNotes !== undefined) {
    base.generalNotes = patch.generalNotes;
  }

  if (patch.brainstorm) {
    base.brainstorm = {
      ...base.brainstorm,
      ...patch.brainstorm,
      clusters: withClusterIds(patch.brainstorm.clusters ?? base.brainstorm.clusters),
      outline: patch.brainstorm.outline ?? base.brainstorm.outline,
    };
  } else {
    base.brainstorm = withBrainstormDefaults(base.brainstorm);
  }

  if (patch.scholarships) {
    base.scholarships = withIds(patch.scholarships, 'sch');
  } else {
    base.scholarships = withIds(base.scholarships, 'sch');
  }

  if (patch.recommenders) {
    base.recommenders = withIds(patch.recommenders, 'rec');
  } else {
    base.recommenders = withIds(base.recommenders, 'rec');
  }

  if (patch.helpfulLinks) {
    base.helpfulLinks = withIds(patch.helpfulLinks, 'link');
  } else {
    base.helpfulLinks = withIds(base.helpfulLinks, 'link');
  }

  if (patch.documentPrep) {
    base.documentPrep = withIds(patch.documentPrep, 'doc');
  } else {
    base.documentPrep = withIds(base.documentPrep || [], 'doc');
  }

  return base;
};

export type {
  ChecklistItem,
  WorkspaceData,
  ScholarshipEntry,
  RecommenderEntry,
  HelpfulLink,
  DocumentPrepItem,
};
