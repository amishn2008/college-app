'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import {
  formatDate,
  getDaysUntilDeadline,
} from '@/lib/utils';
import {
  REQUIREMENT_KEYS,
  REQUIREMENT_STATUS_LABELS,
  REQUIREMENT_STATUS_VALUES,
  ensureRequirementStatusMap,
  type RequirementKey,
  type RequirementStatus,
} from '@/types/college';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  ClipboardList,
  Link as LinkIcon,
  NotebookPen,
  DollarSign,
  CalendarClock,
  Trash2,
  Plus,
} from 'lucide-react';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface CustomRequirement {
  _id?: string;
  title: string;
  completed: boolean;
}

interface CollegeRequirements {
  mainEssay: boolean;
  supplements: boolean;
  recommendations: boolean;
  testing: boolean;
  transcript: boolean;
  fees: boolean;
  custom: CustomRequirement[];
}

interface College {
  _id: string;
  name: string;
  plan: string;
  deadline: string | Date;
  daysUntil: number;
  progress: {
    readinessScore: number;
    tasksCompleted: number;
    tasksTotal: number;
    essaysCompleted: number;
    essaysTotal: number;
  };
  requirements: CollegeRequirements;
  requirementStatus?: Partial<Record<RequirementKey, RequirementStatus>>;
  portal?: {
    url?: string;
    notes?: string;
  };
  status?: {
    phase?: string;
    decision?: string;
    submittedAt?: string | Date | null;
    decisionDate?: string | Date | null;
    notes?: string;
  };
  financialAid?: {
    priorityDeadline?: string | Date | null;
    scholarshipUrl?: string;
    notes?: string;
  };
  interview?: {
    required?: boolean;
    scheduledAt?: string | Date | null;
    notes?: string;
  };
}

interface Task {
  _id: string;
  title: string;
  label: string;
  dueDate?: string | Date;
  completed: boolean;
  priority: string;
}

interface Essay {
  _id: string;
  title: string;
  currentWordCount: number;
  wordLimit: number;
  completed: boolean;
}

interface CollegeDetailData {
  college: College;
  tasks: Task[];
  essays: Essay[];
}

const requirementMeta: Record<RequirementKey, { label: string; helper: string }> = {
  supplements: {
    label: 'Supplements',
    helper: 'Use for Why Us, short answers, and program essays.',
  },
  recommendations: {
    label: 'Recommendations',
    helper: 'Track teacher, counselor, or mentor recs.',
  },
  testing: {
    label: 'Testing',
    helper: 'Only mark complete when the school has official scores.',
  },
  transcript: {
    label: 'Transcript',
    helper: 'Registrar paperwork or self-reported grades.',
  },
  fees: {
    label: 'Application fee',
    helper: 'Waiver, payment, or proof of submission.',
  },
};

const PHASE_OPTIONS = [
  { value: 'researching', label: 'Researching' },
  { value: 'drafting', label: 'Drafting' },
  { value: 'ready', label: 'Ready to submit' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'decision', label: 'Decision in' },
];

const DECISION_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'deferred', label: 'Deferred' },
];

const toDateInput = (value?: string | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().split('T')[0];
};

const normalizeCustomRequirements = (entries?: Array<any> | null): CustomRequirement[] =>
  (entries || []).map((entry) => {
    const rawId = entry?._id ?? entry?.id;
    const normalizedId =
      typeof rawId === 'string'
        ? rawId
        : rawId?.toString?.() ?? entry?.title;

    return {
      _id: normalizedId,
      title: entry?.title ?? '',
      completed: !!entry?.completed,
    };
  });

const normalizeCollege = (incoming: any): College => ({
  ...incoming,
  daysUntil: incoming.daysUntil ?? getDaysUntilDeadline(incoming.deadline),
  requirements: {
    mainEssay: incoming.requirements?.mainEssay !== false,
    supplements: !!incoming.requirements?.supplements,
    recommendations: !!incoming.requirements?.recommendations,
    testing: !!incoming.requirements?.testing,
    transcript: !!incoming.requirements?.transcript,
    fees: !!incoming.requirements?.fees,
    custom: normalizeCustomRequirements(incoming.requirements?.custom),
  },
});

