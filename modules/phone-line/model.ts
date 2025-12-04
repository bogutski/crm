import mongoose, { Schema, Document } from 'mongoose';
import { LineCapability, LINE_CAPABILITIES } from './types';

// Интерфейс документа телефонной линии
export interface IUserPhoneLine extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  phoneNumber: string;
  displayName: string;
  capabilities: LineCapability[];
  isDefault: boolean;
  isActive: boolean;

  // Настройки переадресации
  forwardingEnabled: boolean;
  forwardTo?: string;
  forwardOnBusy: boolean;
  forwardOnNoAnswer: boolean;
  forwardOnOffline: boolean;
  forwardAfterRings: number;

  // SIP настройки
  sipUsername?: string;
  sipDomain?: string;

  // Статистика
  lastInboundCall?: Date;
  lastOutboundCall?: Date;
  totalInboundCalls: number;
  totalOutboundCalls: number;

  createdAt: Date;
  updatedAt: Date;
}

// Схема телефонной линии
const UserPhoneLineSchema = new Schema<IUserPhoneLine>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'ChannelProvider',
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
      // E.164 format validation
      validate: {
        validator: function(v: string) {
          return /^\+[1-9]\d{1,14}$/.test(v);
        },
        message: 'Номер телефона должен быть в формате E.164 (например, +74951234567)'
      }
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    capabilities: [{
      type: String,
      enum: LINE_CAPABILITIES,
    }],
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Переадресация
    forwardingEnabled: {
      type: Boolean,
      default: false,
    },
    forwardTo: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true;
          return /^\+[1-9]\d{1,14}$/.test(v);
        },
        message: 'Номер для переадресации должен быть в формате E.164'
      }
    },
    forwardOnBusy: {
      type: Boolean,
      default: true,
    },
    forwardOnNoAnswer: {
      type: Boolean,
      default: true,
    },
    forwardOnOffline: {
      type: Boolean,
      default: true,
    },
    forwardAfterRings: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },

    // SIP
    sipUsername: {
      type: String,
      trim: true,
    },
    sipDomain: {
      type: String,
      trim: true,
    },

    // Статистика
    lastInboundCall: {
      type: Date,
    },
    lastOutboundCall: {
      type: Date,
    },
    totalInboundCalls: {
      type: Number,
      default: 0,
    },
    totalOutboundCalls: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Индексы
UserPhoneLineSchema.index({ userId: 1, isActive: 1 });
UserPhoneLineSchema.index({ userId: 1, isDefault: 1 });
UserPhoneLineSchema.index({ phoneNumber: 1 }, { unique: true });
UserPhoneLineSchema.index({ providerId: 1 });

// Middleware: при установке isDefault = true, сбрасываем у других линий пользователя
UserPhoneLineSchema.pre('save', async function() {
  if (this.isModified('isDefault') && this.isDefault) {
    await mongoose.model('UserPhoneLine').updateMany(
      {
        userId: this.userId,
        _id: { $ne: this._id },
      },
      { isDefault: false }
    );
  }
});

// Модель
export const UserPhoneLine = mongoose.models.UserPhoneLine ||
  mongoose.model<IUserPhoneLine>('UserPhoneLine', UserPhoneLineSchema);

export default UserPhoneLine;
