'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Copy,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
  _id: string;
  title: string;
  dueDate?: string | Date | null;
  label: string;
  completed: boolean;
}

interface College {
  _id: string;
  name: string;
  deadline: string | Date | null;
}

interface CalendarData {
  tasks: Task[];
  colleges: College[];
  syncToken?: string | null;
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function CalendarClient({ data }: { data: CalendarData }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [syncToken, setSyncToken] = useState<string | null>(data.syncToken || null);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getItemsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const tasks = data.tasks.filter((task) => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate).toISOString().split('T')[0] === dateStr;
    });
    const colleges = data.colleges.filter((college) => {
      if (!college.deadline) return false;
      return new Date(college.deadline).toISOString().split('T')[0] === dateStr;
    });
    return { tasks, colleges };
  };

  const days: Array<number | null> = [];
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : null;
  const calendarUrl = syncToken ? `${baseUrl}/api/calendar/ics/${syncToken}` : '';

  const tasksThisMonth = useMemo(() => {
    return data.tasks.filter((task) => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due.getMonth() === month && due.getFullYear() === year;
    }).length;
  }, [data.tasks, month, year]);

  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    return data.colleges
      .filter((college) => college.deadline && new Date(college.deadline) >= today)
      .sort(
        (a, b) => new Date(a.deadline as string).getTime() - new Date(b.deadline as string).getTime()
      )
      .slice(0, 3);
  }, [data.colleges]);

  const enableSync = async (options?: { regenerate?: boolean }) => {
    try {
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      });
      if (!res.ok) throw new Error('Failed');
      const payload = await res.json();
      setSyncToken(payload.token);
      toast.success('Calendar feed ready');
    } catch (error) {
      toast.error('Unable to update calendar feed');
    }
  };

  const disableSync = async () => {
    try {
      const res = await fetch('/api/calendar/sync', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setSyncToken(null);
      toast.success('Calendar feed disabled');
    } catch (error) {
      toast.error('Unable to disable feed');
    }
  };

  const copyLink = () => {
    if (!calendarUrl) return;
    navigator.clipboard.writeText(calendarUrl);
    toast.success('ICS link copied');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-primary-200">calendar</p>
            <h1 className="text-3xl font-semibold leading-tight">
              Every deadline, synced to every device
            </h1>
            <p className="text-sm text-slate-200 max-w-xl">
              Your application plan flows into a live calendar feed for parents, counselors, and your own phone.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-2">
                <p className="text-xs uppercase tracking-widest opacity-80">Tasks this month</p>
                <p className="text-xl font-semibold">{tasksThisMonth}</p>
              </div>
              <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-2">
                <p className="text-xs uppercase tracking-widest opacity-80">Upcoming deadlines</p>
                <p className="text-xl font-semibold">{upcomingDeadlines.length}</p>
              </div>
              <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-2">
                <p className="text-xs uppercase tracking-widest opacity-80">Calendar feed</p>
                <p className="text-xl font-semibold">{syncToken ? 'Active' : 'Not yet'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 space-y-3 min-w-[280px]">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              {calendarUrl ? 'Shareable ICS feed ready' : 'Generate a private ICS feed'}
            </div>
            {calendarUrl ? (
              <>
                <div className="flex items-center gap-2">
                  <input
                    value={calendarUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg text-xs bg-white/10 border border-white/20"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/60 text-white hover:bg-white/10"
                    onClick={copyLink}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2 text-xs">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/80 hover:text-white"
                    onClick={() => enableSync({ regenerate: true })}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/80 hover:text-white"
                    onClick={disableSync}
                  >
                    Disable
                  </Button>
                </div>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-white text-slate-900 hover:bg-gray-100"
                onClick={() => enableSync()}
              >
                Create calendar feed
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold">
                {monthNames[month]} {year}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {days.map((day, idx) => {
                if (day === null) {
                  return <div key={idx} />;
                }
                const date = new Date(year, month, day);
                const items = getItemsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className={`p-2 min-h-[120px] border rounded-2xl text-left flex flex-col gap-2 transition ${
                      isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-white'
                    } ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
                  >
                    <div className={`font-semibold ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
                      {day}
                    </div>
                    <div className="space-y-1 flex-1 overflow-hidden">
                      {items.colleges.slice(0, 1).map((college) => (
                        <div
                          key={college._id}
                          className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 truncate"
                        >
                          {college.name}
                        </div>
                      ))}
                      {items.tasks.slice(0, 2).map((task) => (
                        <div
                          key={task._id}
                          className={`text-xs px-2 py-1 rounded-full truncate ${
                            task.completed ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {task.title}
                        </div>
                      ))}
                      {(items.tasks.length > 2 || items.colleges.length > 1) && (
                        <div className="text-xs text-gray-400">+ more</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Selected day</h2>
                <p className="text-sm text-gray-500">
                  {selectedDate ? formatDate(selectedDate) : 'Choose any date on the grid'}
                </p>
              </div>
            </div>
            {selectedDate && selectedItems && (selectedItems.tasks.length || selectedItems.colleges.length) ? (
              <div className="space-y-3">
                {selectedItems.colleges.map((college) => (
                  <div key={college._id} className="border border-red-100 rounded-2xl p-3 bg-red-50">
                    <p className="text-sm font-semibold text-red-800">{college.name}</p>
                    <p className="text-xs text-red-600">Deadline</p>
                  </div>
                ))}
                {selectedItems.tasks.map((task) => (
                  <div key={task._id} className="border border-gray-200 rounded-2xl p-3">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No items on this day.</p>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">Upcoming deadlines</h2>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-gray-500">Add colleges to see your countdown.</p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((college) => (
                  <div key={college._id} className="border border-gray-100 rounded-2xl p-3 flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{college.name}</p>
                      <p className="text-xs text-gray-500">College deadline</p>
                    </div>
                    <p className="text-sm font-semibold text-primary-600">
                      {college.deadline ? formatDate(college.deadline) : 'TBD'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
