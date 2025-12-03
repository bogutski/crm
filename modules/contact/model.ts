import mongoose, { Schema, Document, Model } from 'mongoose';

export type PhoneType = 'MOBILE' | 'FIXED_LINE' | 'UNKNOWN';

// Sub-document interfaces
export interface IEmail {
  address: string;
  isVerified: boolean;
  isSubscribed: boolean;
  unsubscribedAt?: Date;
  bouncedAt?: Date;
  lastEmailedAt?: Date;
}

export interface IPhone {
  e164: string;
  international: string;
  country: string;
  type: PhoneType;
  isPrimary: boolean;
  isVerified: boolean;
  isSubscribed: boolean;
  unsubscribedAt?: Date;
  lastSmsAt?: Date;
}

export interface IContactType {
  _id: mongoose.Types.ObjectId;
  name: string;
  properties: {
    color?: string;
    [key: string]: unknown;
  };
}

export interface IContact extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  emails: IEmail[];
  phones: IPhone[];
  company?: string;
  position?: string;
  notes?: string;
  contactType?: mongoose.Types.ObjectId | IContactType; // ссылка на DictionaryItem
  source?: string; // код из словаря sources
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas
const EmailSchema = new Schema<IEmail>(
  {
    address: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isSubscribed: {
      type: Boolean,
      default: true,
    },
    unsubscribedAt: {
      type: Date,
    },
    bouncedAt: {
      type: Date,
    },
    lastEmailedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const PhoneSchema = new Schema<IPhone>(
  {
    e164: {
      type: String,
      required: true,
      trim: true,
    },
    international: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['MOBILE', 'FIXED_LINE', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isSubscribed: {
      type: Boolean,
      default: true,
    },
    unsubscribedAt: {
      type: Date,
    },
    lastSmsAt: {
      type: Date,
    },
  },
  { _id: false }
);

const ContactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    emails: {
      type: [EmailSchema],
      default: [],
    },
    phones: {
      type: [PhoneSchema],
      default: [],
    },
    company: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
    contactType: {
      type: Schema.Types.ObjectId,
      ref: 'DictionaryItem',
      index: true,
    },
    source: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
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

ContactSchema.index({ 'emails.address': 1 });
ContactSchema.index({ 'phones.e164': 1 });
ContactSchema.index({ ownerId: 1 });
ContactSchema.index({ name: 'text', company: 'text' });

const Contact: Model<IContact> =
  mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;
