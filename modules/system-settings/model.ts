import mongoose, { Schema, Document } from 'mongoose';

// Интерфейс системных настроек
// Используем паттерн singleton - всегда один документ в коллекции
export interface ISystemSettings extends Document {
  _id: mongoose.Types.ObjectId;
  // Общие настройки
  currency: string; // код валюты ISO 4217 (например, USD, EUR, RUB)
  currencySymbol: string; // символ валюты (например, $, €, ₽)
  currencyPosition: 'before' | 'after'; // позиция символа относительно суммы

  // Место для будущих настроек
  // companyName?: string;
  // timezone?: string;
  // dateFormat?: string;
  // ...

  updatedAt: Date;
  updatedBy?: mongoose.Types.ObjectId;
}

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
