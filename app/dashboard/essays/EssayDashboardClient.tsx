'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EssayEditor } from '@/components/essays/EssayEditor';
import { AIPanel } from '@/components/essays/AIPanel';
import {
  Plus,
  CheckCircle2,
  Target,
  Layers,
  Sparkles,
  Search,
  Filter,
  FileText,
  BookmarkCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';

const createLocalId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `essay-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

interface EssayVersion {
  name: string;
  content: string;
  wordCount: number;
  createdAt: string;
}

interface EssayApproval {
  _id?: string;
  instruction?: string;
  content: string;
  approvedAt?: string;
  approvedBy?: {
    name?: string;
  };
}

interface EssayWithCollege {
  _id: string;
  collegeId: string;
  collegeName: string;
  title: string;
  prompt: string;
  wordLimit: number;
  currentContent: string;
  currentWordCount: number;
  versions: EssayVersion[];
  completed: boolean;
  completedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  wordLimitProgress?: number;
  rewriteApprovals?: EssayApproval[];
  annotations?: EssayAnnotation[];
}

interface CollegeOption {
  _id: string;
  name: string;
  plan: string;
  deadline: string | null;
}

interface StudentMeta {
  id: string;
  name: string;
  email: string;
  intakeYear?: number;
}

interface EssayDashboardClientProps {
  initialEssays: EssayWithCollege[];
  colleges: CollegeOption[];
  viewerRole: 'student' | 'counselor' | 'parent';
  studentMeta: StudentMeta | null;
}

type StatusFilter = 'all' | 'completed' | 'draft';

export function EssayDashboardClient({
  initialEssays,
  colleges,
  viewerRole,
  studentMeta,
}: EssayDashboardClientProps) {
  const { appendStudentQuery } = useCollaborationContext();
  const [essays, setEssays] = useState<EssayWithCollege[]>(initialEssays);
  const [selectedEssayId, setSelectedEssayId] = useState<string | null>(
    initialEssays[0]?._id ?? null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showNewEssayModal, setShowNewEssayModal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiMode, setAiMode] = useState<'critique' | 'rewrite' | 'coach'>('critique');
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

  const collegesMap = useMemo(
    () => new Map(colleges.map((college) => [college._id, college])),
    [colleges]
  );

  const filteredEssays = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return essays
      .filter((essay) => {
        if (collegeFilter !== 'all' && essay.collegeId !== collegeFilter) {
          return false;
        }
        if (statusFilter === 'completed' && !essay.completed) {
          return false;
        }
        if (statusFilter === 'draft' && essay.completed) {
          return false;
        }
        if (!query) return true;
        return (
          essay.title.toLowerCase().includes(query) ||
          essay.prompt.toLowerCase().includes(query) ||
          essay.collegeName.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [essays, collegeFilter, statusFilter, searchQuery]);

  const selectedEssay = useMemo(
    () => essays.find((essay) => essay._id === selectedEssayId) ?? null,
    [essays, selectedEssayId]
  );

  useEffect(() => {
    if (filteredEssays.length === 0) {
      setSelectedEssayId(null);
      return;
    }

    if (!selectedEssay || !filteredEssays.some((essay) => essay._id === selectedEssay._id)) {
      setSelectedEssayId(filteredEssays[0]._id);
    }
  }, [filteredEssays, selectedEssay]);

  const stats = useMemo(() => {
    const total = essays.length;
    const completed = essays.filter((essay) => essay.completed).length;
    const drafts = total - completed;
    const lastUpdated = essays.reduce<string | null>((latest, essay) => {
      if (!essay.updatedAt) return latest;
      if (!latest) return essay.updatedAt;
      return new Date(essay.updatedAt) > new Date(latest) ? essay.updatedAt : latest;
    }, null);
    const commonApp = essays.filter((essay) =>
      essay.collegeName.toLowerCase().includes('common')
    ).length;
    const ucEssays = essays.filter((essay) =>
      essay.collegeName.toLowerCase().includes('uc')
    ).length;

    return { total, completed, drafts, lastUpdated, commonApp, ucEssays };
  }, [essays]);

  const formatEssayFromResponse = (payload: any, fallback?: EssayWithCollege): EssayWithCollege => {
    const fallbackCollegeId = fallback?.collegeId ?? 'unassigned';
    const collegeId = payload.collegeId?.toString() || fallbackCollegeId || 'unassigned';
    const collegeName =
      collegesMap.get(collegeId)?.name || fallback?.collegeName || 'Unassigned';
    const wordLimit = payload.wordLimit ?? fallback?.wordLimit ?? 650;
    const currentWordCount = payload.currentWordCount ?? fallback?.currentWordCount ?? 0;

    return {
      _id: payload._id?.toString() || fallback?._id || createLocalId(),
      collegeId,
      collegeName,
      title: payload.title ?? fallback?.title ?? '',
      prompt: payload.prompt ?? fallback?.prompt ?? '',
      wordLimit,
      currentContent: payload.currentContent ?? fallback?.currentContent ?? '',
      currentWordCount,
      versions: Array.isArray(payload.versions)
        ? payload.versions.map((version: any) => ({
            name: version.name,
            content: version.content,
            wordCount: version.wordCount,
            createdAt: version.createdAt
              ? new Date(version.createdAt).toISOString()
              : new Date().toISOString(),
          }))
        : fallback?.versions ?? [],
      rewriteApprovals: Array.isArray(payload.rewriteApprovals)
        ? payload.rewriteApprovals.map((approval: any) => ({
            _id: approval._id?.toString?.() || approval._id,
            instruction: approval.instruction,
            content: approval.content,
            approvedAt: approval.approvedAt
              ? new Date(approval.approvedAt).toISOString()
              : undefined,
            approvedBy: approval.approvedBy,
          }))
        : fallback?.rewriteApprovals ?? [],
      completed: payload.completed ?? fallback?.completed ?? false,
      completedAt: payload.completedAt
        ? new Date(payload.completedAt).toISOString()
        : null,
      createdAt: payload.createdAt
        ? new Date(payload.createdAt).toISOString()
        : fallback?.createdAt ?? null,
      updatedAt: payload.updatedAt
        ? new Date(payload.updatedAt).toISOString()
        : new Date().toISOString(),
      wordLimitProgress: wordLimit ? Math.min(100, (currentWordCount / wordLimit) * 100) : 0,
      annotations: Array.isArray(payload.rewriteApprovals)
        ? payload.rewriteApprovals
            .filter(
              (approval: any) =>
                approval.selectionStart !== undefined && approval.selectionEnd !== undefined
            )
            .map((approval: any) => ({
              _id: approval._id?.toString?.() || approval._id || createLocalId(),
              selection: approval.content || '',
              note: approval.instruction || '',
              selectionStart: approval.selectionStart ?? 0,
              selectionEnd: approval.selectionEnd ?? 0,
              author: approval.approvedBy?.name,
              createdAt: approval.approvedAt
                ? new Date(approval.approvedAt).toISOString()
                : undefined,
            }))
        : [],
    };
  };

  const handleSave = async (content: string) => {
    if (!selectedEssay) return;

    try {
      const res = await fetch(appendStudentQuery(`/api/essays/${selectedEssay._id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentContent: content }),
      });

      if (!res.ok) {
        throw new Error('Failed to save essay');
      }

      const updated = formatEssayFromResponse(await res.json(), selectedEssay);
      setEssays((prev) => prev.map((essay) => (essay._id === updated._id ? updated : essay)));
      setSelectedEssayId(updated._id);
      toast.success('Saved');
    } catch (error) {
      console.error(error);
      toast.error('Could not save essay');
    }
  };

  const handleSaveVersion = async (name: string) => {
    if (!selectedEssay) return;

    try {
      const res = await fetch(appendStudentQuery(`/api/essays/${selectedEssay._id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveVersion: true, versionName: name }),
      });

      if (!res.ok) {
        throw new Error('Failed to save version');
      }

      const updated = formatEssayFromResponse(await res.json(), selectedEssay);
      setEssays((prev) => prev.map((essay) => (essay._id === updated._id ? updated : essay)));
      setSelectedEssayId(updated._id);
      toast.success('Version saved');
    } catch (error) {
      console.error(error);
      toast.error('Could not save version');
    }
  };

  const handleRewriteApplied = (newContent: string) => {
    if (!selectedEssay) return;
    const updatedEssay = {
      ...selectedEssay,
      currentContent: newContent,
      currentWordCount: newContent.trim().split(/\s+/).filter((word) => word.length > 0).length,
    };
    setEssays((prev) => prev.map((essay) => (essay._id === updatedEssay._id ? updatedEssay : essay)));
  };

  const handleToggleComplete = async () => {
    if (!selectedEssay) return;
    try {
      const res = await fetch(appendStudentQuery(`/api/essays/${selectedEssay._id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !selectedEssay.completed }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      const updated = formatEssayFromResponse(await res.json(), selectedEssay);
      setEssays((prev) => prev.map((essay) => (essay._id === updated._id ? updated : essay)));
      setSelectedEssayId(updated._id);
      toast.success(updated.completed ? 'Marked as complete' : 'Marked as in progress');
    } catch (error) {
      console.error(error);
      toast.error('Could not update status');
    }
  };

  const handleCreateEssay = async (payload: {
    collegeId: string;
    title: string;
    prompt: string;
    wordLimit: number;
  }) => {
    try {
      const requestBody = {
        ...payload,
        collegeId: payload.collegeId === 'unassigned' ? null : payload.collegeId,
      };

      const res = await fetch(appendStudentQuery('/api/essays'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error('Failed to create essay');
      }

      const created = formatEssayFromResponse(await res.json(), {
        _id: '',
        ...payload,
        collegeName: collegesMap.get(payload.collegeId)?.name ?? 'Unassigned / Common App',
        prompt: payload.prompt,
        wordLimit: payload.wordLimit,
        currentContent: '',
        currentWordCount: 0,
        versions: [],
        rewriteApprovals: [],
        annotations: [],
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as EssayWithCollege);

      setEssays((prev) => [created, ...prev]);
      setSelectedEssayId(created._id);
      setShowNewEssayModal(false);
      toast.success('Essay created');
    } catch (error) {
      console.error(error);
      toast.error('Could not create essay');
    }
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getEssayTag = (essay: EssayWithCollege) => {
    const name = essay.collegeName.toLowerCase();
    if (name.includes('common')) return 'Common App';
    if (name.includes('uc') || name.includes('university of california')) return 'UC';
    return null;
  };

  const renderAnnotatedContent = (text: string, annotations: EssayAnnotation[]) => {
    if (!annotations.length) {
      return <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{text}</p>;
    }

    const sorted = [...annotations]
      .filter(
        (ann) =>
          Number.isFinite(ann.selectionStart) &&
          Number.isFinite(ann.selectionEnd) &&
          ann.selectionEnd > ann.selectionStart
      )
      .sort((a, b) => a.selectionStart - b.selectionStart);

    const segments: Array<
      | { type: 'text'; text: string }
      | { type: 'highlight'; text: string; annotation: EssayAnnotation }
    > = [];
    let cursor = 0;
    for (const ann of sorted) {
      const start = Math.max(0, Math.min(text.length, ann.selectionStart));
      const end = Math.max(start, Math.min(text.length, ann.selectionEnd));
      if (start > cursor) {
        segments.push({ type: 'text', text: text.slice(cursor, start) });
      }
      segments.push({
        type: 'highlight',
        text: text.slice(start, end),
        annotation: ann,
      });
      cursor = end;
    }
    if (cursor < text.length) {
      segments.push({ type: 'text', text: text.slice(cursor) });
    }

    return (
      <p className="whitespace-pre-wrap leading-relaxed text-gray-800">
        {segments.map((segment, idx) =>
          segment.type === 'highlight' ? (
            <mark
              key={`${segment.annotation._id}-${idx}`}
              className={`px-1 rounded ${
                activeAnnotationId === segment.annotation._id
                  ? 'bg-yellow-300'
                  : 'bg-yellow-200'
              }`}
            >
              {segment.text}
            </mark>
          ) : (
            <span key={`text-${idx}`}>{segment.text}</span>
          )
        )}
      </p>
    );
  };

  const renderAnnotationsPanel = (essay: EssayWithCollege) => {
    if (!essay.annotations?.length) return null;
    return (
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Comments & highlights</h3>
          <span className="text-xs text-gray-500">{essay.annotations.length} notes</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="border border-gray-200 rounded-lg p-4">
            {renderAnnotatedContent(essay.currentContent, essay.annotations)}
          </div>
          <div className="space-y-3">
            {essay.annotations.map((annotation) => (
              <button
                key={annotation._id}
                type="button"
                className={`w-full text-left border rounded-lg p-3 text-sm ${
                  activeAnnotationId === annotation._id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-primary-200'
                }`}
                onMouseEnter={() => setActiveAnnotationId(annotation._id)}
                onMouseLeave={() => setActiveAnnotationId(null)}
              >
                <p className="text-gray-900 font-medium mb-1">{annotation.note}</p>
                <p className="text-xs text-gray-500 italic">“{annotation.selection}”</p>
                <p className="text-xs text-gray-400 mt-2">
                  {annotation.author || 'Counselor'} ·{' '}
                  {annotation.createdAt ? formatRelativeTime(annotation.createdAt) : 'Just now'}
                </p>
              </button>
            ))}
          </div>
        </div>
      </Card>
    );
  };

  const hasAssignedColleges = colleges.some((college) => college._id !== 'unassigned');
  const isCounselorView = viewerRole !== 'student';

  const renderHeader = () => (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          {isCounselorView ? 'Counselor view' : 'Student workspace'}
        </p>
        <h1 className="text-3xl font-bold text-gray-900">
          {isCounselorView && studentMeta ? studentMeta.name : 'Essay Workspace'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isCounselorView
            ? 'Review Common App, UC, and school-specific essays in one place.'
            : 'One home for your Common App personal statement, UC PIQs, and every supplement.'}
        </p>
        {isCounselorView && studentMeta && (
          <div className="mt-3 inline-flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="px-3 py-1 bg-gray-100 rounded-full">
              Intake {studentMeta.intakeYear ?? '—'}
            </span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">{studentMeta.email}</span>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setShowAIPanel((prev) => !prev)}>
          {showAIPanel ? 'Hide' : 'Show'} AI Coach
        </Button>
        {!isCounselorView && (
          <Button onClick={() => setShowNewEssayModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Essay
          </Button>
        )}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Essays</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <Layers className="w-6 h-6 text-primary-500" />
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-gray-900">{stats.drafts}</p>
          </div>
          <Target className="w-6 h-6 text-amber-500" />
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Common / UC Sets</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.commonApp + stats.ucEssays}
            </p>
          </div>
          <Sparkles className="w-6 h-6 text-indigo-500" />
        </div>
      </Card>
    </div>
  );

  const renderEmptyState = () => (
    <Card className="text-center py-16">
      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">No essays yet</h2>
      <p className="text-gray-600 mb-6">
        Add your Common App personal statement or UC PIQs to start drafting in one place.
      </p>
      <Button onClick={() => setShowNewEssayModal(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Create Essay
      </Button>
      {!hasAssignedColleges && (
        <p className="text-sm text-gray-500 mt-3">
          You can create general essays without linking a college.
        </p>
      )}
    </Card>
  );

  const handleAddFeedback = async (payload: {
    selection: string;
    note: string;
    selectionStart: number;
    selectionEnd: number;
  }) => {
    if (!selectedEssay) return;
    try {
      const res = await fetch(appendStudentQuery(`/api/essays/${selectedEssay._id}/feedback`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to record feedback');
      }
      const updated = formatEssayFromResponse(await res.json(), selectedEssay);
      setEssays((prev) => prev.map((essay) => (essay._id === updated._id ? updated : essay)));
      setSelectedEssayId(updated._id);
      toast.success('Feedback added');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Could not save feedback');
    }
  };

  const renderEssayDetail = (options?: { enableAnnotations?: boolean }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {selectedEssay ? (
          <>
            <EssayEditor
              essay={selectedEssay}
              onSave={handleSave}
              onSaveVersion={handleSaveVersion}
              onAddFeedback={options?.enableAnnotations ? handleAddFeedback : undefined}
              canAnnotate={Boolean(options?.enableAnnotations)}
            />
            <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Linked to</p>
                <p className="text-lg font-semibold text-gray-900">{selectedEssay.collegeName}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleToggleComplete}>
                  {selectedEssay.completed ? 'Mark as Draft' : 'Mark Complete'}
                </Button>
                <Button variant="ghost" onClick={() => setShowAIPanel(true)}>
                  Coach Me
                </Button>
              </div>
            </Card>
          </>
        ) : (
          <Card className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select an essay from the list or create a new one.</p>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        {showAIPanel && selectedEssay && (
          <AIPanel
            essay={selectedEssay}
            mode={aiMode}
            onModeChange={setAiMode}
            onRewriteApplied={handleRewriteApplied}
          />
        )}

        {selectedEssay?.versions?.length ? (
          <Card>
            <h3 className="text-md font-semibold mb-3">Versions</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {selectedEssay.versions.map((version, idx) => (
                <button
                  key={`${version.name}-${idx}`}
                  onClick={() => {
                    setSelectedEssayId(selectedEssay._id);
                    setEssays((prev) =>
                      prev.map((essay) =>
                        essay._id === selectedEssay._id
                          ? {
                              ...essay,
                              currentContent: version.content,
                              currentWordCount: version.wordCount,
                            }
                          : essay
                      )
                    );
                  }}
                  className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm"
                >
                  <div className="font-medium">{version.name}</div>
                  <div className="text-xs text-gray-500">
                    {version.wordCount} words • {new Date(version.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="text-sm text-gray-500">
            Your saved drafts will appear here. Use “Save Version” inside the editor to track
            progress.
          </Card>
        )}
      </div>
    </div>
  );

  const renderCounselorLayout = () => {
    const commonDrafts = filteredEssays.filter((essay) => {
      const tag = getEssayTag(essay);
      return tag === 'Common App' || essay.collegeId === 'unassigned';
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Student overview</h2>
                <p className="text-sm text-gray-500">Switch schools to drill into drafts.</p>
              </div>
              <BookmarkCheck className="w-5 h-5 text-primary-500" />
            </div>
            {studentMeta ? (
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{studentMeta.name}</p>
                <p>{studentMeta.email}</p>
                <p className="text-gray-500">Intake {studentMeta.intakeYear ?? '—'}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a student from Collaboration.</p>
            )}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Focus school</label>
              <select
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value as 'all' | string)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All colleges</option>
                {colleges.map((college) => (
                  <option key={college._id} value={college._id}>
                    {college.name}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Common App & personal</h2>
              <span className="text-xs text-gray-500">{commonDrafts.length} drafts</span>
            </div>
            {commonDrafts.length === 0 ? (
              <p className="text-sm text-gray-500">No general essays yet.</p>
            ) : (
              <div className="space-y-2">
                {commonDrafts.map((essay) => (
                  <button
                    key={essay._id}
                    onClick={() => setSelectedEssayId(essay._id)}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selectedEssayId === essay._id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{essay.title}</p>
                        <p className="text-xs text-gray-500">{essay.collegeName}</p>
                      </div>
                      <span className="text-xs text-gray-500">{essay.currentWordCount} words</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Schools & supplements</h2>
              <span className="text-xs text-gray-500">{colleges.length - 1} schools</span>
            </div>
            <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
              {colleges
                .filter((college) => college._id !== 'unassigned')
                .map((college) => {
                  const essaysForCollege = filteredEssays.filter(
                    (essay) => essay.collegeId === college._id
                  );
                  if (essaysForCollege.length === 0) return null;
                  return (
                    <div key={college._id} className="border border-gray-200 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{college.name}</p>
                          {college.deadline && (
                            <p className="text-xs text-gray-500">
                              Due {formatRelativeTime(college.deadline)}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {essaysForCollege.length} draft{essaysForCollege.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {essaysForCollege.map((essay) => (
                          <button
                            key={essay._id}
                            onClick={() => setSelectedEssayId(essay._id)}
                            className={`w-full text-left p-2 rounded-lg text-sm border ${
                              selectedEssayId === essay._id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium text-gray-900">{essay.title}</div>
                            <p className="text-xs text-gray-500">
                              {essay.currentWordCount}/{essay.wordLimit} words
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>

        {selectedEssay && renderAnnotationsPanel(selectedEssay)}
        {renderEssayDetail({ enableAnnotations: true })}
      </div>
    );
  };

  const renderStudentLayout = () => {
    if (essays.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <Filter className="w-4 h-4 text-gray-400" />
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search essays or prompts"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                College / Program
              </label>
              <select
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value as 'all' | string)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All colleges</option>
                {colleges.map((college) => (
                  <option key={college._id} value={college._id}>
                    {college.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(['all', 'draft', 'completed'] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                      statusFilter === status
                        ? 'bg-primary-50 border-primary-500 text-primary-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {status === 'all' ? 'All' : status === 'draft' ? 'Drafts' : 'Complete'}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">All Drafts</h2>
              <span className="text-xs text-gray-500">{filteredEssays.length} showing</span>
            </div>
            <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
              {filteredEssays.length === 0 && (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No essays match that filter.
                </p>
              )}
              {filteredEssays.map((essay) => {
                const tag = getEssayTag(essay);
                const isActive = selectedEssayId === essay._id;
                return (
                  <button
                    key={essay._id}
                    onClick={() => setSelectedEssayId(essay._id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 border-2 border-primary-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{essay.title}</p>
                        <p className="text-xs text-gray-500">{essay.collegeName}</p>
                      </div>
                      {tag && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {tag}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 flex justify-between">
                      <span>
                        {essay.currentWordCount}/{essay.wordLimit} words
                      </span>
                      <span>{formatRelativeTime(essay.updatedAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">{renderEssayDetail()}</div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {renderHeader()}
      {renderStats()}

      {isCounselorView ? renderCounselorLayout() : renderStudentLayout()}

      {showNewEssayModal && (
        <NewEssayModal
          colleges={colleges}
          onClose={() => setShowNewEssayModal(false)}
          onSubmit={handleCreateEssay}
        />
      )}
    </div>
  );
}


function NewEssayModal({
  colleges,
  onClose,
  onSubmit,
}: {
  colleges: CollegeOption[];
  onClose: () => void;
  onSubmit: (payload: { collegeId: string; title: string; prompt: string; wordLimit: number }) => void;
}) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [wordLimit, setWordLimit] = useState(650);
  const defaultCollege = colleges.find((college) => college._id === 'unassigned');
  const [collegeId, setCollegeId] = useState(defaultCollege?._id ?? colleges[0]?._id ?? '');

  const canSubmit = Boolean(title.trim() && wordLimit > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error('Please select a college and title');
      return;
    }
    onSubmit({
      collegeId,
      title: title.trim(),
      prompt: prompt.trim(),
      wordLimit,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">New Essay</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">College / Program</label>
            <select
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {colleges.map((college) => (
                <option key={college._id} value={college._id}>
                  {college.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose &quot;Unassigned / Common App&quot; for prompts that are not tied to a school.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Common App Personal Statement"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Paste the exact prompt so AI feedback stays on target."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Word Limit</label>
            <input
              type="number"
              min={1}
              value={wordLimit}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setWordLimit(Number.isNaN(value) ? 0 : value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!canSubmit}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
interface EssayAnnotation {
  _id: string;
  selection: string;
  note: string;
  selectionStart: number;
  selectionEnd: number;
  author?: string;
  createdAt?: string;
}
