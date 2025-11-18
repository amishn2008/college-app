import mongoose, { Schema, Document, Model } from 'mongoose';

export type HonorLevel = 'School' | 'Regional' | 'State' | 'National' | 'International';

export interface IHonor extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  organization?: string;
  description?: string;
  level: HonorLevel;
  year?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const HonorSchema = new Schema<IHonor>(
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
    organization: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      enum: ['School', 'Regional', 'State', 'National', 'International'],
      default: 'School',
    },
    year: {
      type: String,
      trim: true,
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

const Honor: Model<IHonor> = mongoose.models.Honor || mongoose.model<IHonor>('Honor', HonorSchema);

export default Honor;
