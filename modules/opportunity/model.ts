import mongoose, { Schema, Document, Model } from 'mongoose';

// UTM sub-document interface
export interface IUtm {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface IOpportunity extends Document {
  _id: mongoose.Types.ObjectId;
  name?: string;
  amount?: number;
  closingDate?: Date;
  utm?: IUtm;
  description?: string;
  externalId?: string;
  archived: boolean;
  // Relations
  contact?: mongoose.Types.ObjectId;
  ownerId?: mongoose.Types.ObjectId;
  priority?: mongoose.Types.ObjectId;
  pipelineId?: mongoose.Types.ObjectId;
  stageId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// UTM sub-schema
const UtmSchema = new Schema<IUtm>(
  {
    source: { type: String, trim: true },
    medium: { type: String, trim: true },
    campaign: { type: String, trim: true },
    term: { type: String, trim: true },
    content: { type: String, trim: true },
  },
  { _id: false }
);

const OpportunitySchema = new Schema<IOpportunity>(
  {
    name: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    closingDate: {
      type: Date,
    },
    utm: {
      type: UtmSchema,
    },
    description: {
      type: String,
    },
    externalId: {
      type: String,
      trim: true,
      index: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    // Relations
    contact: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    priority: {
      type: Schema.Types.ObjectId,
      ref: 'DictionaryItem',
      index: true,
    },
    pipelineId: {
      type: Schema.Types.ObjectId,
      ref: 'Pipeline',
      index: true,
    },
    stageId: {
      type: Schema.Types.ObjectId,
      ref: 'PipelineStage',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
OpportunitySchema.index({ archived: 1 });
OpportunitySchema.index({ closingDate: 1 });
OpportunitySchema.index({ name: 'text', description: 'text' });

const Opportunity: Model<IOpportunity> =
  mongoose.models.Opportunity || mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);

export default Opportunity;
