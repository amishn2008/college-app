import type { ITask, ReminderFrequency, ReminderChannel } from '@/models/Task';
import type { IUser } from '@/models/User';

const channelLabels: Record<ReminderChannel, string> = {
  email: 'email',
  sms: 'SMS',
  push: 'push',
};

const frequencyOffsets: Record<ReminderFrequency, number> = {
  none: 0,
  daily: 1,
  weekly: 7,
};

export const countWords = (text: string) =>
  text.trim().split(/\s+/).filter((word) => word.length > 0).length;

export const computeNextReminder = (task: ITask): Date | null => {
  if (task.reminderFrequency === 'none' || !task.reminderFrequency) {
    return null;
  }
  if (task.snoozedUntil && task.snoozedUntil > new Date()) {
    return task.snoozedUntil;
  }
  const offsetDays = frequencyOffsets[task.reminderFrequency] || 0;
  const base = task.nextReminderAt && task.nextReminderAt > new Date()
    ? task.nextReminderAt
    : new Date();
  const next = new Date(base);
  next.setDate(base.getDate() + offsetDays || 1);
  return next;
};

export const shouldSendReminder = (task: ITask) => {
  if (task.reminderFrequency === 'none') return false;
  if (!task.nextReminderAt) return false;
  if (task.completed) return false;
  if (task.acknowledgedAt && task.acknowledgedAt > task.nextReminderAt) return false;
  return task.nextReminderAt <= new Date();
};

export const sendTaskReminder = async (task: ITask, user: IUser) => {
  const channels = task.reminderChannels?.length ? task.reminderChannels : ['email'];
  const channelList = channels.map((channel) => channelLabels[channel]).join(', ');
  console.log(
    `[reminder] ${user.email} – task "${task.title}" via ${channelList} (due ${task.dueDate})`
  );
};
