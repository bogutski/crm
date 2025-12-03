import mongoose, { Schema, Document } from 'mongoose';

// Интерфейс документа канала
export interface IChannel extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Схема канала
const ChannelSchema = new Schema<IChannel>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: 'message-circle', trim: true },
    color: { type: String, default: '#6b7280', trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Индексы
ChannelSchema.index({ name: 'text' });
ChannelSchema.index({ isActive: 1 });

// Модель
export const Channel = mongoose.models.Channel || mongoose.model<IChannel>('Channel', ChannelSchema);

export default Channel;
