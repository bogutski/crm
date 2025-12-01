import mongoose, { Schema, Document, Model } from 'mongoose';

export type ContactStatus = 'active' | 'inactive' | 'lead' | 'customer';

export interface IContact extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  status: ContactStatus;
  source?: string;
  notes?: string;
  tags: string[];
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'lead', 'customer'],
      default: 'lead',
    },
    source: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ContactSchema.index({ email: 1 });
ContactSchema.index({ ownerId: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ firstName: 'text', lastName: 'text', company: 'text' });

const Contact: Model<IContact> =
  mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;
