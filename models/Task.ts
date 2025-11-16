import mongoose, { Schema, Document, Model } from 'mongoose';

export type TaskLabel = 'Essay' | 'Rec' | 'Testing' | 'Transcript' | 'Fees' | 'Supplement' | 'Other';
export type ReminderFrequency = 'none' | 'daily' | 'weekly';
export type ReminderChannel = 'email' | 'sms' | 'push';

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  collegeId?: mongoose.Types.ObjectId;
  title: string;
  notes?: string;
  label: TaskLabel;
  dueDate?: Date;
  reminderDate?: Date;
  completed: boolean;
  completedAt?: Date;
  snoozedUntil?: Date;
  priority: 'low' | 'medium' | 'high';
  reminderFrequency?: ReminderFrequency;
  reminderChannels?: ReminderChannel[];
  nextReminderAt?: Date;
  lastReminderSentAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
    },
    title: {
      type: String,
      required: true,
    },
    notes: String,
    label: {
      type: String,
      enum: ['Essay', 'Rec', 'Testing', 'Transcript', 'Fees', 'Supplement', 'Other'],
      default: 'Other',
    },
    dueDate: Date,
    reminderDate: Date,
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    snoozedUntil: Date,
    reminderFrequency: {
      type: String,
      enum: ['none', 'daily', 'weekly'],
      default: 'none',
    },
    reminderChannels: {
      type: [String],
      enum: ['email', 'sms', 'push'],
      default: ['email'],
    },
    nextReminderAt: Date,
    lastReminderSentAt: Date,
    acknowledgedAt: Date,
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ userId: 1, completed: 1, dueDate: 1 });
TaskSchema.index({ collegeId: 1 });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
