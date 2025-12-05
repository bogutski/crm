import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookLog extends Document {
  _id: mongoose.Types.ObjectId;
  webhookId: mongoose.Types.ObjectId;
  webhookName: string;
  event: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody: object | null;
  responseStatus: number | null;
  responseBody: string | null;
  error: string | null;
  duration: number;
  success: boolean;
  createdAt: Date;
}

const WebhookLogSchema = new Schema<IWebhookLog>(
  {
    webhookId: {
      type: Schema.Types.ObjectId,
      ref: 'Webhook',
      required: true,
    },
    webhookName: {
      type: String,
      required: true,
    },
    event: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    requestHeaders: {
      type: Schema.Types.Mixed,
      default: {},
    },
    requestBody: {
      type: Schema.Types.Mixed,
      default: null,
    },
    responseStatus: {
      type: Number,
      default: null,
    },
    responseBody: {
      type: String,
      default: null,
      maxlength: 2048, // Ограничиваем размер ответа
    },
    error: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Индекс для быстрого получения логов по webhook
WebhookLogSchema.index({ webhookId: 1, createdAt: -1 });

// TTL индекс - удаляем логи старше 30 дней
WebhookLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const WebhookLog: Model<IWebhookLog> =
  mongoose.models.WebhookLog || mongoose.model<IWebhookLog>('WebhookLog', WebhookLogSchema);

export default WebhookLog;
