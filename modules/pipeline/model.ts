import mongoose, { Schema, Document, Model } from 'mongoose';

// ==================== PIPELINE (Воронка) ====================

export interface IPipeline extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineSchema = new Schema<IPipeline>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PipelineSchema.index({ order: 1 });
PipelineSchema.index({ isActive: 1 });
PipelineSchema.index({ name: 'text', description: 'text' });

// ==================== PIPELINE STAGE (Этап воронки) ====================

export interface IPipelineStage extends Document {
  _id: mongoose.Types.ObjectId;
  pipelineId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  color: string;
  order: number;
  probability: number; // 0-100
  isInitial: boolean;
  isFinal: boolean;
  isWon: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineStageSchema = new Schema<IPipelineStage>(
  {
    pipelineId: {
      type: Schema.Types.ObjectId,
      ref: 'Pipeline',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    color: {
      type: String,
      default: '#6b7280',
    },
    order: {
      type: Number,
      default: 0,
    },
    probability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isInitial: {
      type: Boolean,
      default: false,
    },
    isFinal: {
      type: Boolean,
      default: false,
    },
    isWon: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PipelineStageSchema.index({ pipelineId: 1, order: 1 });
PipelineStageSchema.index({ pipelineId: 1, code: 1 }, { unique: true });
PipelineStageSchema.index({ pipelineId: 1, isInitial: 1 });

// Models
export const Pipeline: Model<IPipeline> =
  mongoose.models.Pipeline || mongoose.model<IPipeline>('Pipeline', PipelineSchema);

export const PipelineStage: Model<IPipelineStage> =
  mongoose.models.PipelineStage || mongoose.model<IPipelineStage>('PipelineStage', PipelineStageSchema);

export default { Pipeline, PipelineStage };
