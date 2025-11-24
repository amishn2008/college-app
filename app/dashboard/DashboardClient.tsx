'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Plus,
  CheckCircle2,
  Clock,
  ListChecks,
  Target,
  DollarSign,
  Link as LinkIcon,
  UserPlus,
  Trash2,
  FileText,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  CalendarDays,
  MessageCircle,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { AddCollegeModal } from '@/components/colleges/AddCollegeModal';
import toast from 'react-hot-toast';
import { DateField } from '@/components/ui/DateField';
import type { WorkspaceData } from '@/types/workspace';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';

interface College {
  _id: string;
  name: string;
  plan: string;
  deadline: Date;
  progress: {
    readinessScore: number;
    tasksCompleted: number;
    tasksTotal: number;
  };
  daysUntil: number;
}

interface Task {
  _id: string;
  title: string;
  dueDate?: Date;
  priority: string;
  label: string;
  collegeId?: string | null;
}

interface Activity {
  _id: string;
  title: string;
  role: string;
  organization: string;
  description: string;
  impact: string;
  category: string;
  gradeLevels: string[];
  hoursPerWeek: number | null;
  weeksPerYear: number | null;
  commitmentLevel: 'low' | 'medium' | 'high';
  order: number;
}

interface DashboardData {
  colleges: College[];
  todayTasks: Task[];
  allTasks: Task[];
  workspace: WorkspaceData;
  studentId: string;
  activities: Activity[];
}

type InsightView = 'colleges' | 'timeline' | 'essays';
type TaskFocus = 'today' | 'overdue' | 'priority';
type CollegeView = 'grid' | 'timeline';

interface CounselorProfile {
  name: string;
  headline: string;
  rate: string;
  focus: string;
  response: string;
  students: number;
  rating: number;
  languages: string[];
  availability: string;
  formats: string[];
  tags: string[];
}

