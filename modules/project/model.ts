import mongoose, { Schema, Document, Model } from 'mongoose';

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: ProjectStatus;
  deadline?: Date;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'on_hold', 'cancelled'],
      default: 'active',
    },
    deadline: {
      type: Date,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ deadline: 1 });
ProjectSchema.index({ name: 'text', description: 'text' });

const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
