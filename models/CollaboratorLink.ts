import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  CollaboratorPermissions,
  CollaboratorRelationship,
} from '@/types/collaboration';
import { buildDefaultPermissions } from '@/types/collaboration';

export type CollaboratorStatus = 'pending' | 'active' | 'revoked';

export interface ICollaboratorLink extends Document {
  studentId: mongoose.Types.ObjectId;
  collaboratorId: mongoose.Types.ObjectId;
  relationship: CollaboratorRelationship;
  status: CollaboratorStatus;
  permissions: CollaboratorPermissions;
  createdBy: mongoose.Types.ObjectId;
  note?: string;
  acceptedAt?: Date;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CollaboratorLinkSchema = new Schema<ICollaboratorLink>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    collaboratorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    relationship: {
      type: String,
      enum: ['counselor', 'parent'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'revoked'],
      default: 'active',
      index: true,
    },
    permissions: {
      type: Schema.Types.Mixed,
      default: function defaultPermissions(this: ICollaboratorLink) {
        return buildDefaultPermissions(this.relationship);
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: String,
    acceptedAt: Date,
    lastSeenAt: Date,
  },
  {
    timestamps: true,
  }
);

CollaboratorLinkSchema.index(
  { studentId: 1, collaboratorId: 1 },
  { unique: true }
);

const CollaboratorLink: Model<ICollaboratorLink> =
  mongoose.models.CollaboratorLink ||
  mongoose.model<ICollaboratorLink>('CollaboratorLink', CollaboratorLinkSchema);

export default CollaboratorLink;
