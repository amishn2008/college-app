export type RequirementStatus = 'not_needed' | 'in_progress' | 'complete';

export const REQUIREMENT_STATUS_VALUES: RequirementStatus[] = [
  'not_needed',
  'in_progress',
  'complete',
] as const;

export const REQUIREMENT_STATUS_LABELS: Record<RequirementStatus, string> = {
  not_needed: 'Not needed',
  in_progress: 'In progress',
  complete: 'Complete',
};

export const REQUIREMENT_KEYS = [
  'supplements',
  'recommendations',
  'testing',
  'transcript',
  'fees',
] as const;

export type RequirementKey = (typeof REQUIREMENT_KEYS)[number];

export type RequirementStatusMap = Record<RequirementKey, RequirementStatus>;

export const DEFAULT_REQUIREMENT_STATUS: RequirementStatusMap = {
  supplements: 'in_progress',
  recommendations: 'in_progress',
  testing: 'not_needed',
  transcript: 'in_progress',
  fees: 'in_progress',
};

export const ensureRequirementStatusMap = (
  current?: Partial<RequirementStatusMap> | null
): RequirementStatusMap => ({
  ...DEFAULT_REQUIREMENT_STATUS,
  ...(current || {}),
});
