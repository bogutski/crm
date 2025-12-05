import mongoose, { Schema, Document, Model } from 'mongoose';

// HTTP методы для исходящих запросов
export type WebhookMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Заголовок запроса
export interface IWebhookHeader {
  key: string;
  value: string;
}

export interface IWebhook extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  url: string;
  method: WebhookMethod;
  headers: IWebhookHeader[];
  events: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookHeaderSchema = new Schema<IWebhookHeader>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const WebhookSchema = new Schema<IWebhook>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      default: 'POST',
    },
    headers: {
      type: [WebhookHeaderSchema],
      default: [],
    },
    events: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'Должно быть выбрано хотя бы одно событие',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Индекс для быстрого поиска по событиям
WebhookSchema.index({ events: 1, isActive: 1 });

const Webhook: Model<IWebhook> =
  mongoose.models.Webhook || mongoose.model<IWebhook>('Webhook', WebhookSchema);

export default Webhook;
