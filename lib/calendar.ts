import type { IUser } from '@/models/User';
import type { ITask } from '@/models/Task';
import type { ICollege } from '@/models/College';

const formatDate = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

export const buildCalendarFeed = ({
  user,
  tasks,
  colleges,
}: {
  user: IUser;
  tasks: ITask[];
  colleges: ICollege[];
}) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Admissions Forge//EN',
    'CALSCALE:GREGORIAN',
  ];

  tasks.forEach((task) => {
    if (!task.dueDate) return;
    const due = new Date(task.dueDate);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:task-${task._id}@collegecommand.center`);
    lines.push(`DTSTAMP:${formatDate(new Date())}`);
    lines.push(`DTSTART:${formatDate(due)}`);
    lines.push(`DTEND:${formatDate(new Date(due.getTime() + 60 * 60 * 1000))}`);
    lines.push(`SUMMARY:${task.title}`);
    lines.push(`DESCRIPTION:Task (${task.label}) via Admissions Forge`);
    lines.push('END:VEVENT');
  });

  colleges.forEach((college) => {
    if (!college.deadline) return;
    const due = new Date(college.deadline);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:college-${college._id}@collegecommand.center`);
    lines.push(`DTSTAMP:${formatDate(new Date())}`);
    lines.push(`DTSTART:${formatDate(due)}`);
    lines.push(`DTEND:${formatDate(new Date(due.getTime() + 2 * 60 * 60 * 1000))}`);
    lines.push(`SUMMARY:${college.name} deadline`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};
