import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApiToken extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  tokenHash: string;
  tokenPrefix: string; // Первые 8 символов для идентификации (crm_sk_xxx...)
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApiTokenSchema = new Schema<IApiToken>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    tokenPrefix: {
      type: String,
      required: true,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const ApiToken: Model<IApiToken> =
  mongoose.models.ApiToken || mongoose.model<IApiToken>('ApiToken', ApiTokenSchema);

export default ApiToken;
