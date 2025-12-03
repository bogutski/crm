import mongoose, { Schema, Document } from 'mongoose';

// Типы
export type InteractionDirection = 'inbound' | 'outbound';
export type InteractionStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

// Интерфейс документа взаимодействия
export interface IInteraction extends Document {
  _id: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  opportunityId?: mongoose.Types.ObjectId;
  direction: InteractionDirection;
  status: InteractionStatus;
  subject?: string;
  content: string;
  duration?: number;
  recordingUrl?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId;
}

// Схема взаимодействия
const InteractionSchema = new Schema<IInteraction>(
  {
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      index: true,
    },
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      index: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending',
    },
    subject: { type: String, trim: true },
    content: { type: String, required: true },
    duration: { type: Number, min: 0 },
    recordingUrl: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Индексы
InteractionSchema.index({ contactId: 1, createdAt: -1 });
InteractionSchema.index({ channelId: 1, createdAt: -1 });
InteractionSchema.index({ opportunityId: 1, createdAt: -1 });
InteractionSchema.index({ createdAt: -1 });

// Модель
export const Interaction = mongoose.models.Interaction || mongoose.model<IInteraction>('Interaction', InteractionSchema);

export default Interaction;
