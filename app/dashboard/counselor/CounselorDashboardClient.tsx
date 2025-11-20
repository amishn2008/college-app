/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  BookOpen,
  ClipboardList,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';
import { formatDate } from '@/lib/utils';
import type { CounselorStudentSnapshot } from './types';

const FILTERS: Array<{
  id: CounselorFilter;
  label: string;
}> = [
  { id: 'all', label: 'All students' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'deadline', label: 'Deadline soon' },
  { id: 'idle', label: 'No open tasks' },
  { id: 'pending', label: 'Pending invite' },
];

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: 'urgency', label: 'Most urgent' },
  { id: 'deadline', label: 'Next deadline' },
  { id: 'name', label: 'Name (A-Z)' },
];

type CounselorFilter = 'all' | 'attention' | 'deadline' | 'idle' | 'pending';
type SortKey = 'urgency' | 'deadline' | 'name';

const withinDays = (dateString: string | null, days: number) => {
  if (!dateString) return false;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return false;
  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + days);
  return target >= now && target <= future;
};

const deadlineLabel = (dateString: string | null) => {
  if (!dateString) return 'No deadline';
  const deadline = new Date(dateString);
  if (Number.isNaN(deadline.getTime())) return 'No deadline';
  return formatDate(deadline);
};

export function CounselorDashboardClient({
  initialStudents,
}: {
  initialStudents: CounselorStudentSnapshot[];
}) {
  const router = useRouter();
  const { setStudentId } = useCollaborationContext();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CounselorFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('urgency');

  const students = initialStudents;

  const needsAttention = (student: CounselorStudentSnapshot) =>
    student.metrics.urgentTasks > 0 || student.metrics.overdueTasks > 0;

  const upcomingDeadline = (student: CounselorStudentSnapshot) =>
    withinDays(student.metrics.nextDeadline, 7);

  const idleStudent = (student: CounselorStudentSnapshot) => student.metrics.openTasks === 0;

  const stats = useMemo(() => {
    const attention = students.filter(needsAttention).length;
    const deadlines = students.filter(upcomingDeadline).length;
    const pending = students.filter((student) => student.status !== 'active').length;
    return {
      total: students.length,
      attention,
      deadlines,
      pending,
    };
  }, [students]);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return students.filter((student) => {
      const text = `${student.name} ${student.email}`.toLowerCase();
      if (normalizedQuery && !text.includes(normalizedQuery)) {
        return false;
      }
      switch (filter) {
        case 'attention':
          return needsAttention(student);
        case 'deadline':
          return upcomingDeadline(student);
        case 'idle':
          return idleStudent(student);
        case 'pending':
          return student.status !== 'active';
        default:
          return true;
      }
    });
  }, [students, normalizedQuery, filter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sortKey === 'name') {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === 'deadline') {
      copy.sort((a, b) => {
        const first = a.metrics.nextDeadline ? new Date(a.metrics.nextDeadline).getTime() : Infinity;
        const second = b.metrics.nextDeadline ? new Date(b.metrics.nextDeadline).getTime() : Infinity;
        return first - second;
      });
    } else {
      copy.sort((a, b) => {
        const aScore = a.metrics.urgentTasks * 2 + a.metrics.overdueTasks;
        const bScore = b.metrics.urgentTasks * 2 + b.metrics.overdueTasks;
        return bScore - aScore;
      });
    }
    return copy;
  }, [filtered, sortKey]);

  const handleNavigate = async (studentId: string, destination: 'dashboard' | 'tasks' | 'essays') => {
    await setStudentId(studentId);
    const basePath = destination === 'dashboard' ? '/dashboard' : `/dashboard/${destination}`;
    router.push(`${basePath}?studentId=${studentId}`);
  };

  const attentionBadge = (student: CounselorStudentSnapshot) => {
    if (student.status !== 'active') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
          Pending invite
        </span>
      );
    }
    if (needsAttention(student)) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
          Needs attention
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
        On track
      </span>
    );
  };

  const handleRefresh = () => router.refresh();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-primary-700 to-primary-500 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top_left,#ffffff50,transparent_42%)]" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-white/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative p-8 sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
                  <Sparkles className="w-4 h-4" />
                  Counselor workspace
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-semibold">Student command center</h1>
                  <p className="text-white/80">
                    Monitor caseload health, catch deadlines early, and jump into a student workspace without leaving this view.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard/collaboration">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white text-primary-700 hover:bg-white shadow-sm"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manage access
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className="text-white border border-white/30 hover:bg-white/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh data
                  </Button>
                </div>
              </div>
              <div className="grid w-full max-w-md grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/70">Active students</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-3xl font-semibold">{stats.total}</p>
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs text-white/70 mt-1">Across your caseload</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/70">Needs attention</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-3xl font-semibold">{stats.attention}</p>
                    <AlertTriangle className="w-5 h-5 text-amber-200" />
                  </div>
                  <p className="text-xs text-white/70 mt-1">Urgent or overdue</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/70">Deadlines (7d)</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-3xl font-semibold">{stats.deadlines}</p>
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs text-white/70 mt-1">Upcoming submissions</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/70">Pending invites</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-3xl font-semibold">{stats.pending}</p>
                      <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                    </div>
                    <p className="text-xs text-white/70 mt-1">Awaiting acceptance</p>
                  </div>
                </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-gradient-to-br from-white via-sky-50 to-primary-50 border-primary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Caseload health</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.attention}/{stats.total} flagged</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${stats.total ? Math.min(100, Math.round((stats.attention / stats.total) * 100)) : 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">Urgent and overdue items across students</p>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-white via-emerald-50 to-green-100 border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Upcoming deadlines</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.deadlines}</p>
              </div>
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <p className="mt-2 text-xs text-gray-500">Within the next 7 days</p>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-white via-amber-50 to-orange-100 border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Invites in motion</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="mt-2 text-xs text-gray-500">Follow up to activate access</p>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-white via-indigo-50 to-blue-100 border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Total students</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <p className="mt-2 text-xs text-gray-500">Across all relationships</p>
          </Card>
        </div>

        <Card className="p-5 space-y-4 border border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students by name or email"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
                <Filter className="w-4 h-4 text-gray-500" />
                Quick filters
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  filter === chip.id
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200'
                    : 'text-gray-700 border-gray-200 hover:border-primary-200 hover:bg-primary-50'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </Card>

        {sorted.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <p className="text-lg font-semibold text-gray-900">No students match your filters</p>
            <p className="text-sm text-gray-500">
              Adjust your filters or invite students from the Collaboration tab.
            </p>
            <Link href="/dashboard/collaboration">
              <Button>
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Go to Collaboration
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="p-0 border border-slate-200 shadow-lg shadow-slate-100 overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Student</th>
                    <th className="px-5 py-3 text-left">Intake</th>
                    <th className="px-5 py-3 text-left">Open tasks</th>
                    <th className="px-5 py-3 text-left">Urgent</th>
                    <th className="px-5 py-3 text-left">Essays</th>
                    <th className="px-5 py-3 text-left">Colleges</th>
                    <th className="px-5 py-3 text-left">Next deadline</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map((student) => {
                    const initial = (student.name || student.email || 'S')[0]?.toUpperCase() || 'S';
                    const rowBorder =
                      student.status !== 'active'
                        ? 'border-l-4 border-amber-400'
                        : needsAttention(student)
                        ? 'border-l-4 border-red-400'
                        : 'border-l-4 border-emerald-400';
                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors ${
                          needsAttention(student) ? 'bg-red-50/40' : 'bg-white'
                        } hover:bg-primary-50/50 ${rowBorder}`}
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-semibold">
                              {initial}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{student.name}</div>
                              <div className="text-xs text-gray-500">{student.email}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {attentionBadge(student)}
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                                  {student.relationship}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top text-gray-700">{student.intakeYear || '—'}</td>
                        <td className="px-5 py-4 align-top">
                          <div className="font-semibold text-gray-900">{student.metrics.openTasks}</div>
                          <p className="text-xs text-gray-500">{student.metrics.highPriority} high priority</p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="text-sm text-gray-900">
                            {student.metrics.urgentTasks} urgent / {student.metrics.overdueTasks} overdue
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="text-sm text-gray-900">
                            {student.metrics.essayDrafts} drafts
                          </div>
                          <p className="text-xs text-gray-500">{student.metrics.essaysCompleted} complete</p>
                        </td>
                        <td className="px-5 py-4 align-top text-gray-900">{student.metrics.colleges}</td>
                        <td className="px-5 py-4 align-top text-gray-900">
                          {deadlineLabel(student.metrics.nextDeadline)}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNavigate(student.id, 'tasks')}
                              className="border-gray-200"
                            >
                              <ClipboardList className="w-4 h-4 mr-1" />
                              Tasks
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNavigate(student.id, 'essays')}
                              className="border-gray-200"
                            >
                              <BookOpen className="w-4 h-4 mr-1" />
                              Essays
                            </Button>
                            <Button size="sm" onClick={() => handleNavigate(student.id, 'dashboard')}>
                              Open workspace
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
