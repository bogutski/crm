import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sessionToken: string;
  expires: Date;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionToken: {
      type: String,
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    userAgent: {
      type: String,
    },
    ip: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

SessionSchema.index({ sessionToken: 1 }, { unique: true });
SessionSchema.index({ userId: 1 });
SessionSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default Session;
