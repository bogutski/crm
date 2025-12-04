import mongoose, { Schema, Document } from 'mongoose';
import {
  ProviderType,
  ProviderCategory,
  ProviderCapability,
  PROVIDER_TYPES,
  PROVIDER_CATEGORIES,
  PROVIDER_CAPABILITIES,
  TELEPHONY_PROVIDER_TYPES,
} from './types';

// Интерфейс документа провайдера
export interface IChannelProvider extends Document {
  _id: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  type: ProviderType;
  category: ProviderCategory;
  name: string;
  description?: string;
  // Encrypted config stored as string (JSON)
  configEncrypted: string;
  webhookUrl?: string;
  webhookSecret?: string;
  capabilities: ProviderCapability[];
  isDefault: boolean;
  priority: number;
  isActive: boolean;
  lastHealthCheck?: Date;
  healthStatus?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  createdAt: Date;
  updatedAt: Date;
}

// Схема провайдера
const ChannelProviderSchema = new Schema<IChannelProvider>(
  {
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: PROVIDER_TYPES,
    },
    category: {
      type: String,
      required: true,
      enum: PROVIDER_CATEGORIES,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    configEncrypted: {
      type: String,
      required: true,
      select: false, // По умолчанию не возвращается в запросах
    },
    webhookUrl: {
      type: String,
      trim: true,
    },
    webhookSecret: {
      type: String,
      select: false,
    },
    capabilities: [{
      type: String,
      enum: PROVIDER_CAPABILITIES,
    }],
    isDefault: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastHealthCheck: {
      type: Date,
    },
    healthStatus: {
      type: String,
      enum: ['healthy', 'degraded', 'unhealthy', 'unknown'],
      default: 'unknown',
    },
  },
  { timestamps: true }
);

// Индексы
ChannelProviderSchema.index({ channelId: 1, type: 1 });
ChannelProviderSchema.index({ channelId: 1, isDefault: 1 });
ChannelProviderSchema.index({ category: 1, isActive: 1 });
ChannelProviderSchema.index({ isActive: 1, priority: -1 });

// Middleware: автоматически определяем категорию на основе типа
ChannelProviderSchema.pre('save', function() {
  if (TELEPHONY_PROVIDER_TYPES.includes(this.type as typeof TELEPHONY_PROVIDER_TYPES[number])) {
    this.category = 'telephony';
  } else {
    this.category = 'ai_agent';
  }
});

// Middleware: при установке isDefault = true, сбрасываем isDefault у других провайдеров того же канала
ChannelProviderSchema.pre('save', async function() {
  if (this.isModified('isDefault') && this.isDefault) {
    await mongoose.model('ChannelProvider').updateMany(
      {
        channelId: this.channelId,
        category: this.category,
        _id: { $ne: this._id },
      },
      { isDefault: false }
    );
  }
});

// Модель
export const ChannelProvider = mongoose.models.ChannelProvider ||
  mongoose.model<IChannelProvider>('ChannelProvider', ChannelProviderSchema);

export default ChannelProvider;
