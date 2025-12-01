import mongoose, { Schema, Document, Model } from 'mongoose';

export type OpportunityStage =
  | 'prospecting'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export type OpportunityPriority = 'low' | 'medium' | 'high';

export interface IOpportunity extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: OpportunityStage;
  priority: OpportunityPriority;
  probability: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  contactId?: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const OpportunitySchema = new Schema<IOpportunity>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    stage: {
      type: String,
      enum: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
      default: 'prospecting',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    expectedCloseDate: {
      type: Date,
    },
    actualCloseDate: {
      type: Date,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

OpportunitySchema.index({ ownerId: 1 });
OpportunitySchema.index({ contactId: 1 });
OpportunitySchema.index({ stage: 1 });
OpportunitySchema.index({ expectedCloseDate: 1 });
OpportunitySchema.index({ title: 'text', description: 'text' });

const Opportunity: Model<IOpportunity> =
  mongoose.models.Opportunity || mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);

export default Opportunity;
