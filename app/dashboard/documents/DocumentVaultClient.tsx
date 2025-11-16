'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Plus,
  FileText,
  GraduationCap,
  FolderOpen,
  CheckCircle2,
  Upload,
  Sparkles,
  Link2,
  Tags as TagsIcon,
  School,
  Trash2,
  Edit3,
  ShieldCheck,
  BadgeCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';
import { formatDate } from '@/lib/utils';

type DocumentCategory =
  | 'resume'
  | 'transcript'
  | 'test_score'
  | 'portfolio'
  | 'counselor_form'
  | 'other';

type DocumentStatus = 'draft' | 'in_review' | 'ready' | 'submitted';

interface ResumeSection {
  heading: string;
  bullets: string[];
}

interface PortfolioLink {
  label: string;
  url: string;
}

interface DocumentRecord {
  _id: string;
  title: string;
  category: DocumentCategory;
  status: DocumentStatus;
  description?: string;
  fileUrl?: string;
  tags: string[];
  collegeIds: string[];
  collegeNames: string[];
  metadata?: {
    testName?: string;
    testDate?: string;
    score?: string;
    superscore?: string;
    resumeSections?: ResumeSection[];
    portfolioLinks?: PortfolioLink[];
    counselorContact?: string;
  };
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface College {
  _id: string;
  name: string;
  plan?: string;
  deadline?: string | null;
}

interface DocumentsData {
  documents: DocumentRecord[];
  colleges: College[];
}

interface DocumentFormData {
  title: string;
  category: DocumentCategory;
  status: DocumentStatus;
  description?: string;
  fileUrl?: string;
  tags: string[];
  collegeIds: string[];
  metadata: {
    testName?: string;
    testDate?: string;
    score?: string;
    superscore?: string;
    resumeSections?: ResumeSection[];
    portfolioLinks?: PortfolioLink[];
    counselorContact?: string;
  };
}

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  resume: 'Resume & activity sheet',
  transcript: 'Transcript',
  test_score: 'Testing',
  portfolio: 'Portfolio / media',
  counselor_form: 'Counselor forms',
  other: 'Other',
};

const STATUS_STYLES: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  in_review: 'bg-amber-100 text-amber-700',
  ready: 'bg-green-100 text-green-700',
  submitted: 'bg-blue-100 text-blue-700',
};

const statusLabel: Record<DocumentStatus, string> = {
  draft: 'Draft',
  in_review: 'Needs review',
  ready: 'Ready',
  submitted: 'Submitted',
};

const defaultFormState: DocumentFormData = {
  title: '',
  category: 'resume',
  status: 'draft',
  description: '',
  fileUrl: '',
  tags: [],
  collegeIds: [],
  metadata: {
    resumeSections: [
      { heading: 'Education', bullets: [] },
      { heading: 'Activities', bullets: [] },
    ],
  },
};

const badgeClasses = 'px-2 py-1 rounded-full text-xs font-semibold';

