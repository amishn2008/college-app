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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Counselor hub</p>
          <h1 className="text-3xl font-bold text-gray-900">Student management</h1>
          <p className="text-gray-600">
            Track progress, jump into student workspaces, and triage urgent tasks across your caseload.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/collaboration">
            <Button variant="outline" size="sm">
              Manage access
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Active students</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-5 h-5 text-primary-600" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Needs attention</p>
              <p className="text-3xl font-bold text-gray-900">{stats.attention}</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Deadlines (7d)</p>
              <p className="text-3xl font-bold text-gray-900">{stats.deadlines}</p>
            </div>
            <Calendar className="w-5 h-5 text-primary-600" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Pending invites</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </Card>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students by name or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="text-sm text-gray-500">Filters</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className={`px-3 py-1 rounded-full text-sm border transition ${
                filter === chip.id
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'text-gray-600 border-gray-200 hover:border-primary-200'
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
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Intake</th>
                <th className="px-4 py-3 text-left">Open tasks</th>
                <th className="px-4 py-3 text-left">Urgent</th>
                <th className="px-4 py-3 text-left">Essays</th>
                <th className="px-4 py-3 text-left">Colleges</th>
                <th className="px-4 py-3 text-left">Next deadline</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((student) => (
                <tr
                  key={student.id}
                  className={needsAttention(student) ? 'bg-red-50/40' : 'bg-white'}
                >
                  <td className="px-4 py-4 align-top">
                    <div className="font-semibold text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-500">{student.email}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attentionBadge(student)}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                        {student.relationship}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-gray-700">{student.intakeYear || '—'}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-semibold text-gray-900">{student.metrics.openTasks}</div>
                    <p className="text-xs text-gray-500">{student.metrics.highPriority} high priority</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm text-gray-900">
                      {student.metrics.urgentTasks} urgent / {student.metrics.overdueTasks} overdue
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm text-gray-900">
                      {student.metrics.essayDrafts} drafts
                    </div>
                    <p className="text-xs text-gray-500">{student.metrics.essaysCompleted} complete</p>
                  </td>
                  <td className="px-4 py-4 align-top text-gray-900">{student.metrics.colleges}</td>
                  <td className="px-4 py-4 align-top text-gray-900">
                    {deadlineLabel(student.metrics.nextDeadline)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleNavigate(student.id, 'tasks')}
                      >
                        <ClipboardList className="w-4 h-4 mr-1" />
                        Tasks
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleNavigate(student.id, 'essays')}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
