import mongoose, { Schema, Document } from 'mongoose';

// Тип роли в сообщении
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

// Интерфейс для вызова инструмента
export interface IToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startedAt?: Date;
  completedAt?: Date;
}

// Интерфейс для одного сообщения в диалоге
export interface IDialogueMessage {
  _id?: mongoose.Types.ObjectId;
  role: MessageRole;
  content: string;
  timestamp: Date;
  // Для tool вызовов с результатами
  toolCalls?: IToolCall[];
  // Для tool результатов (legacy)
  toolCallId?: string;
  // Метаданные
  metadata?: {
    model?: string;
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
    error?: string;
  };
}

// Интерфейс статуса диалога
export type DialogueStatus = 'active' | 'completed' | 'error';

// Интерфейс AI диалога
export interface IAIDialogue extends Document {
  _id: mongoose.Types.ObjectId;

  // Кто создал диалог
  userId: mongoose.Types.ObjectId;

  // Название диалога (можно генерировать из первого сообщения)
  title: string;

  // Статус диалога
  status: DialogueStatus;

  // Сообщения в диалоге
  messages: IDialogueMessage[];

  // Метаданные диалога
  metadata: {
    // Провайдер и модель
    provider: 'openai' | 'anthropic' | 'google';
    model: string;

    // Общая статистика
    totalTokens: number;
    totalMessages: number;

    // Контекст (опционально - для привязки к сущностям)
    context?: {
      entityType?: 'contact' | 'opportunity' | 'task';
      entityId?: mongoose.Types.ObjectId;
    };
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Схема сообщения
const DialogueMessageSchema = new Schema<IDialogueMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system', 'tool'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    toolCalls: [{
      id: String,
      name: String,
      arguments: Schema.Types.Mixed,
      result: Schema.Types.Mixed,
      error: String,
      status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'error'],
        default: 'completed',
      },
      startedAt: Date,
      completedAt: Date,
    }],
    toolCallId: String,
    metadata: {
      model: String,
      tokens: {
        prompt: Number,
        completion: Number,
        total: Number,
      },
      error: String,
    },
  },
  { _id: true }
);

// Схема диалога
const AIDialogueSchema = new Schema<IAIDialogue>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Новый диалог',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'error'],
      default: 'active',
      index: true,
    },
    messages: {
      type: [DialogueMessageSchema],
      default: [],
    },
    metadata: {
      provider: {
        type: String,
        enum: ['openai', 'anthropic', 'google'],
        required: true,
      },
      model: {
        type: String,
        required: true,
      },
      totalTokens: {
        type: Number,
        default: 0,
      },
      totalMessages: {
        type: Number,
        default: 0,
      },
      context: {
        entityType: {
          type: String,
          enum: ['contact', 'opportunity', 'task'],
        },
        entityId: Schema.Types.ObjectId,
      },
    },
    completedAt: Date,
  },
  {
    timestamps: true,
    collection: 'ai_assistant_dialogues',
  }
);

// Индексы для оптимизации запросов
AIDialogueSchema.index({ userId: 1, createdAt: -1 });
AIDialogueSchema.index({ 'metadata.provider': 1 });
AIDialogueSchema.index({ status: 1, updatedAt: -1 });

// Middleware для обновления статистики
AIDialogueSchema.pre('save', function() {
  if (this.isModified('messages')) {
    this.metadata.totalMessages = this.messages.length;

    // Обновляем общее количество токенов
    this.metadata.totalTokens = this.messages.reduce((sum, msg) => {
      return sum + (msg.metadata?.tokens?.total || 0);
    }, 0);
  }
});

export const AIDialogue = mongoose.models.AIDialogue ||
  mongoose.model<IAIDialogue>('AIDialogue', AIDialogueSchema);

export default AIDialogue;
