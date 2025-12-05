import mongoose, { Schema, Document } from 'mongoose';

// Типы провайдеров телефонии
export type TelephonyProviderCode = 'telnyx' | 'twilio' | 'vonage';

// Интерфейс учётных данных провайдера
export interface ITelephonyCredentials {
  // Telnyx
  apiKey?: string;

  // Twilio
  accountSid?: string;
  authToken?: string;

  // Vonage
  apiSecret?: string;
}

// Интерфейс настроек провайдера
export interface ITelephonyProviderSettings {
  defaultCallerId?: string; // Номер по умолчанию для исходящих
  recordCalls?: boolean; // Записывать звонки
  transcribeCalls?: boolean; // Транскрибировать звонки
  voicemailEnabled?: boolean; // Включить голосовую почту
}

// Интерфейс провайдера телефонии
export interface ITelephonyProvider extends Document {
  _id: mongoose.Types.ObjectId;
  code: TelephonyProviderCode;
  name: string;
  enabled: boolean;
  isActive: boolean; // Только один провайдер может быть активным

  credentials: ITelephonyCredentials;
  webhookUrl?: string; // URL для входящих событий
  webhookSecret?: string; // Секрет для валидации webhook

  settings: ITelephonyProviderSettings;

  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

// Схема учётных данных
const TelephonyCredentialsSchema = new Schema<ITelephonyCredentials>(
  {
    apiKey: {
      type: String,
      trim: true,
    },
    accountSid: {
      type: String,
      trim: true,
    },
    authToken: {
      type: String,
      trim: true,
    },
    apiSecret: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// Схема настроек провайдера
const TelephonyProviderSettingsSchema = new Schema<ITelephonyProviderSettings>(
  {
    defaultCallerId: {
      type: String,
      trim: true,
    },
    recordCalls: {
      type: Boolean,
      default: false,
    },
    transcribeCalls: {
      type: Boolean,
      default: false,
    },
    voicemailEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// Основная схема провайдера телефонии
const TelephonyProviderSchema = new Schema<ITelephonyProvider>(
  {
    code: {
      type: String,
      required: true,
      enum: ['telnyx', 'twilio', 'vonage'],
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    credentials: {
      type: TelephonyCredentialsSchema,
      default: {},
    },
    webhookUrl: {
      type: String,
      trim: true,
    },
    webhookSecret: {
      type: String,
      trim: true,
    },
    settings: {
      type: TelephonyProviderSettingsSchema,
      default: {},
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'telephony_providers',
  }
);

// Индексы
TelephonyProviderSchema.index({ code: 1 }, { unique: true });
TelephonyProviderSchema.index({ isActive: 1 });

// Middleware: только один провайдер может быть активным
TelephonyProviderSchema.pre('save', async function () {
  if (this.isActive && this.isModified('isActive')) {
    await mongoose.model('TelephonyProvider').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
});

export const TelephonyProvider =
  mongoose.models.TelephonyProvider ||
  mongoose.model<ITelephonyProvider>('TelephonyProvider', TelephonyProviderSchema);

export default TelephonyProvider;
