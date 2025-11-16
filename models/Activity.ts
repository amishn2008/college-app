import mongoose, { Schema, Document, Model } from 'mongoose';

export type ActivityCategory =
  | 'Academic'
  | 'Arts'
  | 'Athletics'
  | 'Community Service'
  | 'Work'
  | 'Leadership'
  | 'Research'
  | 'Other';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  role?: string;
  organization?: string;
  description?: string;
  impact?: string;
  category: ActivityCategory;
  gradeLevels: string[];
  hoursPerWeek?: number;
  weeksPerYear?: number;
  commitmentLevel: 'low' | 'medium' | 'high';
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    impact: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Academic',
        'Arts',
        'Athletics',
        'Community Service',
        'Work',
        'Leadership',
        'Research',
        'Other',
      ],
      default: 'Other',
    },
    gradeLevels: {
      type: [String],
      default: [],
    },
    hoursPerWeek: Number,
    weeksPerYear: Number,
    commitmentLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    order: {
      type: Number,
      default: () => Date.now(),
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;
