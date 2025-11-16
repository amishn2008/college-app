import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShareLink extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  showEssayContent: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

const ShareLinkSchema = new Schema<IShareLink>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    showEssayContent: {
      type: Boolean,
      default: false,
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

ShareLinkSchema.index({ token: 1 });
ShareLinkSchema.index({ userId: 1 });

const ShareLink: Model<IShareLink> = mongoose.models.ShareLink || mongoose.model<IShareLink>('ShareLink', ShareLinkSchema);

export default ShareLink;

