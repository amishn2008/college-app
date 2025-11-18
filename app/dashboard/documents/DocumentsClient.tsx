'use client';

import { useState } from 'react';
import {
  Award,
  ClipboardList,
  Sparkles,
  Plus,
  Trash2,
  PencilLine,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';

type DocumentStatus = 'not_started' | 'in_progress' | 'done';

interface DocumentPrepItem {
  id: string;
  title: string;
  status: DocumentStatus;
  note?: string;
}

interface Honor {
  _id: string;
  title: string;
  level: 'School' | 'Regional' | 'State' | 'National' | 'International';
  organization: string;
  description: string;
  year: string;
  order: number;
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

interface DocumentsData {
  honors: Honor[];
  activities: Activity[];
  documentPrep: DocumentPrepItem[];
  applicationNotes: string;
}

const honorLevels = ['School', 'Regional', 'State', 'National', 'International'] as const;
const gradeOptions = ['9', '10', '11', '12', 'Postgrad'];
const activityCategories = [
  'Academic',
  'Arts',
  'Athletics',
  'Community Service',
  'Work',
  'Leadership',
  'Research',
  'Other',
] as const;

const statusLabels: Record<DocumentStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
};

const statusClasses: Record<DocumentStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700 border-gray-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  done: 'bg-green-50 text-green-700 border-green-200',
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

const emptyHonorForm: Omit<Honor, '_id' | 'order'> = {
  title: '',
  level: 'School',
  organization: '',
  description: '',
  year: '',
};

interface DeleteContext {
  type: 'honor' | 'activity';
  id: string;
  label: string;
}

const createLocalId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function DocumentsClient({ initialData }: { initialData: DocumentsData }) {
  const { appendStudentQuery } = useCollaborationContext();

  const [documentPrep, setDocumentPrep] = useState<DocumentPrepItem[]>(initialData.documentPrep);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [savingDocumentPrep, setSavingDocumentPrep] = useState(false);

  const [applicationNotes, setApplicationNotes] = useState(initialData.applicationNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  const [honors, setHonors] = useState<Honor[]>(initialData.honors);
  const [honorForm, setHonorForm] = useState(emptyHonorForm);
  const [editingHonorId, setEditingHonorId] = useState<string | null>(null);
  const [savingHonor, setSavingHonor] = useState(false);

  const [activities, setActivities] = useState<Activity[]>(initialData.activities);
  const [activityForm, setActivityForm] = useState(emptyActivityForm);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [savingActivity, setSavingActivity] = useState(false);

  const [deleteContext, setDeleteContext] = useState<DeleteContext | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const saveDocumentPrep = async (next: DocumentPrepItem[], successMessage?: string) => {
    const previous = documentPrep;
    setDocumentPrep(next);
    setSavingDocumentPrep(true);
    try {
      const res = await fetch(appendStudentQuery('/api/user/workspace'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: { documentPrep: next } }),
      });
      if (!res.ok) {
        throw new Error('Failed to save documents');
      }
      const data = await res.json();
      setDocumentPrep(data.documentPrep || next);
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (error) {
      console.error(error);
      setDocumentPrep(previous);
      toast.error('Could not save document prep');
    } finally {
      setSavingDocumentPrep(false);
    }
  };

  const handleAddDocumentItem = () => {
    if (!newDocumentTitle.trim()) return;
    const next = [
      ...documentPrep,
      { id: createLocalId(), title: newDocumentTitle.trim(), status: 'not_started' as const },
    ];
    setNewDocumentTitle('');
    saveDocumentPrep(next, 'Added to your checklist');
  };

  const handleDocumentStatusChange = (id: string, status: DocumentStatus) => {
    const next = documentPrep.map((item) => (item.id === id ? { ...item, status } : item));
    saveDocumentPrep(next, 'Status updated');
  };

  const handleDocumentNoteChange = (id: string, note: string) => {
    setDocumentPrep((prev) => prev.map((item) => (item.id === id ? { ...item, note } : item)));
  };

  const handleDocumentNoteBlur = (id: string, note: string) => {
    const next = documentPrep.map((item) => (item.id === id ? { ...item, note } : item));
    saveDocumentPrep(next, 'Notes saved');
  };

  const handleRemoveDocumentItem = (id: string) => {
    const next = documentPrep.filter((item) => item.id !== id);
    saveDocumentPrep(next, 'Item removed');
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(appendStudentQuery('/api/user/workspace'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: { generalNotes: applicationNotes } }),
      });
      if (!res.ok) {
        throw new Error('Failed to save notes');
      }
      toast.success('Notes saved');
    } catch (error) {
      console.error(error);
      toast.error('Could not save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const resetHonorForm = () => {
    setHonorForm(emptyHonorForm);
    setEditingHonorId(null);
  };

  const handleSaveHonor = async () => {
    if (!honorForm.title.trim()) {
      toast.error('Honor name is required');
      return;
    }
    setSavingHonor(true);
    try {
      const url = editingHonorId
        ? appendStudentQuery(`/api/honors/${editingHonorId}`)
        : appendStudentQuery('/api/honors');
      const method = editingHonorId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(honorForm),
      });
      if (!res.ok) throw new Error('Failed to save honor');
      const saved: Honor = await res.json();
      setHonors((prev) =>
        editingHonorId
          ? prev.map((honor) => (honor._id === saved._id ? saved : honor))
          : [...prev, saved]
      );
      toast.success(editingHonorId ? 'Honor updated' : 'Honor added');
      resetHonorForm();
    } catch (error) {
      console.error(error);
      toast.error('Could not save honor');
    } finally {
      setSavingHonor(false);
    }
  };

  const handleEditHonor = (honor: Honor) => {
    setEditingHonorId(honor._id);
    setHonorForm({
      title: honor.title,
      level: honor.level,
      organization: honor.organization,
      description: honor.description,
      year: honor.year,
    });
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
      const payload = { ...activityForm, gradeLevels: activityForm.gradeLevels };
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
      const saved: Activity = await res.json();
      setActivities((prev) =>
        editingActivityId
          ? prev.map((activity) => (activity._id === saved._id ? saved : activity))
          : [...prev, saved]
      );
      toast.success(editingActivityId ? 'Activity updated' : 'Activity added');
      setActivityForm(emptyActivityForm);
      setEditingActivityId(null);
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

  const handleOpenDelete = (context: DeleteContext) => setDeleteContext(context);

  const resetActivityForm = () => {
    setActivityForm(emptyActivityForm);
    setEditingActivityId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteContext) return;
    setDeletingId(deleteContext.id);
    try {
      const url =
        deleteContext.type === 'honor'
          ? appendStudentQuery(`/api/honors/${deleteContext.id}`)
          : appendStudentQuery(`/api/activities/${deleteContext.id}`);
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      if (deleteContext.type === 'honor') {
        setHonors((prev) => prev.filter((honor) => honor._id !== deleteContext.id));
        if (editingHonorId === deleteContext.id) {
          resetHonorForm();
        }
      } else {
        setActivities((prev) => prev.filter((activity) => activity._id !== deleteContext.id));
        if (editingActivityId === deleteContext.id) {
          resetActivityForm();
        }
      }
      toast.success('Removed');
    } catch (error) {
      console.error(error);
      toast.error('Could not delete');
    } finally {
      setDeletingId(null);
      setDeleteContext(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-primary-100">documents hub</p>
            <h1 className="text-3xl font-semibold leading-tight">
              Stage your application paperwork before deadlines hit
            </h1>
            <p className="text-sm text-primary-50 max-w-2xl">
              Keep honors, activities, and required documents tidy so you can paste into Common App and portal uploads without scrambling.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                className="bg-white text-primary-700 hover:bg-gray-100"
                onClick={resetHonorForm}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add honor
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/50 text-white hover:bg-white/10"
                onClick={resetActivityForm}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Add activity
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center text-sm w-full lg:max-w-sm">
            <Card className="bg-white/10 border-white/10 text-white">
              <p className="text-xs uppercase tracking-widest opacity-80">Honors saved</p>
              <p className="text-3xl font-bold">{honors.length}</p>
            </Card>
            <Card className="bg-white/10 border-white/10 text-white">
              <p className="text-xs uppercase tracking-widest opacity-80">Activities listed</p>
              <p className="text-3xl font-bold">{activities.length}</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary-600" />
                Application materials
              </h3>
              <p className="text-sm text-gray-600">
                Track uploads like transcripts, score reports, and brag sheets.
              </p>
            </div>
            {savingDocumentPrep && <span className="text-xs text-gray-500">Saving...</span>}
          </div>
          <div className="space-y-3">
            {documentPrep.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-3 space-y-3 bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(Object.keys(statusLabels) as DocumentStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleDocumentStatusChange(item.id, status)}
                          className={`text-xs px-3 py-1 rounded-full border ${statusClasses[status]} ${
                            item.status === status ? 'ring-2 ring-offset-1 ring-primary-200' : ''
                          }`}
                        >
                          {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocumentItem(item.id)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label="Remove document item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={item.note || ''}
                  onChange={(e) => handleDocumentNoteChange(item.id, e.target.value)}
                  onBlur={(e) => handleDocumentNoteBlur(item.id, e.target.value)}
                  placeholder="Notes, links, or where the file lives"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  rows={3}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={newDocumentTitle}
              onChange={(e) => setNewDocumentTitle(e.target.value)}
              placeholder="Add another thing you need ready (e.g., portfolio PDF)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Button type="button" onClick={handleAddDocumentItem} disabled={!newDocumentTitle.trim()}>
              Add item
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-600" />
                Application notes
              </h3>
              <p className="text-sm text-gray-600">Keep portal logins, PDF names, or reminders.</p>
            </div>
            {savingNotes && <span className="text-xs text-gray-500">Saving...</span>}
          </div>
          <textarea
            value={applicationNotes}
            onChange={(e) => setApplicationNotes(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Where you store draft PDFs, FERPA decisions, fee waiver notes, etc."
          />
          <Button
            type="button"
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="mt-4 w-full"
          >
            {savingNotes ? 'Saving…' : 'Save notes'}
          </Button>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-600" />
                Honors & awards
              </h3>
              <p className="text-sm text-gray-600">
                Keep the top items handy for Common App or scholarship portals.
              </p>
            </div>
            {savingHonor && <span className="text-xs text-gray-500">Saving...</span>}
          </div>
          <div className="space-y-3 mb-4">
            {honors.length === 0 && (
              <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-3">
                Start a list so you&apos;re not hunting for awards during submissions.
              </p>
            )}
            {honors
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((honor) => (
                <div
                  key={honor._id}
                  className="border border-gray-200 rounded-lg p-3 flex gap-3 justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{honor.title}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-1">
                      <span className="px-2 py-1 bg-gray-100 rounded-full">{honor.level}</span>
                      {honor.year && <span className="px-2 py-1 bg-gray-100 rounded-full">{honor.year}</span>}
                      {honor.organization && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full">{honor.organization}</span>
                      )}
                    </div>
                    {honor.description && (
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                        {honor.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditHonor(honor)}
                      className="text-gray-400 hover:text-primary-600"
                      aria-label="Edit honor"
                    >
                      <PencilLine className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenDelete({ type: 'honor', id: honor._id, label: honor.title })
                      }
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Delete honor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="text"
                value={honorForm.title}
                onChange={(e) => setHonorForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Honor or award name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="text"
                value={honorForm.organization}
                onChange={(e) =>
                  setHonorForm((prev) => ({ ...prev, organization: e.target.value }))
                }
                placeholder="Organization or issuer (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <select
                value={honorForm.level}
                onChange={(e) =>
                  setHonorForm((prev) => ({ ...prev, level: e.target.value as Honor['level'] }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {honorLevels.map((levelOption) => (
                  <option key={levelOption} value={levelOption}>
                    {levelOption} level
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={honorForm.year}
                onChange={(e) => setHonorForm((prev) => ({ ...prev, year: e.target.value }))}
                placeholder="Year or grade (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <textarea
              value={honorForm.description}
              onChange={(e) => setHonorForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Impact, selectivity, or context"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                onClick={handleSaveHonor}
                disabled={savingHonor}
                className="flex-1"
              >
                {savingHonor ? 'Saving…' : editingHonorId ? 'Update honor' : 'Add honor'}
              </Button>
              {editingHonorId && (
                <Button type="button" variant="outline" onClick={resetHonorForm} className="sm:w-40">
                  Cancel edit
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary-600" />
                Activities bank
              </h3>
              <p className="text-sm text-gray-600">
                Draft the 150-character blurbs before you copy them into applications.
              </p>
            </div>
            {savingActivity && <span className="text-xs text-gray-500">Saving...</span>}
          </div>
          <div className="space-y-3 mb-4">
            {activities.length === 0 && (
              <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-3">
                Capture impact-focused bullet points you can reuse across portals.
              </p>
            )}
            {activities
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((activity) => (
                <div
                  key={activity._id}
                  className="border border-gray-200 rounded-lg p-3 flex gap-3 justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">
                      {[activity.role, activity.organization].filter(Boolean).join(' • ')}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded-full">{activity.category}</span>
                      {activity.commitmentLevel && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full">
                          {activity.commitmentLevel} commitment
                        </span>
                      )}
                      {activity.gradeLevels.length > 0 && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full">
                          Grades {activity.gradeLevels.join(', ')}
                        </span>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{activity.description}</p>
                    )}
                    {activity.impact && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        Impact: {activity.impact}
                      </p>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditActivity(activity)}
                      className="text-gray-400 hover:text-primary-600"
                      aria-label="Edit activity"
                    >
                      <PencilLine className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenDelete({ type: 'activity', id: activity._id, label: activity.title })
                      }
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Delete activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={activityForm.title}
              onChange={(e) => setActivityForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Activity name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="text"
                value={activityForm.role}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Role/position"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="text"
                value={activityForm.organization}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, organization: e.target.value }))}
                placeholder="Organization"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <select
                value={activityForm.category}
                onChange={(e) =>
                  setActivityForm((prev) => ({ ...prev, category: e.target.value as Activity['category'] }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {activityCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={activityForm.commitmentLevel}
                onChange={(e) =>
                  setActivityForm((prev) => ({
                    ...prev,
                    commitmentLevel: e.target.value as Activity['commitmentLevel'],
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low commitment</option>
                <option value="medium">Medium commitment</option>
                <option value="high">High commitment</option>
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                value={activityForm.hoursPerWeek ?? ''}
                onChange={(e) => handleActivityNumberChange('hoursPerWeek', e.target.value)}
                placeholder="Hours per week"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="number"
                min="0"
                value={activityForm.weeksPerYear ?? ''}
                onChange={(e) => handleActivityNumberChange('weeksPerYear', e.target.value)}
                placeholder="Weeks per year"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {gradeOptions.map((grade) => {
                const active = activityForm.gradeLevels.includes(grade);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGradeLevel(grade)}
                    className={`text-xs px-3 py-1 rounded-full border ${
                      active ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Grade {grade}
                  </button>
                );
              })}
            </div>
            <textarea
              value={activityForm.description}
              onChange={(e) => setActivityForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="What you did (responsibilities)"
            />
            <textarea
              value={activityForm.impact}
              onChange={(e) => setActivityForm((prev) => ({ ...prev, impact: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Impact or metrics (growth, funds raised, people reached)"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                onClick={handleSaveActivity}
                disabled={savingActivity}
                className="flex-1"
              >
                {savingActivity ? 'Saving…' : editingActivityId ? 'Update activity' : 'Add activity'}
              </Button>
              {editingActivityId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetActivityForm}
                  className="sm:w-40"
                >
                  Cancel edit
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(deleteContext)}
        title="Delete entry"
        description={
          deleteContext
            ? `Remove "${deleteContext.label}" from your planner?`
            : undefined
        }
        destructive
        loading={Boolean(deletingId)}
        onClose={() => setDeleteContext(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