const counselorProfiles: CounselorProfile[] = [
  {
    name: 'Lauren Chen',
    headline: 'Former Stanford admissions reader',
    rate: '$145/hr',
    focus: 'STEM + Ivy/UC',
    response: 'Replies in under 2 hours',
    students: 126,
    rating: 4.9,
    languages: ['English', 'Mandarin'],
    availability: '3 live slots this week',
    formats: ['Video', 'Async edits'],
    tags: ['Essay coaching', 'Strategy', 'Scholarships'],
  },
  {
    name: 'Marcus Rivera',
    headline: 'Lead counselor, charter network',
    rate: '$95/hr',
    focus: 'First-gen + merit aid',
    response: 'Replies same day',
    students: 214,
    rating: 4.8,
    languages: ['English', 'Spanish'],
    availability: '5 live slots this week',
    formats: ['Video', 'Office hours'],
    tags: ['Activity list', 'Interview prep', 'Financial aid'],
  },
  {
    name: 'Priya Desai',
    headline: 'Oxbridge alum + essay specialist',
    rate: '$110/hr',
    focus: 'UK + US hybrid',
    response: 'Replies within a day',
    students: 97,
    rating: 5.0,
    languages: ['English', 'Hindi'],
    availability: '2 live slots this week',
    formats: ['Video', 'Async edits'],
    tags: ['Personal statements', 'Supplemental strategy', 'Recommendations'],
  },
];

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const { appendStudentQuery } = useCollaborationContext();
  const [colleges, setColleges] = useState(initialData.colleges);
  const [todayTasks] = useState(initialData.todayTasks);
  const [allTasks, setAllTasks] = useState(initialData.allTasks);
  const [activities, setActivities] = useState<Activity[]>(initialData.activities);
  const [showAddCollege, setShowAddCollege] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceData>(initialData.workspace);
  const [brainstormDraft, setBrainstormDraft] = useState(initialData.workspace.brainstorm);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newScholarship, setNewScholarship] = useState({ name: '', amount: '', deadline: '' });
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [newRecommender, setNewRecommender] = useState({ name: '', email: '', role: '' });
  const [collegeToDelete, setCollegeToDelete] = useState<College | null>(null);
  const [isDeletingCollege, setIsDeletingCollege] = useState(false);
  const [sparkInputs, setSparkInputs] = useState<Record<string, string>>({});
  const [newClusterTitle, setNewClusterTitle] = useState('');
  const [outlineDraft, setOutlineDraft] = useState('');
  const [insightView, setInsightView] = useState<InsightView>('colleges');
  const [taskFocus, setTaskFocus] = useState<TaskFocus>('today');
  const [collegeView, setCollegeView] = useState<CollegeView>('grid');

  useEffect(() => {
    setBrainstormDraft(workspace.brainstorm);
  }, [workspace.brainstorm]);

  const handleCollegeAdded = (newCollege: College) => {
    setColleges((prev) => [...prev, newCollege]);
    setShowAddCollege(false);
    toast.success('College added!');
  };

  const handleCollegeDelete = async () => {
    if (!collegeToDelete) return;
    setIsDeletingCollege(true);
    try {
      const res = await fetch(appendStudentQuery(`/api/colleges/${collegeToDelete._id}`), {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete college');
      }
      setColleges((prev) => prev.filter((college) => college._id !== collegeToDelete._id));
      setAllTasks((prev) => prev.filter((task) => task.collegeId !== collegeToDelete._id));
      toast.success('College deleted');
    } catch (error) {
      console.error(error);
      toast.error('Could not delete college');
    } finally {
      setIsDeletingCollege(false);
      setCollegeToDelete(null);
    }
  };

  const resetActivityForm = () => {
    setActivityForm(emptyActivityForm);
    setEditingActivityId(null);
  };

  const handleActivityFieldChange = (field: keyof typeof emptyActivityForm, value: any) => {
    setActivityForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleActivityNumberChange = (field: 'hoursPerWeek' | 'weeksPerYear', value: string) => {
    const numericValue = value ? Number(value) : null;
    setActivityForm((prev) => ({ ...prev, [field]: numericValue }));
  };

  const toggleGradeLevel = (grade: string) => {
    setActivityForm((prev) => {
      const exists = prev.gradeLevels.includes(grade);
      return {
        ...prev,
        gradeLevels: exists
          ? prev.gradeLevels.filter((g) => g !== grade)
          : [...prev.gradeLevels, grade],
      };
    });
  };

  const handleSaveActivity = async () => {
    if (!activityForm.title.trim()) {
      toast.error('Activity title required');
      return;
    }
    setSavingActivity(true);
    try {
      const payload = {
        ...activityForm,
        gradeLevels: activityForm.gradeLevels,
      };
      const url = editingActivityId
        ? appendStudentQuery(`/api/activities/${editingActivityId}`)
        : appendStudentQuery('/api/activities');
      const method = editingActivityId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Failed to save activity');
      }
      const saved = await res.json();
      setActivities((prev) => {
        if (editingActivityId) {
          return prev.map((activity) => (activity._id === saved._id ? saved : activity));
        }
        return [...prev, saved].slice(0, maxActivities);
      });
      toast.success(editingActivityId ? 'Activity updated' : 'Activity added');
      resetActivityForm();
    } catch (error) {
      console.error(error);
      toast.error('Could not save activity');
    } finally {
      setSavingActivity(false);
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivityId(activity._id);
    setActivityForm({
      title: activity.title,
      role: activity.role,
      organization: activity.organization,
      description: activity.description,
      impact: activity.impact,
      category: activity.category,
      gradeLevels: activity.gradeLevels,
      hoursPerWeek: activity.hoursPerWeek,
      weeksPerYear: activity.weeksPerYear,
      commitmentLevel: activity.commitmentLevel,
    });
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const res = await fetch(appendStudentQuery(`/api/activities/${activityId}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setActivities((prev) => prev.filter((activity) => activity._id !== activityId));
      if (editingActivityId === activityId) {
        resetActivityForm();
      }
      toast.success('Activity removed');
    } catch (error) {
      console.error(error);
      toast.error('Could not delete activity');
    }
  };

  const handleBrainstormFieldBlur = (field: keyof WorkspaceData['brainstorm'], value: string) => {
    const updated = { ...brainstormDraft, [field]: value };
    persistBrainstorm(updated, { successMessage: 'Ideas saved' });
  };

  const handleAddBrainstormCluster = () => {
    if (!newClusterTitle.trim()) {
      toast.error('Give the cluster a name');
      return;
    }
    const cluster = {
      id: createLocalId(),
      title: newClusterTitle.trim(),
      sparks: [],
    };
    const updated = {
      ...brainstormDraft,
      clusters: [...brainstormDraft.clusters, cluster],
    };
    persistBrainstorm(updated, { successMessage: 'Cluster added' });
    setNewClusterTitle('');
  };

  const handleDeleteCluster = (clusterId: string) => {
    const updated = {
      ...brainstormDraft,
      clusters: brainstormDraft.clusters.filter((cluster) => cluster.id !== clusterId),
    };
    persistBrainstorm(updated, { successMessage: 'Cluster removed' });
  };

  const handleSparkDraftChange = (clusterId: string, value: string) => {
    setSparkInputs((prev) => ({ ...prev, [clusterId]: value }));
  };

  const handleAddSpark = (clusterId: string) => {
    const text = (sparkInputs[clusterId] || '').trim();
    if (!text) return;
    const updated = {
      ...brainstormDraft,
      clusters: brainstormDraft.clusters.map((cluster) =>
        cluster.id === clusterId ? { ...cluster, sparks: [...cluster.sparks, text] } : cluster
      ),
    };
    persistBrainstorm(updated);
    setSparkInputs((prev) => ({ ...prev, [clusterId]: '' }));
  };

  const handleRemoveSpark = (clusterId: string, sparkIndex: number) => {
    const updated = {
      ...brainstormDraft,
      clusters: brainstormDraft.clusters.map((cluster) =>
        cluster.id === clusterId
          ? { ...cluster, sparks: cluster.sparks.filter((_, idx) => idx !== sparkIndex) }
          : cluster
      ),
    };
    persistBrainstorm(updated);
  };

  const handleAddOutlinePoint = () => {
    if (!outlineDraft.trim()) return;
    const updated = {
      ...brainstormDraft,
      outline: [...brainstormDraft.outline, outlineDraft.trim()],
    };
    persistBrainstorm(updated);
    setOutlineDraft('');
  };

  const handleRemoveOutlinePoint = (index: number) => {
    const updated = {
      ...brainstormDraft,
      outline: brainstormDraft.outline.filter((_, idx) => idx !== index),
    };
    persistBrainstorm(updated);
  };

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

  const ACTIVITY_CATEGORIES = [
    'Academic',
    'Arts',
    'Athletics',
    'Community Service',
    'Work',
    'Leadership',
    'Research',
    'Other',
  ];
  const gradeOptions = ['9', '10', '11', '12', 'Postgrad'];
  const maxActivities = 10;

  const createLocalId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const emptyActivityForm: Omit<Activity, '_id' | 'order'> = {
    title: '',
    role: '',
    organization: '',
    description: '',
    impact: '',
    category: 'Other',
    gradeLevels: [],
    hoursPerWeek: null,
    weeksPerYear: null,
    commitmentLevel: 'medium',
  };
  const [activityForm, setActivityForm] = useState(emptyActivityForm);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [savingActivity, setSavingActivity] = useState(false);

  const updateWorkspaceData = async (
    patch: Partial<WorkspaceData>,
    options?: { section?: string; successMessage?: string }
  ) => {
    setSavingSection(options?.section || null);
    try {
      const res = await fetch(appendStudentQuery('/api/user/workspace'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: patch }),
      });
      if (!res.ok) {
        throw new Error('Failed to update workspace');
      }
      const data = await res.json();
      setWorkspace(data);
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error('Could not update workspace');
    } finally {
      setSavingSection(null);
    }
  };

  const persistBrainstorm = (
    next: WorkspaceData['brainstorm'],
    options?: { successMessage?: string }
  ) => {
    setBrainstormDraft(next);
    setWorkspace((prev) => ({ ...prev, brainstorm: next }));
    updateWorkspaceData(
      { brainstorm: next },
      { section: 'brainstorm', successMessage: options?.successMessage }
    );
  };

  const handleChecklistToggle = (key: string) => {
    const updated = workspace.checklist.map((item) =>
      item.key === key ? { ...item, completed: !item.completed } : item
    );
    setWorkspace((prev) => ({ ...prev, checklist: updated }));
    updateWorkspaceData({ checklist: updated }, { section: 'checklist' });
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistTitle.trim()) return;
    const newItem = {
      key: `custom-${createLocalId()}`,
      title: newChecklistTitle.trim(),
      description: 'Custom milestone',
      category: 'custom' as const,
      completed: false,
      isCustom: true,
    };
    const updated = [...workspace.checklist, newItem];
    setWorkspace((prev) => ({ ...prev, checklist: updated }));
    setNewChecklistTitle('');
    updateWorkspaceData(
      { checklist: updated },
      { section: 'checklist', successMessage: 'Milestone added' }
    );
  };

  const handleRemoveChecklistItem = (key: string) => {
    const item = workspace.checklist.find((entry) => entry.key === key);
    if (!item?.isCustom) return;
    const updated = workspace.checklist.filter((entry) => entry.key !== key);
    setWorkspace((prev) => ({ ...prev, checklist: updated }));
    updateWorkspaceData(
      { checklist: updated },
      { section: 'checklist', successMessage: 'Milestone removed' }
    );
  };

  const handleAddScholarship = () => {
    if (!newScholarship.name.trim()) {
      toast.error('Name is required');
      return;
    }
    const updated = [
      ...workspace.scholarships,
      {
        id: createLocalId(),
        name: newScholarship.name.trim(),
        amount: newScholarship.amount.trim(),
        deadline: newScholarship.deadline || null,
        status: 'researching' as const,
        notes: '',
      },
    ];
    setWorkspace((prev) => ({ ...prev, scholarships: updated }));
    setNewScholarship({ name: '', amount: '', deadline: '' });
    updateWorkspaceData(
      { scholarships: updated },
      { section: 'scholarships', successMessage: 'Scholarship added' }
    );
  };

  const handleUpdateScholarship = (
    id: string,
    payload: Partial<{ status: string; notes: string }>
  ) => {
    const updated = workspace.scholarships.map((entry) =>
      entry.id === id ? { ...entry, ...payload } : entry
    );
    setWorkspace((prev) => ({ ...prev, scholarships: updated }));
    updateWorkspaceData({ scholarships: updated });
  };

  const handleRemoveScholarship = (id: string) => {
    const updated = workspace.scholarships.filter((entry) => entry.id !== id);
    setWorkspace((prev) => ({ ...prev, scholarships: updated }));
    updateWorkspaceData(
      { scholarships: updated },
      { section: 'scholarships', successMessage: 'Scholarship removed' }
    );
  };

  const handleAddLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast.error('Include a title and link');
      return;
    }
    const updated = [
      ...workspace.helpfulLinks,
      { id: createLocalId(), title: newLink.title.trim(), url: newLink.url.trim() },
    ];
    setWorkspace((prev) => ({ ...prev, helpfulLinks: updated }));
    setNewLink({ title: '', url: '' });
    updateWorkspaceData(
      { helpfulLinks: updated },
      { section: 'links', successMessage: 'Link added' }
    );
  };

  const handleRemoveLink = (id: string) => {
    const updated = workspace.helpfulLinks.filter((link) => link.id !== id);
    setWorkspace((prev) => ({ ...prev, helpfulLinks: updated }));
    updateWorkspaceData(
      { helpfulLinks: updated },
      { section: 'links', successMessage: 'Link removed' }
    );
  };

  const handleAddRecommender = () => {
    if (!newRecommender.name.trim()) {
      toast.error('Recommender name is required');
      return;
    }
    const updated = [
      ...workspace.recommenders,
      {
        id: createLocalId(),
        name: newRecommender.name.trim(),
        email: newRecommender.email.trim(),
        role: newRecommender.role.trim(),
        status: 'not_started' as const,
      },
    ];
    setWorkspace((prev) => ({ ...prev, recommenders: updated }));
    setNewRecommender({ name: '', email: '', role: '' });
    updateWorkspaceData(
      { recommenders: updated },
      { section: 'recommenders', successMessage: 'Recommender added' }
    );
  };

  const handleUpdateRecommender = (id: string, status: 'not_started' | 'requested' | 'submitted') => {
    const updated = workspace.recommenders.map((rec) =>
      rec.id === id ? { ...rec, status } : rec
    );
    setWorkspace((prev) => ({ ...prev, recommenders: updated }));
    updateWorkspaceData({ recommenders: updated });
  };

  const handleRemoveRecommender = (id: string) => {
    const updated = workspace.recommenders.filter((rec) => rec.id !== id);
    setWorkspace((prev) => ({ ...prev, recommenders: updated }));
    updateWorkspaceData(
      { recommenders: updated },
      { section: 'recommenders', successMessage: 'Recommender removed' }
    );
  };

  const handleTestingSave = () => {
    updateWorkspaceData(
      { testingPlan: workspace.testingPlan },
      { section: 'testing', successMessage: 'Testing plan saved' }
    );
  };

  const handleFinancialAidSave = () => {
    updateWorkspaceData(
      { financialAid: workspace.financialAid },
      { section: 'financial', successMessage: 'Financial aid plan saved' }
    );
  };

  const handleNotesSave = () => {
    updateWorkspaceData(
      { generalNotes: workspace.generalNotes },
      { section: 'notes', successMessage: 'Notes updated' }
    );
  };

  const checklistItems = workspace.checklist;

  const checklistGroups = useMemo(() => {
    return checklistItems.reduce<Record<string, typeof checklistItems>>((acc, item) => {
      acc[item.category] = acc[item.category] || [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [checklistItems]);

  const categoryLabels: Record<string, string> = {
    application: 'Applications',
    testing: 'Testing & Scores',
    financial: 'Financial Aid',
    custom: 'Custom',
  };

  const checklistTotal = workspace.checklist.length || 1;
  const checklistCompleted = workspace.checklist.filter((item) => item.completed).length;
  const checklistProgress = Math.round((checklistCompleted / checklistTotal) * 100);
  const overdueTasks = allTasks.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;
  const highlightCollege =
    [...colleges].filter((college) => college.daysUntil >= 0).sort((a, b) => a.daysUntil - b.daysUntil)[0] ||
    colleges[0];
  const nextDeadlineLabel = highlightCollege
    ? highlightCollege.daysUntil < 0
      ? `${highlightCollege.name} overdue by ${Math.abs(highlightCollege.daysUntil)}d`
      : `${highlightCollege.name} in ${highlightCollege.daysUntil}d`
    : 'Add a college to see your timeline';

  const sortedCollegesByDeadline = useMemo(
    () => [...colleges].sort((a, b) => a.daysUntil - b.daysUntil),
    [colleges]
  );

  const essaySparkCount = useMemo(
    () => brainstormDraft.clusters.reduce((count, cluster) => count + cluster.sparks.length, 0),
    [brainstormDraft]
  );

  const spotlightTasks = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (taskFocus === 'today') {
      return todayTasks;
    }

    if (taskFocus === 'overdue') {
      return allTasks
        .filter((task) => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < now;
        })
        .slice(0, 5);
    }

    return allTasks.filter((task) => task.priority === 'high').slice(0, 5);
  }, [taskFocus, todayTasks, allTasks]);

  const spotlightEmptyCopy: Record<TaskFocus, string> = {
    today: 'No tasks due today. Enjoy the momentum!',
    overdue: 'No overdue tasks. Keep the streak going.',
    priority: 'No high-priority tasks at the moment.',
  };

  const clusterCount = brainstormDraft.clusters.length;
  const outlineCount = brainstormDraft.outline.length;

  const renderInsightContent = () => {
    if (insightView === 'timeline') {
      return (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700">Overdue tasks</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-3xl font-semibold text-amber-900">{overdueTasks}</span>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm text-amber-700">Handle these first</p>
          </div>
          <div className="rounded-2xl border border-primary-100 bg-primary-50/90 p-4">
            <p className="text-xs uppercase tracking-wide text-primary-700">Due this week</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-3xl font-semibold text-primary-900">
                {todayTasks.length}
              </span>
              <CalendarDays className="w-5 h-5 text-primary-700" />
            </div>
            <p className="text-sm text-primary-700">Including overdue carry-overs</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Next milestone</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{nextDeadlineLabel}</p>
            <p className="text-sm text-slate-500">Stay ahead of the timeline</p>
          </div>
        </div>
      );
    }

    if (insightView === 'essays') {
      return (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-xs uppercase tracking-wide text-rose-600">Idea clusters</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-3xl font-semibold text-rose-900">{clusterCount}</span>
              <Sparkles className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-sm text-rose-600">Group your best stories</p>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
            <p className="text-xs uppercase tracking-wide text-purple-600">Idea sparks</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-3xl font-semibold text-purple-900">{essaySparkCount}</span>
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-purple-600">Micro-stories identified</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-600">Outline beats</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-3xl font-semibold text-emerald-900">{outlineCount}</span>
              <ListChecks className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-emerald-600">Draft-ready structure</p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary-100 bg-primary-50/90 p-4">
          <p className="text-xs uppercase tracking-wide text-primary-700">Active colleges</p>
          <p className="mt-1 text-3xl font-semibold text-primary-900">{colleges.length}</p>
          <p className="text-sm text-primary-700">
            {highlightCollege ? `Next up: ${highlightCollege.name}` : 'Add a college to get started'}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-600">Checklist progress</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-900">{checklistProgress}%</p>
          <div className="mt-3 h-2 rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${checklistProgress}%` }}
            />
          </div>
          <p className="text-xs text-emerald-600 mt-1">
            {checklistCompleted}/{checklistTotal} milestones
          </p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <p className="text-xs uppercase tracking-wide text-sky-600">Next deadline</p>
          <p className="mt-1 text-lg font-semibold text-sky-900">{nextDeadlineLabel}</p>
          <p className="text-sm text-sky-600">Use it to anchor your week</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 text-white rounded-3xl p-6 shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.4em] opacity-80">Admissions Forge</p>
            <h1 className="text-3xl font-semibold">Ship every application with confidence</h1>
            <p className="text-primary-50">
              Track colleges, essays, tasks, and counselor collaboration from a single command
              center.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setShowAddCollege(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add college
              </Button>
              <Link
                href="/dashboard/collaboration"
                className="inline-flex items-center gap-2 rounded-lg border border-white/60 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition"
              >
                <UserPlus className="w-4 h-4" />
                Invite counselor
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm w-full lg:max-w-md">
            <Card className="bg-white/10 border-white/20 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
                Colleges tracked
              </p>
              <p className="text-3xl font-bold">{colleges.length}</p>
              <p className="text-xs opacity-80">Stay under 20 to keep your list focused</p>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Checklist</p>
              <p className="text-3xl font-bold">{checklistProgress}%</p>
              <p className="text-xs opacity-80">
                {checklistCompleted}/{checklistTotal} milestones complete
              </p>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
                Tasks open
              </p>
              <p className="text-3xl font-bold">{allTasks.length}</p>
              <p className="text-xs opacity-80">{overdueTasks} overdue</p>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
                Next deadline
              </p>
              <p className="text-sm font-semibold">{nextDeadlineLabel}</p>
            </Card>
          </div>
      </div>
    </div>

    <Card className="-mt-6 border border-primary-100 bg-white shadow-xl shadow-primary-100/40 relative z-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">
            Focus insight
          </p>
          <h2 className="text-2xl font-semibold text-gray-900">Curate what you need right now</h2>
          <p className="text-sm text-gray-500">
            Switch views to surface college, timeline, or essay signals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 uppercase">View</span>
          <select
            value={insightView}
            onChange={(e) => setInsightView(e.target.value as InsightView)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="colleges">College plan</option>
            <option value="timeline">Timeline health</option>
            <option value="essays">Essay lab</option>
          </select>
        </div>
      </div>
      <div className="mt-6">{renderInsightContent()}</div>
    </Card>

    <Card className="border border-primary-100 bg-white shadow-xl shadow-primary-100/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">
            Counselor network
          </p>
          <h2 className="text-2xl font-semibold text-gray-900">Meet counselors from your dashboard</h2>
          <p className="text-sm text-gray-500">
            Compare expertise, rates, and availability without leaving your workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/collaboration">
            <Button variant="outline" className="border-primary-200 text-primary-800 hover:bg-primary-50">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite your counselor
            </Button>
          </Link>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {counselorProfiles.map((profile) => (
          <div
            key={profile.name}
            className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-gray-900">{profile.name}</p>
                <p className="text-sm text-gray-600">{profile.headline}</p>
                <p className="text-sm text-primary-700 mt-1">{profile.focus}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                    <Star className="w-4 h-4 text-primary-600 fill-primary-500" />
                    {profile.rating} ({profile.students} students)
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-primary-800">
                    <MessageCircle className="w-4 h-4" />
                    {profile.response}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Rate</p>
                <p className="text-xl font-semibold text-gray-900">{profile.rate}</p>
                <p className="text-xs text-gray-500">{profile.availability}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-primary-50 text-primary-800 text-xs font-semibold border border-primary-100"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                <Clock className="w-4 h-4 text-gray-500" />
                {profile.formats.join(' · ')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                <Sparkles className="w-4 h-4 text-primary-500" />
                {profile.languages.join(' · ')}
              </span>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1">Book intro</Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Message
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>

    <Card className="mb-8 border border-slate-200 bg-gradient-to-br from-white to-slate-50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary-100 p-2">
            <Clock className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Spotlight tasks</h2>
            <p className="text-sm text-gray-500">
              {taskFocus === 'today' && 'Everything due today.'}
              {taskFocus === 'overdue' && 'Cleanup what slipped behind.'}
              {taskFocus === 'priority' && 'High priority items to unblock progress.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase">Filter</span>
          <select
            value={taskFocus}
            onChange={(e) => setTaskFocus(e.target.value as TaskFocus)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="today">Due today</option>
            <option value="overdue">Overdue</option>
            <option value="priority">High priority</option>
          </select>
        </div>
      </div>
      {spotlightTasks.length > 0 ? (
        <div className="space-y-2">
          {spotlightTasks.map((task) => (
            <div
              key={task._id}
              className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-1 items-start gap-3">
                <span
                  className={`mt-1 inline-flex h-3 w-3 rounded-full ${
                    task.priority === 'high'
                      ? 'bg-red-500'
                      : task.priority === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-gray-300'
                  }`}
                />
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 uppercase tracking-wide">
                      {task.label}
                    </span>
                    {task.collegeId && (
                      <span className="inline-flex rounded-full bg-primary-50 px-2 py-0.5 text-primary-700">
                        Linked college
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                {task.dueDate ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                    <CalendarDays className="w-4 h-4 text-slate-500" />
                    Due {formatDate(task.dueDate)}
                  </span>
                ) : (
                  <span className="text-xs uppercase tracking-wide text-gray-400">
                    No due date set
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 p-6 text-center text-sm text-gray-500">
          {spotlightEmptyCopy[taskFocus]}
        </div>
      )}
    </Card>

    {colleges.length === 0 ? (
      <Card className="text-center py-12">
        <p className="text-gray-600 mb-4">Add your first college to get started</p>
        <Button onClick={() => setShowAddCollege(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Your First College
        </Button>
      </Card>
    ) : (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">College progress</h2>
            <p className="text-sm text-gray-500">Toggle a dense board or linear timeline view.</p>
          </div>
          <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setCollegeView('grid')}
              className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm transition ${
                collegeView === 'grid'
                  ? 'bg-primary-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Board
            </button>
            <button
              type="button"
              onClick={() => setCollegeView('timeline')}
              className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm transition ${
                collegeView === 'timeline'
                  ? 'bg-primary-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListIcon className="w-4 h-4" />
              Timeline
            </button>
          </div>
        </div>

        {collegeView === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {colleges.map((college) => (
              <Card
                key={college._id}
                className="relative overflow-hidden border border-gray-100 bg-white/90 transition-shadow hover:shadow-xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{college.name}</h3>
                    <p className="text-sm text-gray-500">{college.plan}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCollegeToDelete(college)}
                      className="text-gray-400 hover:text-red-600 transition"
                      aria-label={`Delete ${college.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(
                        college.daysUntil
                      )}`}
                    >
                      {college.daysUntil < 0 ? 'Overdue' : `${college.daysUntil} days`}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Readiness</span>
                    <span className="font-medium">{college.progress.readinessScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getReadinessColor(
                        college.progress.readinessScore
                      )}`}
                      style={{ width: `${college.progress.readinessScore}%` }}
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <p>Deadline: {formatDate(college.deadline)}</p>
                  <p>
                    Tasks: {college.progress.tasksCompleted}/{college.progress.tasksTotal}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/colleges/${college._id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/dashboard/colleges/${college._id}/essays`} className="flex-1">
                    <Button size="sm" className="w-full">
                      Essays
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6 border-l-2 border-primary-100 pl-6">
            {sortedCollegesByDeadline.map((college) => {
              const readiness = Math.max(
                0,
                Math.min(100, college.progress.readinessScore || 0)
              );
              return (
                <div key={college._id} className="relative pl-4">
                  <span className="absolute -left-8 top-5 flex h-4 w-4 items-center justify-center rounded-full border-4 border-white bg-primary-500 shadow" />
                  <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{college.name}</p>
                        <p className="text-sm text-gray-500">{college.plan}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${
                          college.daysUntil < 0
                            ? 'bg-red-50 text-red-600'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {college.daysUntil < 0
                          ? `${Math.abs(college.daysUntil)}d overdue`
                          : `${college.daysUntil}d out`}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <CalendarDays className="w-4 h-4 text-primary-500" />
                      {college.deadline ? formatDate(college.deadline) : 'No deadline'}
                    </div>
                    <div className="mt-3">
                      <p className="text-xs uppercase text-gray-400">Readiness</p>
                      <div className="mt-1 h-2 rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-primary-500 transition-all"
                          style={{ width: `${readiness}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

    <section className="mt-12 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Application workspace</h2>
          <p className="text-gray-600 mt-1">
            Everything you usually track in spreadsheets, now alongside your dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-primary-600" />
                  Season checklist
                </h3>
                <p className="text-sm text-gray-600">
                  Track milestones for essays, testing, and paperwork.
                </p>
              </div>
              {savingSection === 'checklist' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(checklistGroups).map(([category, items]) => (
                <div key={category}>
                  <p className="text-sm font-semibold uppercase text-gray-500 mb-2">
                    {categoryLabels[category] || 'Other'}
                  </p>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleChecklistToggle(item.key)}
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-3">
                            <span className="font-medium text-gray-900">{item.title}</span>
                            {item.dueLabel && (
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {item.dueLabel}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-500">{item.description}</p>
                          )}
                        </div>
                        {item.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(item.key)}
                            className="text-gray-400 hover:text-red-500"
                            aria-label="Remove custom milestone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                placeholder="Add a custom milestone"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Button
                type="button"
                onClick={handleAddChecklistItem}
                disabled={!newChecklistTitle.trim()}
              >
                Add milestone
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  Testing plan
                </h3>
                <p className="text-sm text-gray-600">Keep SAT/ACT next steps visible.</p>
              </div>
              {savingSection === 'testing' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal score
                </label>
                <input
                  type="text"
                  value={workspace.testingPlan.goalScore || ''}
                  onChange={(e) =>
                    setWorkspace((prev) => ({
                      ...prev,
                      testingPlan: { ...prev.testingPlan, goalScore: e.target.value },
                    }))
                  }
                  placeholder="e.g., 1500+ or 33+"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <DateField
                label="Next registered test date"
                value={workspace.testingPlan.nextTestDate || ''}
                onChange={(val) =>
                  setWorkspace((prev) => ({
                    ...prev,
                    testingPlan: { ...prev.testingPlan, nextTestDate: val || null },
                  }))
                }
                placeholder="Pick the next test date"
              />
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean(workspace.testingPlan.registered)}
                  onChange={(e) =>
                    setWorkspace((prev) => ({
                      ...prev,
                      testingPlan: { ...prev.testingPlan, registered: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Registration confirmed
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={workspace.testingPlan.notes || ''}
                  onChange={(e) =>
                    setWorkspace((prev) => ({
                      ...prev,
                      testingPlan: { ...prev.testingPlan, notes: e.target.value },
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Practice test dates, tutoring reminders..."
                />
              </div>
              <Button
                type="button"
                onClick={handleTestingSave}
                disabled={savingSection === 'testing'}
              >
                {savingSection === 'testing' ? 'Saving...' : 'Save plan'}
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                  Financial aid & forms
                </h3>
                <p className="text-sm text-gray-600">
                  Track FAFSA, CSS, and priority deadlines.
                </p>
              </div>
              {savingSection === 'financial' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean(workspace.financialAid.fafsaSubmitted)}
                  onChange={(e) =>
                    setWorkspace((prev) => ({
                      ...prev,
                      financialAid: {
                        ...prev.financialAid,
                        fafsaSubmitted: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                FAFSA submitted
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean(workspace.financialAid.cssProfileSubmitted)}
                  onChange={(e) =>
                    setWorkspace((prev) => ({
                      ...prev,
                      financialAid: {
                        ...prev.financialAid,
                        cssProfileSubmitted: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                CSS Profile submitted
              </label>
              <DateField
                label="Priority deadline"
                value={workspace.financialAid.priorityDeadline || ''}
                onChange={(val) =>
                  setWorkspace((prev) => ({
                    ...prev,
                    financialAid: {
                      ...prev.financialAid,
                      priorityDeadline: val || null,
                    },
                  }))
                }
                placeholder="Pick a date"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={workspace.financialAid.notes || ''}
                  onChange={(e) =>
                    setWorkspace((prev) => ({
                      ...prev,
                      financialAid: { ...prev.financialAid, notes: e.target.value },
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Document requests, IDOC reminders..."
                />
              </div>
              <Button
                type="button"
                onClick={handleFinancialAidSave}
                disabled={savingSection === 'financial'}
              >
                {savingSection === 'financial' ? 'Saving...' : 'Save updates'}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  Scholarships
                </h3>
                <p className="text-sm text-gray-600">
                  Keep local/national scholarships visible.
                </p>
              </div>
              {savingSection === 'scholarships' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {workspace.scholarships.length === 0 && (
                <p className="text-sm text-gray-500">No scholarships added yet.</p>
              )}
              {workspace.scholarships.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-lg p-3 space-y-2"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{entry.name}</p>
                      {entry.amount && (
                        <p className="text-sm text-gray-500">{entry.amount}</p>
                      )}
                      {entry.deadline && (
                        <p className="text-xs text-gray-500 mt-1">
                          Due {formatDate(entry.deadline)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveScholarship(entry.id)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Remove scholarship"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <select
                      value={entry.status}
                      onChange={(e) =>
                        handleUpdateScholarship(entry.id, { status: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="researching">Researching</option>
                      <option value="drafting">Drafting</option>
                      <option value="submitted">Submitted</option>
                      <option value="won">Won</option>
                      <option value="lost">Not awarded</option>
                    </select>
                    <textarea
                      value={entry.notes || ''}
                      onChange={(e) =>
                        handleUpdateScholarship(entry.id, { notes: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Notes, link, follow-ups..."
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={newScholarship.name}
                onChange={(e) =>
                  setNewScholarship((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Scholarship name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="text"
                value={newScholarship.amount}
                onChange={(e) =>
                  setNewScholarship((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="Award amount (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <DateField
                label="Deadline (optional)"
                value={newScholarship.deadline}
                onChange={(val) =>
                  setNewScholarship((prev) => ({ ...prev, deadline: val }))
                }
                placeholder="Pick a date"
              />
              <Button
                type="button"
                onClick={handleAddScholarship}
                disabled={!newScholarship.name.trim()}
                className="w-full"
              >
                Add scholarship
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary-600" />
                  Recommenders
                </h3>
                <p className="text-sm text-gray-600">Make sure every letter is on track.</p>
              </div>
              {savingSection === 'recommenders' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {workspace.recommenders.length === 0 && (
                <p className="text-sm text-gray-500">Add teachers, mentors, or counselors.</p>
              )}
              {workspace.recommenders.map((rec) => (
                <div
                  key={rec.id}
                  className="border border-gray-200 rounded-lg p-3 space-y-2"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{rec.name}</p>
                      {(rec.role || rec.email) && (
                        <p className="text-sm text-gray-500">
                          {[rec.role, rec.email].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecommender(rec.id)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Remove recommender"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <select
                    value={rec.status}
                    onChange={(e) =>
                      handleUpdateRecommender(rec.id, e.target.value as any)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="not_started">Not started</option>
                    <option value="requested">Requested</option>
                    <option value="submitted">Submitted</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={newRecommender.name}
                onChange={(e) =>
                  setNewRecommender((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="email"
                value={newRecommender.email}
                onChange={(e) =>
                  setNewRecommender((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Email (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="text"
                value={newRecommender.role}
                onChange={(e) =>
                  setNewRecommender((prev) => ({ ...prev, role: e.target.value }))
                }
                placeholder="Role (teacher, counselor...)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Button
                type="button"
                onClick={handleAddRecommender}
                disabled={!newRecommender.name.trim()}
                className="w-full"
              >
                Add recommender
              </Button>
            </div>
          </Card>
        </div>

      <section className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">Activities studio</h3>
              <p className="text-sm text-gray-600">
                Map the 10 slots you&apos;ll submit on the Common App—role, impact, and time
                commitment.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {activities.length}/{maxActivities} filled
              </p>
            </div>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {activities.length === 0 && (
              <p className="text-sm text-gray-500">No activities yet. Add your first one below.</p>
            )}
            {activities
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((activity) => (
                <div
                  key={activity._id}
                  className="border border-gray-200 rounded-lg p-4 space-y-2 bg-white/70"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">
                        {[activity.role, activity.organization].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditActivity(activity)}
                        className="text-gray-400 hover:text-primary-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteActivity(activity._id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                      {activity.category}
                    </span>
                    {activity.gradeLevels.map((grade) => (
                      <span
                        key={`${activity._id}-${grade}`}
                        className="px-2 py-0.5 rounded-full bg-gray-100"
                      >
                        Grade {grade}
                      </span>
                    ))}
                    {(activity.hoursPerWeek || activity.weeksPerYear) && (
                      <span>
                        {activity.hoursPerWeek ?? 0} hrs/wk × {activity.weeksPerYear ?? 0} wks/yr
                      </span>
                    )}
                  </div>
                  {activity.description && (
                    <p className="text-sm text-gray-700">{activity.description}</p>
                  )}
                  {activity.impact && (
                    <p className="text-xs text-gray-500 italic">Impact: {activity.impact}</p>
                  )}
                </div>
              ))}
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h4 className="font-semibold text-gray-900">
              {editingActivityId ? 'Edit activity' : 'Add activity'}
            </h4>
            <input
              type="text"
              value={activityForm.title}
              onChange={(e) => handleActivityFieldChange('title', e.target.value)}
              placeholder="Activity name (e.g., Robotics Club)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={activityForm.role}
                onChange={(e) => handleActivityFieldChange('role', e.target.value)}
                placeholder="Role/position"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="text"
                value={activityForm.organization}
                onChange={(e) => handleActivityFieldChange('organization', e.target.value)}
                placeholder="Organization"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={activityForm.category}
                onChange={(e) => handleActivityFieldChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {ACTIVITY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={activityForm.commitmentLevel}
                onChange={(e) =>
                  handleActivityFieldChange(
                    'commitmentLevel',
                    e.target.value as Activity['commitmentLevel']
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low weekly time</option>
                <option value="medium">Moderate</option>
                <option value="high">High commitment</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {gradeOptions.map((grade) => {
                const active = activityForm.gradeLevels.includes(grade);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGradeLevel(grade)}
                    className={`px-3 py-1 rounded-full border ${
                      active ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300'
                    }`}
                  >
                    Grade {grade}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                value={activityForm.hoursPerWeek ?? ''}
                onChange={(e) => handleActivityNumberChange('hoursPerWeek', e.target.value)}
                placeholder="Hours/week"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="number"
                min="0"
                value={activityForm.weeksPerYear ?? ''}
                onChange={(e) => handleActivityNumberChange('weeksPerYear', e.target.value)}
                placeholder="Weeks/year"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <textarea
              value={activityForm.description}
              onChange={(e) => handleActivityFieldChange('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="What do you do? (150 characters)"
            />
            <textarea
              value={activityForm.impact}
              onChange={(e) => handleActivityFieldChange('impact', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Impact / leadership highlight"
            />
            <div className="flex gap-3">
              {editingActivityId && (
                <Button type="button" variant="outline" onClick={resetActivityForm} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                onClick={handleSaveActivity}
                disabled={savingActivity || (!editingActivityId && activities.length >= maxActivities)}
                className="flex-1"
              >
                {savingActivity ? 'Saving…' : editingActivityId ? 'Update activity' : 'Add activity'}
              </Button>
            </div>
            {!editingActivityId && activities.length >= maxActivities && (
              <p className="text-xs text-amber-600">
                You&apos;ve reached the Common App limit of {maxActivities} activities.
              </p>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">Essay brainstorm lab</h3>
              <p className="text-sm text-gray-600">
                Build a mindmap of sparks, then convert them into an outline you can draft from.
              </p>
            </div>
            {savingSection === 'brainstorm' && (
              <span className="text-xs text-gray-500">Syncing…</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={brainstormDraft.prompt}
              onChange={(e) =>
                setBrainstormDraft((prev) => ({ ...prev, prompt: e.target.value }))
              }
              onBlur={(e) => handleBrainstormFieldBlur('prompt', e.target.value)}
              placeholder="Prompt question"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <input
              type="text"
              value={brainstormDraft.centralTheme}
              onChange={(e) =>
                setBrainstormDraft((prev) => ({ ...prev, centralTheme: e.target.value }))
              }
              onBlur={(e) => handleBrainstormFieldBlur('centralTheme', e.target.value)}
              placeholder="Central theme"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {brainstormDraft.clusters.map((cluster) => (
              <div key={cluster.id} className="border border-dashed border-gray-300 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{cluster.title}</p>
                    {cluster.lesson && (
                      <p className="text-xs text-gray-500">{cluster.lesson}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCluster(cluster.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {cluster.sparks.map((spark, idx) => (
                    <span
                      key={`${cluster.id}-${idx}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-xs text-primary-700"
                    >
                      {spark}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpark(cluster.id, idx)}
                        className="text-primary-400 hover:text-primary-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sparkInputs[cluster.id] || ''}
                    onChange={(e) => handleSparkDraftChange(cluster.id, e.target.value)}
                    placeholder="Add spark"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <Button type="button" size="sm" onClick={() => handleAddSpark(cluster.id)}>
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newClusterTitle}
              onChange={(e) => setNewClusterTitle(e.target.value)}
              placeholder="New cluster (e.g., Mentorship moments)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Button type="button" onClick={handleAddBrainstormCluster}>
              Add cluster
            </Button>
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-900">Outline builder</p>
            <div className="flex flex-wrap gap-2">
              {brainstormDraft.outline.map((point, idx) => (
                <span
                  key={`${point}-${idx}`}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm"
                >
                  {idx + 1}. {point}
                  <button
                    type="button"
                    onClick={() => handleRemoveOutlinePoint(idx)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
              {brainstormDraft.outline.length === 0 && (
                <p className="text-sm text-gray-500">Add beats for intro, body, and takeaway.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={outlineDraft}
                onChange={(e) => setOutlineDraft(e.target.value)}
                placeholder="Add outline beat"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Button type="button" onClick={handleAddOutlinePoint}>
                Add beat
              </Button>
            </div>
            <textarea
              value={brainstormDraft.nextSteps || ''}
              onChange={(e) =>
                setBrainstormDraft((prev) => ({ ...prev, nextSteps: e.target.value }))
              }
              onBlur={(e) => handleBrainstormFieldBlur('nextSteps', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="What will you draft next?"
            />
          </div>
        </Card>
      </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-primary-600" />
                  Helpful links
                </h3>
                <p className="text-sm text-gray-600">Portals, scholarship docs, research.</p>
              </div>
              {savingSection === 'links' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <div className="space-y-2">
              {workspace.helpfulLinks.length === 0 && (
                <p className="text-sm text-gray-500">Add links you look up often.</p>
              )}
              {workspace.helpfulLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 font-medium truncate hover:underline"
                  >
                    {link.title}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(link.id)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label="Remove link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={newLink.title}
                onChange={(e) =>
                  setNewLink((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="url"
                value={newLink.url}
                onChange={(e) =>
                  setNewLink((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Button
                type="button"
                onClick={handleAddLink}
                disabled={!newLink.title.trim() || !newLink.url.trim()}
                className="w-full"
              >
                Add link
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Application notes
                </h3>
                <p className="text-sm text-gray-600">
                  Brain dump anything that does not fit elsewhere.
                </p>
              </div>
              {savingSection === 'notes' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
            <textarea
              value={workspace.generalNotes || ''}
              onChange={(e) =>
                setWorkspace((prev) => ({ ...prev, generalNotes: e.target.value }))
              }
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ideas, meeting notes, counselor reminders..."
            />
            <Button
              type="button"
              onClick={handleNotesSave}
              disabled={savingSection === 'notes'}
              className="mt-4"
            >
              {savingSection === 'notes' ? 'Saving...' : 'Save notes'}
            </Button>
          </Card>
        </div>
      </section>

      {showAddCollege && (
        <AddCollegeModal
          onClose={() => setShowAddCollege(false)}
          onSuccess={handleCollegeAdded}
        />
      )}

      <ConfirmDialog
        open={!!collegeToDelete}
        title="Delete college"
        description={
          collegeToDelete
            ? `This will delete ${collegeToDelete.name} along with its tasks and essay drafts.`
            : undefined
        }
        confirmLabel="Delete college"
        cancelLabel="Keep college"
        destructive
        loading={isDeletingCollege}
        onClose={() => {
          if (!isDeletingCollege) {
            setCollegeToDelete(null);
          }
        }}
        onConfirm={handleCollegeDelete}
      />
    </div>
  );
}
