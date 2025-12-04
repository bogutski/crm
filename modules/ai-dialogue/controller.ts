import { AIDialogue, IAIDialogue, IDialogueMessage } from './model';
import mongoose from 'mongoose';

/**
 * Создать новый диалог
 */
export async function createDialogue(data: {
  userId: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  title?: string;
  context?: {
    entityType?: 'contact' | 'opportunity' | 'task';
    entityId?: string;
  };
}): Promise<IAIDialogue> {
  const dialogue = new AIDialogue({
    userId: new mongoose.Types.ObjectId(data.userId),
    title: data.title || 'Новый диалог',
    status: 'active',
    messages: [],
    metadata: {
      provider: data.provider,
      model: data.model,
      totalTokens: 0,
      totalMessages: 0,
      context: data.context ? {
        entityType: data.context.entityType,
        entityId: data.context.entityId ? new mongoose.Types.ObjectId(data.context.entityId) : undefined,
      } : undefined,
    },
  });

  await dialogue.save();
  return dialogue;
}

/**
 * Добавить сообщение в диалог
 */
export async function addMessage(
  dialogueId: string,
  message: Omit<IDialogueMessage, 'timestamp'>
): Promise<IAIDialogue> {
  const dialogue = await AIDialogue.findById(dialogueId);

  if (!dialogue) {
    throw new Error('Dialogue not found');
  }

  dialogue.messages.push({
    ...message,
    timestamp: new Date(),
  } as IDialogueMessage);

  await dialogue.save();
  return dialogue;
}

/**
 * Получить диалог по ID
 */
export async function getDialogue(dialogueId: string): Promise<IAIDialogue | null> {
  return AIDialogue.findById(dialogueId);
}

/**
 * Получить все диалоги пользователя
 */
export async function getUserDialogues(
  userId: string,
  options: {
    limit?: number;
    skip?: number;
    status?: 'active' | 'completed' | 'error';
  } = {}
): Promise<{ dialogues: IAIDialogue[]; total: number }> {
  const query: any = { userId: new mongoose.Types.ObjectId(userId) };

  if (options.status) {
    query.status = options.status;
  }

  const [dialogues, total] = await Promise.all([
    AIDialogue.find(query)
      .sort({ updatedAt: -1 })
      .limit(options.limit || 50)
      .skip(options.skip || 0),
    AIDialogue.countDocuments(query),
  ]);

  return { dialogues, total };
}

/**
 * Получить активный диалог пользователя (последний)
 */
export async function getActiveDialogue(userId: string): Promise<IAIDialogue | null> {
  return AIDialogue.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    status: 'active',
  }).sort({ updatedAt: -1 });
}

/**
 * Обновить статус диалога
 */
export async function updateDialogueStatus(
  dialogueId: string,
  status: 'active' | 'completed' | 'error'
): Promise<IAIDialogue | null> {
  const dialogue = await AIDialogue.findById(dialogueId);

  if (!dialogue) {
    return null;
  }

  dialogue.status = status;

  if (status === 'completed' || status === 'error') {
    dialogue.completedAt = new Date();
  }

  await dialogue.save();
  return dialogue;
}

/**
 * Обновить заголовок диалога
 */
export async function updateDialogueTitle(
  dialogueId: string,
  title: string
): Promise<IAIDialogue | null> {
  return AIDialogue.findByIdAndUpdate(
    dialogueId,
    { title },
    { new: true }
  );
}

/**
 * Удалить диалог
 */
export async function deleteDialogue(dialogueId: string): Promise<boolean> {
  const result = await AIDialogue.deleteOne({ _id: dialogueId });
  return result.deletedCount > 0;
}

/**
 * Получить статистику по диалогам пользователя
 */
export async function getUserDialogueStats(userId: string): Promise<{
  total: number;
  active: number;
  completed: number;
  totalTokens: number;
  totalMessages: number;
}> {
  const stats = await AIDialogue.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        totalTokens: { $sum: '$metadata.totalTokens' },
        totalMessages: { $sum: '$metadata.totalMessages' },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      active: 0,
      completed: 0,
      totalTokens: 0,
      totalMessages: 0,
    };
  }

  return stats[0];
}
