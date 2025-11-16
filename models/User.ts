import mongoose, { Schema, Document, Model } from 'mongoose';
import type { WorkspaceData } from '@/types/workspace';
import { buildDefaultWorkspace } from '@/lib/workspace';
import type { CollaboratorPermissions } from '@/types/collaboration';
import { buildDefaultPermissions } from '@/types/collaboration';

export type UserRole = 'student' | 'counselor' | 'parent';

export interface IUser extends Document {
  email: string;
  name?: string;
  image?: string;
  intakeYear: number;
  regions: string[];
  role: UserRole;
  phone?: string;
  targetCollegeCount?: number;
  timezone?: string;
  emailVerified?: Date;
  workspace?: WorkspaceData;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    digestFrequency: 'daily' | 'weekly';
    reminderLeadDays: number;
  };
  counselorProfile?: {
    organization?: string;
    website?: string;
    bio?: string;
    defaultPermissions: CollaboratorPermissions;
  };
  calendarSync?: {
    token?: string;
    provider?: 'ics' | 'google' | 'apple';
    connectedAt?: Date;
  };
  activeStudentId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: String,
    image: String,
    intakeYear: {
      type: Number,
      required: true,
    },
    regions: [String],
    role: {
      type: String,
      enum: ['student', 'counselor', 'parent'],
      default: 'student',
      index: true,
    },
    phone: String,
    targetCollegeCount: Number,
    timezone: String,
    emailVerified: Date,
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      digestFrequency: {
        type: String,
        enum: ['daily', 'weekly'],
        default: 'weekly',
      },
      reminderLeadDays: {
        type: Number,
        default: 3,
      },
    },
    counselorProfile: {
      organization: String,
      website: String,
      bio: String,
      defaultPermissions: {
        type: Schema.Types.Mixed,
        default: () => buildDefaultPermissions('counselor'),
      },
    },
    calendarSync: {
      token: String,
      provider: {
        type: String,
        enum: ['ics', 'google', 'apple'],
        default: 'ics',
      },
      connectedAt: Date,
    },
    activeStudentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    workspace: {
      type: Schema.Types.Mixed,
      default: () => buildDefaultWorkspace(),
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
