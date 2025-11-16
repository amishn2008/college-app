import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEssayVersion {
  name: string;
  content: string;
  wordCount: number;
  createdAt: Date;
}

export interface IRewriteApproval {
  instruction?: string;
  content: string;
  previousContent?: string;
  approvedBy: {
    userId: mongoose.Types.ObjectId;
    name?: string;
  };
  approvedAt: Date;
  selectionStart?: number;
  selectionEnd?: number;
}

export interface IEssay extends Document {
  userId: mongoose.Types.ObjectId;
  collegeId?: mongoose.Types.ObjectId | null;
  title: string;
  prompt: string;
  wordLimit: number;
  currentContent: string;
  currentWordCount: number;
  versions: IEssayVersion[];
  completed: boolean;
  completedAt?: Date;
  rewriteApprovals?: IRewriteApproval[];
  createdAt: Date;
  updatedAt: Date;
}

const EssayVersionSchema = new Schema<IEssayVersion>(
  {
    name: String,
    content: String,
    wordCount: Number,
    createdAt: Date,
  },
  { _id: false }
);

const RewriteApprovalSchema = new Schema<IRewriteApproval>(
  {
    instruction: String,
    content: { type: String, required: true },
    previousContent: String,
    approvedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: String,
    },
    approvedAt: {
      type: Date,
      default: () => new Date(),
    },
    selectionStart: { type: Number },
    selectionEnd: { type: Number },
  },
  { _id: true }
);

const EssaySchema = new Schema<IEssay>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: false,
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    prompt: String,
    wordLimit: {
      type: Number,
      default: 650,
    },
    currentContent: {
      type: String,
      default: '',
    },
    currentWordCount: {
      type: Number,
      default: 0,
    },
    versions: [EssayVersionSchema],
    rewriteApprovals: {
      type: [RewriteApprovalSchema],
      default: [],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

EssaySchema.index({ userId: 1, collegeId: 1 });

const Essay: Model<IEssay> = mongoose.models.Essay || mongoose.model<IEssay>('Essay', EssaySchema);

export default Essay;
