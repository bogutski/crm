import mongoose, { Schema, Document } from 'mongoose';

// AI Provider types
export type AIProvider = 'openai' | 'anthropic' | 'google';

// Интерфейс настроек AI провайдера
export interface IAIProviderConfig {
  enabled: boolean;
  apiKey?: string; // зашифрованный или хэшированный
  model: string; // например, 'gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-pro'
}

// Интерфейс AI настроек
export interface IAISettings {
  activeProvider?: AIProvider; // активный провайдер
  providers: {
    openai?: IAIProviderConfig;
    anthropic?: IAIProviderConfig;
    google?: IAIProviderConfig;
  };
}

// Интерфейс системных настроек
// Используем паттерн singleton - всегда один документ в коллекции
export interface ISystemSettings extends Document {
  _id: mongoose.Types.ObjectId;
  // Общие настройки
  currency: string; // код валюты ISO 4217 (например, USD, EUR, RUB)
  currencySymbol: string; // символ валюты (например, $, €, ₽)
  currencyPosition: 'before' | 'after'; // позиция символа относительно суммы

  // AI настройки
  ai?: IAISettings;

  // Место для будущих настроек
  // companyName?: string;
  // timezone?: string;
  // dateFormat?: string;
  // ...

  updatedAt: Date;
  updatedBy?: mongoose.Types.ObjectId;
}

// Схема настроек AI провайдера
const AIProviderConfigSchema = new Schema<IAIProviderConfig>(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    apiKey: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

// Схема AI настроек
const AISettingsSchema = new Schema<IAISettings>(
  {
    activeProvider: {
      type: String,
      enum: ['openai', 'anthropic', 'google'],
    },
    providers: {
      openai: AIProviderConfigSchema,
      anthropic: AIProviderConfigSchema,
      google: AIProviderConfigSchema,
    },
  },
  { _id: false }
);

// Схема системных настроек
const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    currency: {
      type: String,
      required: true,
      default: 'RUB',
      uppercase: true,
      trim: true,
    },
    currencySymbol: {
      type: String,
      required: true,
      default: '₽',
      trim: true,
    },
    currencyPosition: {
      type: String,
      enum: ['before', 'after'],
      default: 'after',
    },
    ai: {
      type: AISettingsSchema,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    collection: 'system_settings',
  }
);

export const SystemSettings = mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

export default SystemSettings;
