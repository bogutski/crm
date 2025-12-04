import mongoose, { Schema, Document } from 'mongoose';
import {
  TriggerCondition,
  ActionType,
  Schedule,
  RuleAction,
  TRIGGER_CONDITIONS,
  ACTION_TYPES,
} from './types';

// Интерфейс документа правила маршрутизации
export interface ICallRoutingRule extends Document {
  _id: mongoose.Types.ObjectId;
  phoneLineId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  condition: TriggerCondition;
  schedule?: Schedule;
  noAnswerRings?: number;
  action: RuleAction;
  triggeredCount: number;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Схема расписания
const ScheduleSchema = new Schema<Schedule>(
  {
    timezone: {
      type: String,
      required: true,
      default: 'Europe/Moscow',
    },
    workingDays: [{
      type: Number,
      min: 0,
      max: 6,
    }],
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    holidays: [{
      type: String,
    }],
  },
  { _id: false }
);

// Схема действия
const RuleActionSchema = new Schema<RuleAction>(
  {
    type: {
      type: String,
      required: true,
      enum: ACTION_TYPES,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    targetNumber: {
      type: String,
      trim: true,
    },
    aiProviderId: {
      type: Schema.Types.ObjectId,
      ref: 'ChannelProvider',
    },
    aiPromptTemplate: {
      type: String,
    },
    aiAssistantId: {
      type: String,
    },
    voicemailGreeting: {
      type: String,
    },
    transcribeVoicemail: {
      type: Boolean,
      default: true,
    },
    sendTranscriptTo: {
      type: String,
    },
    ivrMenuId: {
      type: String,
    },
    queueId: {
      type: String,
    },
    messageUrl: {
      type: String,
    },
    messageText: {
      type: String,
    },
    recordCall: {
      type: Boolean,
      default: true,
    },
    notifyOriginalOwner: {
      type: Boolean,
      default: true,
    },
    createTask: {
      type: Boolean,
      default: false,
    },
    taskPriority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { _id: false }
);

// Схема правила маршрутизации
const CallRoutingRuleSchema = new Schema<ICallRoutingRule>(
  {
    phoneLineId: {
      type: Schema.Types.ObjectId,
      ref: 'UserPhoneLine',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
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
    condition: {
      type: String,
      required: true,
      enum: TRIGGER_CONDITIONS,
    },
    schedule: {
      type: ScheduleSchema,
    },
    noAnswerRings: {
      type: Number,
      min: 1,
      max: 10,
      default: 3,
    },
    action: {
      type: RuleActionSchema,
      required: true,
    },
    triggeredCount: {
      type: Number,
      default: 0,
    },
    lastTriggered: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Индексы
CallRoutingRuleSchema.index({ phoneLineId: 1, isActive: 1, priority: -1 });
CallRoutingRuleSchema.index({ phoneLineId: 1, condition: 1 });
CallRoutingRuleSchema.index({ 'action.targetUserId': 1 });
CallRoutingRuleSchema.index({ 'action.aiProviderId': 1 });

// Модель
export const CallRoutingRule = mongoose.models.CallRoutingRule ||
  mongoose.model<ICallRoutingRule>('CallRoutingRule', CallRoutingRuleSchema);

export default CallRoutingRule;
