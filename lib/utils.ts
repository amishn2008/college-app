import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  DEFAULT_REQUIREMENT_STATUS,
  REQUIREMENT_KEYS,
  type RequirementStatusMap,
} from '@/types/college';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateReadinessScore(
  tasksCompleted: number,
  tasksTotal: number,
  essaysCompleted: number,
  essaysTotal: number,
  requirementsCompleted: number,
  requirementsTotal: number
): number {
  if (tasksTotal === 0 && essaysTotal === 0 && requirementsTotal === 0) {
    return 0;
  }

  const taskWeight = 0.4;
  const essayWeight = 0.4;
  const requirementWeight = 0.2;

  const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;
  const essayScore = essaysTotal > 0 ? (essaysCompleted / essaysTotal) * 100 : 0;
  const requirementScore = requirementsTotal > 0 ? (requirementsCompleted / requirementsTotal) * 100 : 0;

  return Math.round(
    taskScore * taskWeight + essayScore * essayWeight + requirementScore * requirementWeight
  );
}

export function getDaysUntilDeadline(deadline: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

const NUMERIC_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

export function formatNumericDate(date: Date | string | number | null | undefined): string {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return NUMERIC_DATE_FORMATTER.format(parsed);
}

export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return DATE_TIME_FORMATTER.format(parsed);
}

export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export interface RequirementProgressInput {
  requirementStatus?: RequirementStatusMap | null;
  customRequirements?: Array<{ completed?: boolean } | null | undefined>;
  includeMainEssay?: boolean;
  mainEssayComplete?: boolean;
}

export interface RequirementProgressSummary {
  completed: number;
  total: number;
}

export function summarizeRequirementProgress({
  requirementStatus,
  customRequirements,
  includeMainEssay = true,
  mainEssayComplete = false,
}: RequirementProgressInput): RequirementProgressSummary {
  const statusMap: RequirementStatusMap = {
    ...DEFAULT_REQUIREMENT_STATUS,
    ...(requirementStatus || {}),
  };

  let completed = 0;
  let total = 0;

  if (includeMainEssay) {
    total += 1;
    if (mainEssayComplete) {
      completed += 1;
    }
  }

  REQUIREMENT_KEYS.forEach((key) => {
    const status = statusMap[key];
    if (status === 'not_needed') {
      return;
    }
    total += 1;
    if (status === 'complete') {
      completed += 1;
    }
  });

  (customRequirements || []).forEach((entry) => {
    if (!entry) return;
    total += 1;
    if (entry.completed) {
      completed += 1;
    }
  });

  return {
    completed,
    total,
  };
}