export function CollegeDetailClient({ data }: { data: CollegeDetailData }) {
  const { appendStudentQuery } = useCollaborationContext();
  const router = useRouter();
  const [college, setCollege] = useState<College>(() => normalizeCollege(data.college));
  const { tasks, essays } = data;
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [newRequirementTitle, setNewRequirementTitle] = useState('');

  const [portalForm, setPortalForm] = useState({
    url: college.portal?.url || '',
    notes: college.portal?.notes || '',
  });
  const [statusForm, setStatusForm] = useState({
    phase: college.status?.phase || 'researching',
    decision: college.status?.decision || 'pending',
    submittedAt: toDateInput(college.status?.submittedAt),
    decisionDate: toDateInput(college.status?.decisionDate),
    notes: college.status?.notes || '',
  });
  const [financialForm, setFinancialForm] = useState({
    priorityDeadline: toDateInput(college.financialAid?.priorityDeadline),
    scholarshipUrl: college.financialAid?.scholarshipUrl || '',
    notes: college.financialAid?.notes || '',
  });
  const [interviewForm, setInterviewForm] = useState({
    required: college.interview?.required ?? false,
    scheduledAt: toDateInput(college.interview?.scheduledAt),
    notes: college.interview?.notes || '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingCollege, setIsDeletingCollege] = useState(false);

  useEffect(() => {
    setPortalForm({
      url: college.portal?.url || '',
      notes: college.portal?.notes || '',
    });
  }, [college.portal?.url, college.portal?.notes]);

  useEffect(() => {
    setStatusForm({
      phase: college.status?.phase || 'researching',
      decision: college.status?.decision || 'pending',
      submittedAt: toDateInput(college.status?.submittedAt),
      decisionDate: toDateInput(college.status?.decisionDate),
      notes: college.status?.notes || '',
    });
  }, [
    college.status?.phase,
    college.status?.decision,
    college.status?.submittedAt,
    college.status?.decisionDate,
    college.status?.notes,
  ]);

  useEffect(() => {
    setFinancialForm({
      priorityDeadline: toDateInput(college.financialAid?.priorityDeadline),
      scholarshipUrl: college.financialAid?.scholarshipUrl || '',
      notes: college.financialAid?.notes || '',
    });
  }, [
    college.financialAid?.priorityDeadline,
    college.financialAid?.scholarshipUrl,
    college.financialAid?.notes,
  ]);

  useEffect(() => {
    setInterviewForm({
      required: college.interview?.required ?? false,
      scheduledAt: toDateInput(college.interview?.scheduledAt),
      notes: college.interview?.notes || '',
    });
  }, [college.interview?.required, college.interview?.scheduledAt, college.interview?.notes]);

  const requirementStatus = useMemo(
    () => ensureRequirementStatusMap(college.requirementStatus),
    [college.requirementStatus]
  );

  const pendingTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((task) => task.completed), [tasks]);
  const mainEssayComplete = college.progress.essaysCompleted > 0;
  const customRequirements = college.requirements.custom;

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'text-red-600 bg-red-50';
    if (daysUntil <= 7) return 'text-amber-600 bg-amber-50';
    if (daysUntil <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const updateCollege = async (
    payload: Record<string, unknown>,
    options?: { section?: string; successMessage?: string }
  ) => {
    if (options?.section) {
      setSavingSection(options.section);
    }
    try {
      const res = await fetch(appendStudentQuery(`/api/colleges/${college._id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Request failed');
      }
      const updated = normalizeCollege(await res.json());
      setCollege(updated);
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error('Could not update college');
      throw error;
    } finally {
      if (options?.section) {
        setSavingSection(null);
      }
    }
  };

  const handleDeleteCollege = async () => {
    setIsDeletingCollege(true);
    try {
      const res = await fetch(appendStudentQuery(`/api/colleges/${college._id}`), {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete college');
      }
      toast.success('College deleted');
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Could not delete college');
    } finally {
      setIsDeletingCollege(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRequirementStatusChange = (key: RequirementKey, status: RequirementStatus) => {
    if (requirementStatus[key] === status) return;
    updateCollege(
      { requirementStatus: { [key]: status } },
      { section: 'requirements', successMessage: 'Requirement updated' }
    ).catch(() => {});
  };

  const handleMainEssayToggle = (include: boolean) => {
    updateCollege(
      { requirements: { mainEssay: include } },
      { section: 'requirements', successMessage: 'Updated readiness tracking' }
    ).catch(() => {});
  };

  const serializeCustomRequirements = () =>
    college.requirements.custom.map((entry) => ({
      _id: entry._id,
      title: entry.title,
      completed: entry.completed,
    }));

  const handleCustomRequirementToggle = (id: string | undefined, completed: boolean) => {
    const updated = serializeCustomRequirements().map((entry) =>
      entry._id === id ? { ...entry, completed } : entry
    );
    updateCollege(
      { requirements: { custom: updated } },
      { section: 'requirements' }
    ).catch(() => {});
  };

  const handleCustomRequirementDelete = (id: string | undefined) => {
    const updated = serializeCustomRequirements().filter((entry) => entry._id !== id);
    updateCollege(
      { requirements: { custom: updated } },
      { section: 'requirements', successMessage: 'Removed checkpoint' }
    ).catch(() => {});
  };

  const handleAddCustomRequirement = () => {
    if (!newRequirementTitle.trim()) return;
    const updated = [
      ...serializeCustomRequirements(),
      {
        title: newRequirementTitle.trim(),
        completed: false,
      },
    ];
    setNewRequirementTitle('');
    updateCollege(
      { requirements: { custom: updated } },
      { section: 'requirements', successMessage: 'Added checkpoint' }
    ).catch(() => {});
  };

  const handlePortalSave = () => {
    updateCollege(
      { portal: portalForm },
      { section: 'portal', successMessage: 'Portal saved' }
    ).catch(() => {});
  };

  const handleStatusSave = () => {
    updateCollege(
      {
        status: {
          phase: statusForm.phase,
          decision: statusForm.decision,
          submittedAt: statusForm.submittedAt || null,
          decisionDate: statusForm.decisionDate || null,
          notes: statusForm.notes || '',
        },
      },
      { section: 'status', successMessage: 'Status updated' }
    ).catch(() => {});
  };

  const handleFinancialSave = () => {
    updateCollege(
      {
        financialAid: {
          priorityDeadline: financialForm.priorityDeadline || null,
          scholarshipUrl: financialForm.scholarshipUrl || '',
          notes: financialForm.notes || '',
        },
      },
      { section: 'financial', successMessage: 'Financial plan updated' }
    ).catch(() => {});
  };

  const handleInterviewSave = () => {
    updateCollege(
      {
        interview: {
          required: interviewForm.required,
          scheduledAt: interviewForm.scheduledAt || null,
          notes: interviewForm.notes || '',
        },
      },
      { section: 'interview', successMessage: 'Interview plan updated' }
    ).catch(() => {});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{college.name}</h1>
            <p className="text-gray-600 mt-1">
              {college.plan} • Deadline: {formatDate(college.deadline)}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-lg text-sm font-medium ${getUrgencyColor(college.daysUntil)}`}
          >
            {college.daysUntil < 0 ? 'Overdue' : `${college.daysUntil} days until deadline`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Progress overview</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Readiness Score</span>
                  <span className="font-medium">{college.progress.readinessScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${getReadinessColor(
                      college.progress.readinessScore
                    )}`}
                    style={{ width: `${college.progress.readinessScore}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tasks:</span>{' '}
                  <span className="font-medium">
                    {college.progress.tasksCompleted}/{college.progress.tasksTotal}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Essays:</span>{' '}
                  <span className="font-medium">
                    {college.progress.essaysCompleted}/{college.progress.essaysTotal}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Tasks</h2>
                <p className="text-sm text-gray-500">Stay ahead of your own deadlines.</p>
              </div>
              <Link href={`/dashboard/colleges/${college._id}/essays`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Essay workspace →
              </Link>
            </div>
            {pendingTasks.length > 0 && (
              <div className="space-y-2 mb-4">
                {pendingTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-gray-500">{task.label}</div>
                    </div>
                    {task.dueDate && (
                      <span className="text-sm text-gray-600">
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {completedTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Completed ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  {completedTasks.slice(0, 5).map((task) => (
                    <div
                      key={task._id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm opacity-60"
                    >
                      <span className="line-through">{task.title}</span>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tasks.length === 0 && (
              <p className="text-gray-500 text-center py-4">No tasks yet</p>
            )}
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary-600" />
                  Requirements & checkpoints
                </h3>
                <p className="text-sm text-gray-600">
                  Replace your spreadsheet of must-do items with statuses you can update quickly.
                </p>
              </div>
              {savingSection === 'requirements' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                <div>
                  <p className="font-medium text-gray-900">Main essay</p>
                  <p className="text-xs text-gray-500">
                    Auto-completes when an essay is marked complete in the workspace.
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    mainEssayComplete ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {mainEssayComplete ? 'Complete' : 'In progress'}
                </span>
              </div>
              {REQUIREMENT_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border border-gray-200 rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{requirementMeta[key].label}</p>
                    <p className="text-xs text-gray-500">{requirementMeta[key].helper}</p>
                  </div>
                  <select
                    value={requirementStatus[key]}
                    onChange={(e) => handleRequirementStatusChange(key, e.target.value as RequirementStatus)}
                    className="mt-1 md:mt-0 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {REQUIREMENT_STATUS_VALUES.map((status) => (
                      <option key={status} value={status}>
                        {REQUIREMENT_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-900">Include in readiness score</p>
                  <p className="text-xs text-gray-500">
                    Turn off if this school does not need the Common App personal statement.
                  </p>
                </div>
                <label className="flex items-center gap-2 mt-2 sm:mt-0">
                  <input
                    type="checkbox"
                    checked={college.requirements.mainEssay}
                    onChange={(e) => handleMainEssayToggle(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">
                    {college.requirements.mainEssay ? 'Included' : 'Ignored'}
                  </span>
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold uppercase text-gray-500">
                    Custom checkpoints
                  </p>
                  {customRequirements.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {
                        customRequirements.filter((item) => item.completed)
                          .length
                      }
                      /{customRequirements.length} done
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {customRequirements.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Add school-specific steps like honors apps, CSS Profile, or scholarships.
                    </p>
                  )}
                  {customRequirements.map((entry) => (
                    <div
                      key={entry._id || entry.title}
                      className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2 bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={entry.completed}
                        onChange={(e) =>
                          handleCustomRequirementToggle(entry._id, e.target.checked)
                        }
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span
                        className={`flex-1 text-sm ${
                          entry.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {entry.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCustomRequirementDelete(entry._id)}
                        className="text-gray-400 hover:text-red-500"
                        aria-label="Remove checkpoint"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newRequirementTitle}
                    onChange={(e) => setNewRequirementTitle(e.target.value)}
                    placeholder="e.g., Honors essay, CSS Profile"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomRequirement}
                    disabled={!newRequirementTitle.trim() || savingSection === 'requirements'}
                    className="flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/dashboard/colleges/${college._id}/essays`}>
                <button className="w-full text-left px-4 py-2 bg-primary-50 hover:bg-primary-100 rounded-lg text-primary-700 font-medium">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Open Essay Workspace
                </button>
              </Link>
              <Link href="/dashboard/tasks">
                <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 font-medium">
                  <Clock className="w-4 h-4 inline mr-2" />
                  View All Tasks
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full text-left px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-700 font-medium"
              >
                <Trash2 className="w-4 h-4 inline mr-2" />
                Delete College
              </button>
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Portal & links
                </h3>
                <p className="text-sm text-gray-600">
                  Keep login links or research notes a click away.
                </p>
              </div>
              {savingSection === 'portal' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Application portal / research link
                </label>
                <input
                  type="url"
                  value={portalForm.url}
                  onChange={(e) =>
                    setPortalForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://apply.university.edu"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Notes
                </label>
                <textarea
                  value={portalForm.notes}
                  onChange={(e) =>
                    setPortalForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Portal login instructions, rep contact, why this school..."
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {portalForm.url && (
                <a
                  href={portalForm.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1"
                >
                  <Button type="button" variant="outline" className="w-full">
                    Open portal
                  </Button>
                </a>
              )}
              <Button
                type="button"
                onClick={handlePortalSave}
                disabled={savingSection === 'portal'}
                className="flex-1"
              >
                {savingSection === 'portal' ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <NotebookPen className="w-4 h-4" />
                  Application status
                </h3>
                <p className="text-sm text-gray-600">
                  Track submission timing and decisions.
                </p>
              </div>
              {savingSection === 'status' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Phase
                </label>
                <select
                  value={statusForm.phase}
                  onChange={(e) =>
                    setStatusForm((prev) => ({ ...prev, phase: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {PHASE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <DateField
                label="Submitted on"
                value={statusForm.submittedAt}
                onChange={(value) =>
                  setStatusForm((prev) => ({ ...prev, submittedAt: value }))
                }
              />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Decision
                </label>
                <select
                  value={statusForm.decision}
                  onChange={(e) =>
                    setStatusForm((prev) => ({ ...prev, decision: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {DECISION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <DateField
                label="Decision arrives on"
                value={statusForm.decisionDate}
                onChange={(value) =>
                  setStatusForm((prev) => ({ ...prev, decisionDate: value }))
                }
              />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Notes
                </label>
                <textarea
                  value={statusForm.notes}
                  onChange={(e) =>
                    setStatusForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={handleStatusSave}
              disabled={savingSection === 'status'}
              className="mt-4 w-full"
            >
              {savingSection === 'status' ? 'Saving…' : 'Save status'}
            </Button>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Financial aid plan
                </h3>
                <p className="text-sm text-gray-600">
                  Keep FAFSA/CSS deadlines and scholarship links close.
                </p>
              </div>
              {savingSection === 'financial' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <div className="space-y-3">
              <DateField
                label="Priority deadline"
                value={financialForm.priorityDeadline}
                onChange={(value) =>
                  setFinancialForm((prev) => ({ ...prev, priorityDeadline: value }))
                }
              />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Scholarship / aid link
                </label>
                <input
                  type="url"
                  value={financialForm.scholarshipUrl}
                  onChange={(e) =>
                    setFinancialForm((prev) => ({ ...prev, scholarshipUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Notes
                </label>
                <textarea
                  value={financialForm.notes}
                  onChange={(e) =>
                    setFinancialForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={handleFinancialSave}
              disabled={savingSection === 'financial'}
              className="mt-4 w-full"
            >
              {savingSection === 'financial' ? 'Saving…' : 'Save plan'}
            </Button>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  Interview prep
                </h3>
                <p className="text-sm text-gray-600">
                  Log mock interview dates or alumni calls.
                </p>
              </div>
              {savingSection === 'interview' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={interviewForm.required}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({ ...prev, required: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Interview required
              </label>
              <DateField
                label="Interview date"
                value={interviewForm.scheduledAt}
                onChange={(value) =>
                  setInterviewForm((prev) => ({ ...prev, scheduledAt: value }))
                }
                disabled={!interviewForm.required}
                helperText={!interviewForm.required ? 'Enable “Interview required” to track a date.' : undefined}
              />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Notes
                </label>
                <textarea
                  value={interviewForm.notes}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Alumni name, reminders, focus topics..."
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={handleInterviewSave}
              disabled={savingSection === 'interview'}
              className="mt-4 w-full"
            >
              {savingSection === 'interview' ? 'Saving…' : 'Save interview plan'}
            </Button>
          </Card>

          {essays.length > 0 && (
            <Card>
              <h3 className="font-semibold mb-4">Essays</h3>
              <div className="space-y-2">
                {essays.map((essay) => (
                  <Link
                    key={essay._id}
                    href={`/dashboard/colleges/${college._id}/essays`}
                    className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg"
                  >
                    <div className="font-medium text-sm">{essay.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {essay.currentWordCount}/{essay.wordLimit} words
                      {essay.completed && <span className="ml-2 text-green-600">✓</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete college"
        description="Deleting this college also removes its tasks, reminders, and essay drafts. This action cannot be undone."
        confirmLabel="Delete college"
        cancelLabel="Keep college"
        destructive
        loading={isDeletingCollege}
        onClose={() => {
          if (!isDeletingCollege) {
            setShowDeleteConfirm(false);
          }
        }}
        onConfirm={handleDeleteCollege}
      />
    </div>
  );
}
