import { z } from 'zod';
import { TRIGGER_CONDITIONS, ACTION_TYPES } from './types';

// === Вложенные схемы ===

const scheduleSchema = z.object({
  timezone: z.string()
    .min(1, 'Часовой пояс обязателен')
    .default('Europe/Moscow')
    .describe('Часовой пояс'),
  workingDays: z.array(z.number().min(0).max(6))
    .min(1, 'Выберите хотя бы один день')
    .default([1, 2, 3, 4, 5])
    .describe('Рабочие дни (0=Вс, 1=Пн, ..., 6=Сб)'),
  startTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Формат HH:mm')
    .default('09:00')
    .describe('Время начала'),
  endTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Формат HH:mm')
    .default('18:00')
    .describe('Время окончания'),
  holidays: z.array(z.string())
    .optional()
    .describe('Праздничные дни (ISO даты)'),
}).describe('Расписание');

const ruleActionSchema = z.object({
  type: z.enum(ACTION_TYPES, {
    errorMap: () => ({ message: 'Неверный тип действия' }),
  }).describe('Тип действия'),

  // Для forward_manager
  targetUserId: z.string().optional().describe('ID целевого менеджера'),

  // Для forward_number
  targetNumber: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Номер должен быть в формате E.164')
    .optional()
    .describe('Целевой номер'),

  // Для forward_ai_agent
  aiProviderId: z.string().optional().describe('ID AI провайдера'),
  aiPromptTemplate: z.string().max(5000).optional().describe('Шаблон промпта для AI'),
  aiAssistantId: z.string().optional().describe('ID ассистента AI'),

  // Для voicemail
  voicemailGreeting: z.string().max(1000).optional().describe('Приветствие голосовой почты'),
  transcribeVoicemail: z.boolean().optional().default(true).describe('Транскрибировать'),
  sendTranscriptTo: z.string().email('Неверный email').optional().describe('Email для транскрипта'),

  // Для ivr
  ivrMenuId: z.string().optional().describe('ID IVR меню'),

  // Для queue
  queueId: z.string().optional().describe('ID очереди'),

  // Для play_message
  messageUrl: z.string().url('Неверный URL').optional().describe('URL аудио'),
  messageText: z.string().max(500).optional().describe('Текст для TTS'),

  // Общие опции
  recordCall: z.boolean().optional().default(true).describe('Записывать звонок'),
  notifyOriginalOwner: z.boolean().optional().default(true).describe('Уведомить владельца'),
  createTask: z.boolean().optional().default(false).describe('Создать задачу'),
  taskPriority: z.enum(['low', 'medium', 'high']).optional().default('medium').describe('Приоритет задачи'),
}).describe('Действие правила');

// === Input schemas ===

export const createCallRoutingRuleSchema = z.object({
  phoneLineId: z.string()
    .min(1, 'ID телефонной линии обязателен')
    .describe('ID телефонной линии'),
  name: z.string()
    .min(1, 'Название обязательно')
    .max(100, 'Название не должно превышать 100 символов')
    .describe('Название правила'),
  description: z.string()
    .max(500, 'Описание не должно превышать 500 символов')
    .optional()
    .describe('Описание правила'),
  priority: z.number()
    .min(0, 'Минимальный приоритет 0')
    .max(100, 'Максимальный приоритет 100')
    .optional()
    .default(0)
    .describe('Приоритет (выше = раньше)'),
  isActive: z.boolean()
    .optional()
    .default(true)
    .describe('Активно ли правило'),
  condition: z.enum(TRIGGER_CONDITIONS, {
    errorMap: () => ({ message: 'Неверное условие' }),
  }).describe('Условие срабатывания'),
  schedule: scheduleSchema.optional().describe('Расписание'),
  noAnswerRings: z.number()
    .min(1, 'Минимум 1 гудок')
    .max(10, 'Максимум 10 гудков')
    .optional()
    .default(3)
    .describe('Гудков до срабатывания'),
  action: ruleActionSchema.describe('Действие'),
}).describe('Данные для создания правила маршрутизации');

export const updateCallRoutingRuleSchema = z.object({
  name: z.string()
    .min(1)
    .max(100)
    .optional()
    .describe('Название правила'),
  description: z.string()
    .max(500)
    .optional()
    .describe('Описание правила'),
  priority: z.number()
    .min(0)
    .max(100)
    .optional()
    .describe('Приоритет'),
  isActive: z.boolean()
    .optional()
    .describe('Активно ли правило'),
  condition: z.enum(TRIGGER_CONDITIONS)
    .optional()
    .describe('Условие срабатывания'),
  schedule: scheduleSchema.optional().describe('Расписание'),
  noAnswerRings: z.number()
    .min(1)
    .max(10)
    .optional()
    .describe('Гудков до срабатывания'),
  action: ruleActionSchema.partial().optional().describe('Действие'),
}).describe('Данные для обновления правила маршрутизации');

export const searchCallRoutingRulesSchema = z.object({
  phoneLineId: z.string().optional().describe('Фильтр по линии'),
  condition: z.enum(TRIGGER_CONDITIONS).optional().describe('Фильтр по условию'),
  actionType: z.enum(ACTION_TYPES).optional().describe('Фильтр по типу действия'),
  isActive: z.boolean().optional().describe('Фильтр по активности'),
  includeInactive: z.boolean().optional().default(false).describe('Включить неактивные'),
}).describe('Параметры поиска правил');

// === Response schemas ===

export const callRoutingRuleResponseSchema = z.object({
  id: z.string().describe('ID правила'),
  phoneLineId: z.string().describe('ID телефонной линии'),
  phoneNumber: z.string().optional().describe('Номер телефона'),
  phoneLineDisplayName: z.string().optional().describe('Название линии'),
  name: z.string().describe('Название'),
  description: z.string().optional().describe('Описание'),
  priority: z.number().describe('Приоритет'),
  isActive: z.boolean().describe('Активно'),
  condition: z.enum(TRIGGER_CONDITIONS).describe('Условие'),
  schedule: scheduleSchema.optional().describe('Расписание'),
  noAnswerRings: z.number().optional().describe('Гудков'),
  action: ruleActionSchema.describe('Действие'),
  triggeredCount: z.number().describe('Срабатываний'),
  lastTriggered: z.coerce.date().optional().describe('Последнее срабатывание'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('Правило маршрутизации');

export const callRoutingRuleListResponseSchema = z.object({
  rules: z.array(callRoutingRuleResponseSchema).describe('Список правил'),
  total: z.number().describe('Общее количество'),
}).describe('Список правил маршрутизации');

// === Input Types ===

export type CreateCallRoutingRuleInput = z.infer<typeof createCallRoutingRuleSchema>;
export type UpdateCallRoutingRuleInput = z.infer<typeof updateCallRoutingRuleSchema>;
export type SearchCallRoutingRulesInput = z.infer<typeof searchCallRoutingRulesSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type RuleActionInput = z.infer<typeof ruleActionSchema>;
