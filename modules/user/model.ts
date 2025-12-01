import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'admin' | 'manager' | 'user';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  passwordHash?: string;
  image?: string;
  roles: UserRole[];
  isActive: boolean;
  googleId?: string;
  lastLoginAt?: Date;
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
    },
    image: {
      type: String,
    },
    roles: {
      type: [String],
      enum: ['admin', 'manager', 'user'],
      default: ['user'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    googleId: {
      type: String,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ googleId: 1 }, { sparse: true });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