export function DocumentVaultClient({ initialData }: { initialData: DocumentsData }) {
  const { appendStudentQuery } = useCollaborationContext();

  const [documents, setDocuments] = useState<DocumentRecord[]>(initialData.documents);
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [collegeFilter, setCollegeFilter] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DocumentRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const collegeMap = useMemo(
    () => new Map(initialData.colleges.map((college) => [college._id, college.name])),
    [initialData.colleges]
  );

  const formatFromResponse = (payload: any): DocumentRecord => {
    const collegeIds = Array.isArray(payload.collegeIds) ? payload.collegeIds : [];
    return {
      _id: payload._id?.toString() || '',
      title: payload.title,
      category: payload.category,
      status: payload.status,
      description: payload.description || '',
      fileUrl: payload.fileUrl || '',
      tags: payload.tags || [],
      collegeIds,
      collegeNames: collegeIds.map((id: string) => collegeMap.get(id) || 'Unassigned'),
      metadata: payload.metadata || {},
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    };
  };

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents
      .filter((doc) => {
        if (categoryFilter !== 'all' && doc.category !== categoryFilter) return false;
        if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
        if (collegeFilter !== 'all' && !doc.collegeIds.includes(collegeFilter)) return false;
        if (!query) return true;
        return (
          doc.title.toLowerCase().includes(query) ||
          (doc.description || '').toLowerCase().includes(query) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [documents, categoryFilter, statusFilter, collegeFilter, search]);

  const stats = useMemo(() => {
    const countsByCategory: Record<DocumentCategory, number> = {
      resume: 0,
      transcript: 0,
      test_score: 0,
      portfolio: 0,
      counselor_form: 0,
      other: 0,
    };
    let readyCount = 0;
    const taggedSchools = new Set<string>();

    documents.forEach((doc) => {
      countsByCategory[doc.category] += 1;
      if (doc.status === 'ready' || doc.status === 'submitted') {
        readyCount += 1;
      }
      doc.collegeIds.forEach((id) => taggedSchools.add(id));
    });

    return { countsByCategory, readyCount, taggedCount: taggedSchools.size };
  }, [documents]);

  const upsertDocument = (next: DocumentRecord) => {
    setDocuments((prev) => {
      const existingIndex = prev.findIndex((doc) => doc._id === next._id);
      if (existingIndex === -1) {
        return [next, ...prev];
      }
      const updated = [...prev];
      updated[existingIndex] = next;
      return updated;
    });
  };

  const handleSubmit = async (form: DocumentFormData, existingId?: string) => {
    setSaving(true);
    try {
      const res = await fetch(
        appendStudentQuery(existingId ? `/api/documents/${existingId}` : '/api/documents'),
        {
          method: existingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        throw new Error('Request failed');
      }

      const payload = await res.json();
      const normalized = formatFromResponse(payload);
      upsertDocument(normalized);
      toast.success(existingId ? 'Document updated' : 'Document saved');
      setShowForm(false);
      setEditing(null);
    } catch (error) {
      console.error(error);
      toast.error('Unable to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(appendStudentQuery(`/api/documents/${docToDelete._id}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed');
      setDocuments((prev) => prev.filter((doc) => doc._id !== docToDelete._id));
      toast.success('Document removed');
    } catch (error) {
      console.error(error);
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
      setDocToDelete(null);
    }
  };

  const resumeDoc = documents.find((doc) => doc.category === 'resume');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-primary-100">Document vault</p>
            <h1 className="text-3xl font-semibold leading-tight">
              Keep resumes, transcripts, tests, and forms ready for every college
            </h1>
            <p className="text-sm text-primary-50">
              Tag each file to school requirements, track review status, and keep a clean package ready to drop into Common App.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                className="bg-white text-primary-700 hover:bg-gray-100"
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add document
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/50 text-white hover:bg-white/10"
                onClick={() => {
                  setEditing(resumeDoc ?? null);
                  setShowForm(true);
                }}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Open resume builder
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm w-full lg:max-w-md">
            <Card className="bg-white/10 border-white/10 text-white">
              <p className="text-xs uppercase tracking-widest opacity-80">Ready / submitted</p>
              <p className="text-3xl font-bold">{stats.readyCount}</p>
            </Card>
            <Card className="bg-white/10 border-white/10 text-white">
              <p className="text-xs uppercase tracking-widest opacity-80">Tagged schools</p>
              <p className="text-3xl font-bold">{stats.taggedCount}</p>
            </Card>
            <Card className="bg-white/10 border-white/10 text-white">
              <p className="text-xs uppercase tracking-widest opacity-80">Total docs</p>
              <p className="text-3xl font-bold">{documents.length}</p>
            </Card>
          </div>
        </div>
      </div>

      <Card className="bg-white/80 border border-gray-100 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="All"
              active={categoryFilter === 'all'}
              onClick={() => setCategoryFilter('all')}
            />
            {(Object.keys(CATEGORY_LABELS) as DocumentCategory[]).map((category) => (
              <FilterChip
                key={category}
                label={CATEGORY_LABELS[category]}
                badge={stats.countsByCategory[category]}
                active={categoryFilter === category}
                onClick={() => setCategoryFilter(category)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="in_review">Needs review</option>
              <option value="ready">Ready</option>
              <option value="submitted">Submitted</option>
            </select>
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value || 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All schools</option>
              {initialData.colleges.map((college) => (
                <option key={college._id} value={college._id}>
                  {college.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search docs or tags"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm min-w-[200px]"
            />
          </div>
        </div>
      </Card>

      {resumeDoc && (
        <Card className="bg-gradient-to-r from-amber-50 to-white border-amber-100">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs uppercase text-amber-600 font-semibold mb-1">
                    Resume builder
                  </p>
                  <h3 className="text-lg font-semibold text-gray-800">{resumeDoc.title}</h3>
                  <p className="text-sm text-gray-600">
                    Keep one clean resume/activity sheet; iterate in versions right inside the vault.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditing(resumeDoc);
                    setShowForm(true);
                  }}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  {resumeDoc.fileUrl && (
                    <Link href={resumeDoc.fileUrl} target="_blank" className="inline-block">
                      <Button size="sm" variant="ghost">
                        <Link2 className="w-4 h-4 mr-2" />
                        Open link
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              {resumeDoc.metadata?.resumeSections && (
                <div className="grid md:grid-cols-3 gap-3 mt-4">
                  {resumeDoc.metadata.resumeSections.slice(0, 3).map((section, index) => (
                    <div key={index} className="bg-white rounded-lg border border-amber-100 p-3">
                      <p className="text-xs font-semibold text-amber-700 uppercase mb-1">
                        {section.heading || 'Section'}
                      </p>
                      <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                        {(section.bullets || []).slice(0, 3).map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
                        ))}
                        {section.bullets && section.bullets.length > 3 && (
                          <li className="text-xs text-gray-500">+{section.bullets.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc._id} className="relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
                {doc.category === 'resume' && <FileText className="w-4 h-4" />}
                {doc.category === 'transcript' && <GraduationCap className="w-4 h-4" />}
                {doc.category === 'test_score' && <BadgeCheck className="w-4 h-4" />}
                {doc.category === 'portfolio' && <FolderOpen className="w-4 h-4" />}
                {doc.category === 'counselor_form' && <ShieldCheck className="w-4 h-4" />}
                {doc.category === 'other' && <Sparkles className="w-4 h-4" />}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500">{CATEGORY_LABELS[doc.category]}</p>
                    <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                  </div>
                  <span className={`${badgeClasses} ${STATUS_STYLES[doc.status]}`}>
                    {statusLabel[doc.status]}
                  </span>
                </div>
                {doc.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">{doc.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {doc.collegeNames.map((name, idx) => (
                    <span
                      key={`${doc._id}-college-${idx}`}
                      className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs"
                    >
                      <School className="w-3 h-3 inline mr-1" />
                      {name}
                    </span>
                  ))}
                  {doc.tags.map((tag) => (
                    <span
                      key={`${doc._id}-tag-${tag}`}
                      className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                    >
                      <TagsIcon className="w-3 h-3 inline mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
                {doc.metadata?.testName && (
                  <div className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                    <p className="font-medium text-gray-700">
                      Testing: {doc.metadata.testName}{' '}
                      {doc.metadata.testDate && (
                        <span className="text-gray-500">
                          ({formatDate(doc.metadata.testDate)})
                        </span>
                      )}
                    </p>
                    <p>
                      Score: {doc.metadata.score || '—'}{' '}
                      {doc.metadata.superscore && (
                        <span className="text-gray-500 ml-1">
                          Superscore {doc.metadata.superscore}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-3">
                {doc.fileUrl && (
                  <Link href={doc.fileUrl} target="_blank" className="text-primary-600 hover:underline">
                    <Link2 className="w-4 h-4 inline mr-1" />
                    Open link
                  </Link>
                )}
                {doc.updatedAt && <span>Updated {formatDate(doc.updatedAt)}</span>}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(doc);
                    setShowForm(true);
                  }}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDocToDelete(doc)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card className="text-center py-12">
          <div className="mx-auto mb-3 p-3 rounded-2xl bg-gray-100 w-12 h-12 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No documents yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add resumes, transcripts, testing screenshots, counselor forms, or any supporting files.
          </p>
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add your first document
          </Button>
        </Card>
      )}

      <DocumentFormModal
        open={showForm}
        initial={editing}
        loading={saving}
        colleges={initialData.colleges}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSubmit={(form) => handleSubmit(form, editing?._id)}
      />

      <ConfirmDialog
        open={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleDelete}
        title="Delete document?"
        description="This will remove it from your vault but not from Common App or other portals."
        loading={deleting}
        destructive
        confirmLabel="Delete"
      />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
        active ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-200 text-gray-700'
      }`}
    >
      {label}
      {typeof badge === 'number' && (
        <span className="ml-2 text-xs text-gray-500">{badge}</span>
      )}
    </button>
  );
}

function DocumentFormModal({
  open,
  initial,
  colleges,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial: DocumentRecord | null;
  colleges: College[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: DocumentFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<DocumentFormData>(defaultFormState);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        title: initial.title,
        category: initial.category,
        status: initial.status,
        description: initial.description || '',
        fileUrl: initial.fileUrl || '',
        tags: initial.tags || [],
        collegeIds: initial.collegeIds || [],
        metadata: {
          testName: initial.metadata?.testName,
          testDate: initial.metadata?.testDate,
          score: initial.metadata?.score,
          superscore: initial.metadata?.superscore,
          resumeSections: initial.metadata?.resumeSections || defaultFormState.metadata.resumeSections,
          portfolioLinks: initial.metadata?.portfolioLinks,
          counselorContact: initial.metadata?.counselorContact,
        },
      });
    } else {
      setForm(defaultFormState);
    }
    setTagInput('');
  }, [open, initial]);

  const updateMetadata = (key: keyof DocumentFormData['metadata'], value: any) => {
    setForm((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value,
      },
    }));
  };

  const handleAddTag = () => {
    const next = tagInput.trim();
    if (!next) return;
    setForm((prev) => ({
      ...prev,
      tags: Array.from(new Set([...(prev.tags || []), next])),
    }));
    setTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs uppercase text-gray-500">Document vault</p>
            <h3 className="text-xl font-semibold text-gray-900">
              {initial ? 'Edit document' : 'Add document'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Common App resume"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value as DocumentCategory }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {(Object.keys(CATEGORY_LABELS) as DocumentCategory[]).map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value as DocumentStatus }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">Needs review</option>
                  <option value="ready">Ready</option>
                  <option value="submitted">Submitted</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File link or location
              </label>
              <input
                type="url"
                value={form.fileUrl || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, fileUrl: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Google Drive, Notion, or upload link"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Counselor contact (for forms)
              </label>
              <input
                type="text"
                value={form.metadata?.counselorContact || ''}
                onChange={(e) => updateMetadata('counselorContact', e.target.value)}
                placeholder="Name / email for counselor packets"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag to schools
              </label>
              <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {colleges.map((college) => {
                  const checked = form.collegeIds.includes(college._id);
                  return (
                    <label key={college._id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setForm((prev) => {
                            const next = new Set(prev.collegeIds);
                            if (e.target.checked) {
                              next.add(college._id);
                            } else {
                              next.delete(college._id);
                            }
                            return { ...prev, collegeIds: Array.from(next) };
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>{college.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {(form.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    <TagsIcon className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          tags: prev.tags.filter((t) => t !== tag),
                        }))
                      }
                      className="text-gray-500 hover:text-gray-700"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Scholarship, RD, UC..."
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <Button type="button" size="sm" variant="ghost" onClick={handleAddTag}>
                  Add tag
                </Button>
              </div>
            </div>
          </div>

          {form.category === 'test_score' && (
            <div className="grid md:grid-cols-2 gap-4 border border-gray-100 rounded-xl p-4 bg-gray-50/60">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test name
                </label>
                <input
                  type="text"
                  value={form.metadata?.testName || ''}
                  onChange={(e) => updateMetadata('testName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="SAT, ACT, TOEFL..."
                />
              </div>
              <DateField
                label="Test date"
                value={form.metadata?.testDate || ''}
                onChange={(value) => updateMetadata('testDate', value)}
                placeholder="Select a date"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score
                </label>
                <input
                  type="text"
                  value={form.metadata?.score || ''}
                  onChange={(e) => updateMetadata('score', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="1540, 34, 110..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Superscore
                </label>
                <input
                  type="text"
                  value={form.metadata?.superscore || ''}
                  onChange={(e) => updateMetadata('superscore', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Superscore / section notes"
                />
              </div>
            </div>
          )}

          {form.category === 'portfolio' && (
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Portfolio links</p>
                  <p className="text-xs text-gray-500">
                    Host media on Drive/YouTube/Behance and keep the links handy.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateMetadata('portfolioLinks', [
                      ...(form.metadata?.portfolioLinks || []),
                      { label: 'New link', url: '' },
                    ])
                  }
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add link
                </Button>
              </div>
              <div className="space-y-3">
                {(form.metadata?.portfolioLinks || []).map((link, idx) => (
                  <div key={idx} className="grid md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => {
                        const next = [...(form.metadata?.portfolioLinks || [])];
                        next[idx] = { ...next[idx], label: e.target.value };
                        updateMetadata('portfolioLinks', next);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Project name"
                    />
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => {
                          const next = [...(form.metadata?.portfolioLinks || [])];
                          next[idx] = { ...next[idx], url: e.target.value };
                          updateMetadata('portfolioLinks', next);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          const next = [...(form.metadata?.portfolioLinks || [])];
                          next.splice(idx, 1);
                          updateMetadata('portfolioLinks', next);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {form.category === 'resume' && (
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Resume sections</p>
                  <p className="text-xs text-gray-500">
                    Build an activity sheet students can paste into Common App without reformatting.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      updateMetadata('resumeSections', [
                        ...(form.metadata?.resumeSections || []),
                        { heading: 'New section', bullets: [] },
                      ])
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add section
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateMetadata('resumeSections', [
                        { heading: 'Education', bullets: ['GPA, class rank, coursework highlights'] },
                        { heading: 'Activities', bullets: ['Role — organization — impact/metrics'] },
                        { heading: 'Honors', bullets: ['Honor name — level — year'] },
                        { heading: 'Skills', bullets: ['Languages, tools, certifications'] },
                      ])
                    }
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Use template
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {(form.metadata?.resumeSections || []).map((section, sectionIndex) => (
                  <div key={sectionIndex} className="bg-white border border-gray-100 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={section.heading}
                        onChange={(e) => {
                          const next = [...(form.metadata?.resumeSections || [])];
                          next[sectionIndex] = { ...next[sectionIndex], heading: e.target.value };
                          updateMetadata('resumeSections', next);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Section title"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const next = [...(form.metadata?.resumeSections || [])];
                          next.splice(sectionIndex, 1);
                          updateMetadata('resumeSections', next);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(section.bullets || []).map((bullet, bulletIndex) => (
                        <div key={bulletIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => {
                              const next = [...(form.metadata?.resumeSections || [])];
                              const updatedBullets = [...(next[sectionIndex]?.bullets || [])];
                              updatedBullets[bulletIndex] = e.target.value;
                              next[sectionIndex] = {
                                ...next[sectionIndex],
                                bullets: updatedBullets,
                              };
                              updateMetadata('resumeSections', next);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Quantified bullet"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const next = [...(form.metadata?.resumeSections || [])];
                              const updatedBullets = [...(next[sectionIndex]?.bullets || [])];
                              updatedBullets.splice(bulletIndex, 1);
                              next[sectionIndex] = {
                                ...next[sectionIndex],
                                bullets: updatedBullets,
                              };
                              updateMetadata('resumeSections', next);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const next = [...(form.metadata?.resumeSections || [])];
                          const updatedBullets = [...(next[sectionIndex]?.bullets || [])];
                          updatedBullets.push('');
                          next[sectionIndex] = {
                            ...next[sectionIndex],
                            bullets: updatedBullets,
                          };
                          updateMetadata('resumeSections', next);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add bullet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Upload className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : initial ? 'Save changes' : 'Save document'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
