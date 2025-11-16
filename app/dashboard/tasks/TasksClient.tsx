'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Plus,
  Filter,
  Clock,
  Bell,
  AlarmClockOff,
  Calendar as CalendarIcon,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Task {
  _id: string;
  title: string;
  notes?: string;
  label: string;
  dueDate?: string | Date | null;
  completed: boolean;
  priority: string;
  collegeId?: string | null;
  collegeName?: string | null;
  snoozedUntil?: string | null;
  reminderFrequency?: 'none' | 'daily' | 'weekly';
  reminderChannels?: string[];
  nextReminderAt?: string | null;
  acknowledgedAt?: string | null;
}

interface College {
  _id: string;
  name: string;
}

interface TasksData {
  tasks: Task[];
  colleges: College[];
}

const LABEL_OPTIONS = ['Essay', 'Rec', 'Testing', 'Transcript', 'Fees', 'Supplement'];

export function TasksClient({ initialData }: { initialData: TasksData }) {
  const { appendStudentQuery } = useCollaborationContext();
  const [tasks, setTasks] = useState(initialData.tasks);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [labelFilter, setLabelFilter] = useState<string>('all');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (filter === 'completed' && !task.completed) return false;
        if (filter === 'pending' && task.completed) return false;
        if (labelFilter !== 'all' && task.label !== labelFilter) return false;
        if (collegeFilter !== 'all' && (task.collegeId || null) !== collegeFilter) return false;
        return true;
      }),
    [tasks, filter, labelFilter, collegeFilter]
  );

  const pendingCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.length - pendingCount;
  const dueSoonCount = tasks.filter((task) => {
    if (!task.dueDate || task.completed) return false;
    const due = new Date(task.dueDate);
    const now = new Date();
    const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && diff >= 0;
  }).length;

  const patchTask = async (taskId: string, payload: Record<string, unknown>, success?: string) => {
    try {
      const res = await fetch(appendStudentQuery(`/api/tasks/${taskId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed');
      const updated = await res.json();
      setTasks((prev) => prev.map((task) => (task._id === taskId ? updated : task)));
      if (success) toast.success(success);
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    patchTask(taskId, { completed: !completed }, !completed ? 'Task completed!' : 'Task reopened');
  };

  const handleReminderFrequencyChange = (task: Task, frequency: Task['reminderFrequency']) => {
    patchTask(task._id, { reminderFrequency: frequency }, 'Reminder updated');
  };

  const handleSnooze = (taskId: string) => {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 1);
    patchTask(taskId, { snoozedUntil: snoozeUntil }, 'Snoozed for 1 day');
  };

  const handleAcknowledge = (taskId: string) => {
    patchTask(taskId, { acknowledged: true }, 'Reminder acknowledged');
  };

  const handleTaskAdded = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
    setShowAddTask(false);
    toast.success('Task added!');
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      const res = await fetch(appendStudentQuery(`/api/tasks/${taskToDelete._id}`), {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete task');
      }
      setTasks((prev) => prev.filter((task) => task._id !== taskToDelete._id));
      toast.success('Task deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete task');
    } finally {
      setIsDeletingTask(false);
      setTaskToDelete(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'text-red-600 bg-red-50';
    if (priority === 'medium') return 'text-amber-600 bg-amber-50';
    return 'text-gray-600 bg-gray-100';
  };

  const getLabelColor = (label: string) => {
    const colors: Record<string, string> = {
      Essay: 'bg-blue-100 text-blue-700',
      Rec: 'bg-purple-100 text-purple-700',
      Testing: 'bg-green-100 text-green-700',
      Transcript: 'bg-amber-100 text-amber-800',
      Fees: 'bg-pink-100 text-pink-700',
      Supplement: 'bg-indigo-100 text-indigo-700',
    };
    return colors[label] || 'bg-gray-100 text-gray-700';
  };

  const bucketTasks = (task: Task) => {
    if (!task.dueDate) return 'Someday';
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return 'This week';
    return 'Later';
  };

  const grouped = useMemo(
    () =>
      filteredTasks.reduce<Record<string, Task[]>>((acc, task) => {
        const bucket = bucketTasks(task);
        acc[bucket] = acc[bucket] || [];
        acc[bucket].push(task);
        return acc;
      }, {}),
    [filteredTasks]
  );

  const bucketOrder = ['Overdue', 'Today', 'Tomorrow', 'This week', 'Later', 'Someday'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-primary-100">task cockpit</p>
            <h1 className="text-3xl font-semibold leading-tight">
              Stay five steps ahead of every deadline
            </h1>
            <p className="text-sm text-primary-50 max-w-xl">
              Essays, recommendations, supplements, and testing plans all flow through one prioritized list.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                className="bg-white text-primary-700 hover:bg-gray-100"
                onClick={() => setShowAddTask(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add task
              </Button>
              <Link href="/dashboard/calendar">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/50 text-white hover:bg-white/10"
                >
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Open calendar
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm w-full lg:max-w-md">
            <Card className="bg-white/10 border-white/10 text-white">
              <p className="text-xs uppercase tracking-widest opacity-80">Pending</p>
              <p className="text-3xl font-bold">{pendingCount}</p>
            </Card>
            <Card className="bg-white/10 border-white/10 text-white">
              <p className="text-xs uppercase tracking-widest opacity-80">Completed</p>
              <p className="text-3xl font-bold">{completedCount}</p>
            </Card>
            <Card className="bg-white/10 border-white/10 text-white">
              <p className="text-xs uppercase tracking-widest opacity-80">Due soon</p>
              <p className="text-3xl font-bold">{dueSoonCount}</p>
            </Card>
          </div>
        </div>
      </div>

      <Card className="bg-white/70 border border-gray-100 backdrop-blur px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex rounded-full bg-gray-100 p-1">
              {['all', 'pending', 'completed'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status as typeof filter)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    filter === status ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-gray-400">Label</span>
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm"
            >
              <option value="all">All</option>
              {LABEL_OPTIONS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-gray-400">College</span>
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm"
            >
              <option value="all">All</option>
              {initialData.colleges.map((college) => (
                <option key={college._id} value={college._id}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {filteredTasks.length === 0 ? (
        <Card className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No tasks found</p>
          <Button onClick={() => setShowAddTask(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Task
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {bucketOrder
            .filter((bucket) => grouped[bucket]?.length)
            .map((bucket) => (
              <div key={bucket} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">{bucket}</h2>
                  <span className="text-xs text-gray-500">
                    {grouped[bucket].length} task{grouped[bucket].length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-3">
                  {grouped[bucket]
                    .sort((a, b) => {
                      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                      return da - db;
                    })
                    .map((task) => (
                      <Card key={task._id} className={`p-4 ${task.completed ? 'opacity-60' : ''}`}>
                        <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                          <div className="space-y-2">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleComplete(task._id, task.completed)}
                                className={`mt-1 w-5 h-5 rounded-full border ${
                                  task.completed
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-gray-300'
                                }`}
                              />
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {task.title}
                                  </h3>
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${getLabelColor(task.label)}`}>
                                    {task.label}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                                    {task.priority} priority
                                  </span>
                                  {task.collegeName && (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                                      {task.collegeName}
                                    </span>
                                  )}
                                </div>
                                {task.notes && (
                                  <p className="text-sm text-gray-600 mt-2">{task.notes}</p>
                                )}
                                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                                  {task.dueDate && (
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                  {task.snoozedUntil && (
                            <span className="inline-flex items-center gap-1">
                              <AlarmClockOff className="w-3 h-3" />
                              Snoozed until {formatDate(task.snoozedUntil)}
                            </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSnooze(task._id)}
                              className="justify-start text-gray-600 hover:text-gray-900"
                            >
                              <AlarmClockOff className="w-4 h-4 mr-1" />
                              Snooze 1 day
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAcknowledge(task._id)}
                              className="justify-start text-gray-600 hover:text-gray-900"
                            >
                              <Bell className="w-4 h-4 mr-1" />
                              Mark reminded
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTaskToDelete(task)}
                              className="justify-start text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete task
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                          {['daily', 'weekly'].map((frequency) => (
                            <button
                              key={frequency}
                              type="button"
                              onClick={() =>
                                handleReminderFrequencyChange(task, frequency as Task['reminderFrequency'])
                              }
                              className={`px-3 py-1 rounded-full border ${
                                task.reminderFrequency === frequency
                                  ? 'border-primary-500 text-primary-600'
                                  : 'border-gray-200'
                              }`}
                            >
                              {frequency === 'daily' ? 'Daily ping' : 'Weekly digest'}
                            </button>
                          ))}
                          <span className="inline-flex items-center gap-1">
                            <ChevronRight className="w-4 h-4" />
                            {task.reminderChannels?.length
                              ? `Alerts via ${task.reminderChannels.join(', ')}`
                              : 'No reminders enabled'}
                          </span>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {showAddTask && (
        <AddTaskModal
          colleges={initialData.colleges}
          onClose={() => setShowAddTask(false)}
          onSuccess={handleTaskAdded}
        />
      )}

      <ConfirmDialog
        open={!!taskToDelete}
        title="Delete task"
        description={
          taskToDelete
            ? `This will permanently remove "${taskToDelete.title}".`
            : undefined
        }
        confirmLabel="Delete task"
        cancelLabel="Keep task"
        destructive
        loading={isDeletingTask}
        onClose={() => {
          if (!isDeletingTask) {
            setTaskToDelete(null);
          }
        }}
        onConfirm={handleDeleteTask}
      />
    </div>
  );
}
