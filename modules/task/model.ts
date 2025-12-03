import mongoose, { Schema, Document, Model } from 'mongoose';

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type LinkedEntityType = 'contact' | 'project';

export interface ILinkedEntity {
  entityType: LinkedEntityType;
  entityId: mongoose.Types.ObjectId;
}

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priorityId?: mongoose.Types.ObjectId;
  dueDate?: Date;
  completedAt?: Date;
  assigneeId?: mongoose.Types.ObjectId;
  linkedTo?: ILinkedEntity;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LinkedEntitySchema = new Schema<ILinkedEntity>(
  {
    entityType: {
      type: String,
      enum: ['contact', 'project'],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'linkedTo.entityType',
    },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITask>(
  {
    title: {
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
      enum: ['open', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    priorityId: {
      type: Schema.Types.ObjectId,
      ref: 'DictionaryItem',
      index: true,
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    linkedTo: {
      type: LinkedEntitySchema,
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
TaskSchema.index({ status: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ 'linkedTo.entityType': 1, 'linkedTo.entityId': 1 });
TaskSchema.index({ title: 'text', description: 'text' });

// Virtual population for linkedTo based on entityType
TaskSchema.virtual('linkedEntity', {
  refPath: 'linkedTo.entityType',
  localField: 'linkedTo.entityId',
  foreignField: '_id',
  justOne: true,
});

const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
