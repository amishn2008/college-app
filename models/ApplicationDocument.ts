import mongoose, { Schema, Document, Model } from 'mongoose';

export type DocumentCategory =
  | 'resume'
  | 'transcript'
  | 'test_score'
  | 'portfolio'
  | 'counselor_form'
  | 'other';

export type DocumentStatus = 'draft' | 'in_review' | 'ready' | 'submitted';

export interface IApplicationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  collegeIds: mongoose.Types.ObjectId[];
  title: string;
  category: DocumentCategory;
  status: DocumentStatus;
  description?: string;
  fileUrl?: string;
  tags: string[];
  metadata?: {
    testName?: string;
    testDate?: Date;
    score?: string;
    superscore?: string;
    resumeSections?: Array<{ heading: string; bullets: string[] }>;
    portfolioLinks?: Array<{ label: string; url: string }>;
    counselorContact?: string;
  };
  lastTouchedBy?: mongoose.Types.ObjectId;
  lastTouchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSectionSchema = new Schema(
  {
    heading: String,
    bullets: [String],
  },
  { _id: false }
);

const portfolioLinkSchema = new Schema(
  {
    label: String,
    url: String,
  },
  { _id: false }
);

const metadataSchema = new Schema(
  {
    testName: String,
    testDate: Date,
    score: String,
    superscore: String,
    resumeSections: [resumeSectionSchema],
    portfolioLinks: [portfolioLinkSchema],
    counselorContact: String,
  },
  { _id: false }
);

const ApplicationDocumentSchema = new Schema<IApplicationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collegeIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'College',
      },
    ],
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['resume', 'transcript', 'test_score', 'portfolio', 'counselor_form', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'ready', 'submitted'],
      default: 'draft',
    },
    description: String,
    fileUrl: String,
    tags: {
      type: [String],
      default: [],
    },
    metadata: metadataSchema,
    lastTouchedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lastTouchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ApplicationDocumentSchema.index({ userId: 1, category: 1 });
ApplicationDocumentSchema.index({ userId: 1, status: 1 });
ApplicationDocumentSchema.index({ userId: 1, updatedAt: -1 });

const ApplicationDocument: Model<IApplicationDocument> =
  mongoose.models.ApplicationDocument ||
  mongoose.model<IApplicationDocument>('ApplicationDocument', ApplicationDocumentSchema);

export default ApplicationDocument;
