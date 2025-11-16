import mongoose, { Schema, Document, Model } from 'mongoose';
import type { RequirementStatusMap } from '@/types/college';
import {
  REQUIREMENT_STATUS_VALUES,
  DEFAULT_REQUIREMENT_STATUS,
} from '@/types/college';

export type DecisionPlan = 'ED' | 'EA' | 'RD' | 'ED2' | 'EA2' | 'Rolling';

export type ApplicationPhase = 'researching' | 'drafting' | 'ready' | 'submitted' | 'decision';
export type DecisionStatus = 'pending' | 'accepted' | 'waitlisted' | 'rejected' | 'deferred';

const requirementStatusSchema = new Schema(
  {
    supplements: {
      type: String,
      enum: REQUIREMENT_STATUS_VALUES,
      default: 'in_progress',
    },
    recommendations: {
      type: String,
      enum: REQUIREMENT_STATUS_VALUES,
      default: 'in_progress',
    },
    testing: {
      type: String,
      enum: REQUIREMENT_STATUS_VALUES,
      default: 'not_needed',
    },
    transcript: {
      type: String,
      enum: REQUIREMENT_STATUS_VALUES,
      default: 'in_progress',
    },
    fees: {
      type: String,
      enum: REQUIREMENT_STATUS_VALUES,
      default: 'in_progress',
    },
  },
  { _id: false }
);

export interface ICollege extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  plan: DecisionPlan;
  deadline: Date;
  intake: 'Fall' | 'Spring' | 'Winter';
  region: string;
  requirements: {
    mainEssay: boolean;
    supplements: boolean;
    recommendations: boolean;
    testing: boolean;
    transcript: boolean;
    fees: boolean;
    custom: Array<{ title: string; completed: boolean }>;
  };
  requirementStatus: RequirementStatusMap;
  progress: {
    tasksCompleted: number;
    tasksTotal: number;
    essaysCompleted: number;
    essaysTotal: number;
    readinessScore: number;
  };
  portal?: {
    url?: string;
    notes?: string;
  };
  status?: {
    phase: ApplicationPhase;
    decision: DecisionStatus;
    submittedAt?: Date;
    decisionDate?: Date;
    notes?: string;
  };
  financialAid?: {
    priorityDeadline?: Date;
    scholarshipUrl?: string;
    notes?: string;
  };
  interview?: {
    required: boolean;
    scheduledAt?: Date;
    notes?: string;
  };
  notes?: string;
  submitted: boolean;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CollegeSchema = new Schema<ICollege>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ['ED', 'EA', 'RD', 'ED2', 'EA2', 'Rolling'],
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    intake: {
      type: String,
      enum: ['Fall', 'Spring', 'Winter'],
      default: 'Fall',
    },
    region: String,
    requirements: {
      mainEssay: { type: Boolean, default: true },
      supplements: { type: Boolean, default: false },
      recommendations: { type: Boolean, default: false },
      testing: { type: Boolean, default: false },
      transcript: { type: Boolean, default: false },
      fees: { type: Boolean, default: false },
      custom: [
        {
          title: String,
          completed: { type: Boolean, default: false },
        },
      ],
    },
    requirementStatus: {
      type: requirementStatusSchema,
      default: () => ({ ...DEFAULT_REQUIREMENT_STATUS }),
    },
    progress: {
      tasksCompleted: { type: Number, default: 0 },
      tasksTotal: { type: Number, default: 0 },
      essaysCompleted: { type: Number, default: 0 },
      essaysTotal: { type: Number, default: 0 },
      readinessScore: { type: Number, default: 0 },
    },
    submitted: {
      type: Boolean,
      default: false,
    },
    portal: {
      url: String,
      notes: String,
    },
    status: {
      phase: {
        type: String,
        enum: ['researching', 'drafting', 'ready', 'submitted', 'decision'],
        default: 'researching',
      },
      decision: {
        type: String,
        enum: ['pending', 'accepted', 'waitlisted', 'rejected', 'deferred'],
        default: 'pending',
      },
      submittedAt: Date,
      decisionDate: Date,
      notes: String,
    },
    financialAid: {
      priorityDeadline: Date,
      scholarshipUrl: String,
      notes: String,
    },
    interview: {
      required: { type: Boolean, default: false },
      scheduledAt: Date,
      notes: String,
    },
    notes: String,
    submittedAt: Date,
  },
  {
    timestamps: true,
  }
);

const College: Model<ICollege> = mongoose.models.College || mongoose.model<ICollege>('College', CollegeSchema);

export default College;
