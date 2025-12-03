// Типы правил маршрутизации звонков

// === Условия срабатывания ===

export const TRIGGER_CONDITIONS = [
  'always',           // Всегда
  'working_hours',    // В рабочее время
  'after_hours',      // Вне рабочего времени
  'no_answer',        // Не ответил
  'busy',             // Занят
  'offline',          // Не в сети
  'schedule',         // По расписанию
  'vip_caller',       // VIP клиент
  'new_caller',       // Новый звонящий
] as const;
export type TriggerCondition = typeof TRIGGER_CONDITIONS[number];

// === Типы действий ===

export const ACTION_TYPES = [
  'forward_manager',     // Переадресация на другого менеджера
  'forward_number',      // Переадресация на номер
  'forward_ai_agent',    // Переадресация на AI агента
  'voicemail',           // Голосовая почта
  'ivr',                 // IVR меню
  'queue',               // Очередь
  'hangup',              // Завершить звонок
  'play_message',        // Проиграть сообщение
] as const;
export type ActionType = typeof ACTION_TYPES[number];

// === Расписание ===

export interface Schedule {
  timezone: string;       // e.g., 'Europe/Moscow'
  workingDays: number[];  // 0-6 (0 = Sunday)
  startTime: string;      // HH:mm format
  endTime: string;        // HH:mm format
  holidays?: string[];    // ISO dates to exclude
}

// === Действие правила ===

export interface RuleAction {
  type: ActionType;

  // Для forward_manager
  targetUserId?: string;

  // Для forward_number
  targetNumber?: string;

  // Для forward_ai_agent
  aiProviderId?: string;
  aiPromptTemplate?: string;
  aiAssistantId?: string;

  // Для voicemail
  voicemailGreeting?: string;
  transcribeVoicemail?: boolean;
  sendTranscriptTo?: string;   // Email

  // Для ivr
  ivrMenuId?: string;

  // Для queue
  queueId?: string;

  // Для play_message
  messageUrl?: string;
  messageText?: string;     // TTS

  // Общие опции
  recordCall?: boolean;
  notifyOriginalOwner?: boolean;
  createTask?: boolean;
  taskPriority?: 'low' | 'medium' | 'high';
}

// === Основной интерфейс правила ===

export interface CallRoutingRule {
  id: string;
  phoneLineId: string;      // Телефонная линия
  name: string;
  description?: string;
  priority: number;          // Порядок применения (выше = раньше)
  isActive: boolean;

  // Условия срабатывания
  condition: TriggerCondition;
  schedule?: Schedule;       // Для condition = 'schedule' | 'working_hours' | 'after_hours'
  noAnswerRings?: number;    // Для condition = 'no_answer'

  // Действие
  action: RuleAction;

  // Метаданные
  triggeredCount: number;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// === DTOs ===

export interface CreateCallRoutingRuleDTO {
  phoneLineId: string;
  name: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
  condition: TriggerCondition;
  schedule?: Schedule;
  noAnswerRings?: number;
  action: RuleAction;
}

export interface UpdateCallRoutingRuleDTO {
  name?: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
  condition?: TriggerCondition;
  schedule?: Schedule;
  noAnswerRings?: number;
  action?: Partial<RuleAction>;
}

// === Response types ===

export interface CallRoutingRuleResponse {
  id: string;
  phoneLineId: string;
  phoneNumber?: string;        // Populated
  phoneLineDisplayName?: string;
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

export interface CallRoutingRuleListResponse {
  rules: CallRoutingRuleResponse[];
  total: number;
}

// === Вспомогательные типы для UI ===

export interface ConditionOption {
  value: TriggerCondition;
  label: string;
  description: string;
  requiresSchedule?: boolean;
  requiresRings?: boolean;
}

export interface ActionOption {
  value: ActionType;
  label: string;
  description: string;
  requiresTargetUser?: boolean;
  requiresTargetNumber?: boolean;
  requiresAiProvider?: boolean;
}

export const CONDITION_OPTIONS: ConditionOption[] = [
  { value: 'always', label: 'Всегда', description: 'Применяется ко всем звонкам' },
  { value: 'working_hours', label: 'Рабочее время', description: 'В рабочие часы', requiresSchedule: true },
  { value: 'after_hours', label: 'Нерабочее время', description: 'Вне рабочих часов', requiresSchedule: true },
  { value: 'no_answer', label: 'Нет ответа', description: 'Если не ответили после N гудков', requiresRings: true },
  { value: 'busy', label: 'Занято', description: 'Если линия занята' },
  { value: 'offline', label: 'Не в сети', description: 'Если менеджер офлайн' },
  { value: 'schedule', label: 'По расписанию', description: 'В определённые дни/часы', requiresSchedule: true },
  { value: 'vip_caller', label: 'VIP клиент', description: 'Для VIP контактов' },
  { value: 'new_caller', label: 'Новый звонящий', description: 'Для неизвестных номеров' },
];

export const ACTION_OPTIONS: ActionOption[] = [
  { value: 'forward_manager', label: 'Переадресовать на менеджера', description: 'Перенаправить на другого сотрудника', requiresTargetUser: true },
  { value: 'forward_number', label: 'Переадресовать на номер', description: 'Перенаправить на внешний номер', requiresTargetNumber: true },
  { value: 'forward_ai_agent', label: 'AI ассистент', description: 'Перенаправить на AI голосового агента', requiresAiProvider: true },
  { value: 'voicemail', label: 'Голосовая почта', description: 'Записать голосовое сообщение' },
  { value: 'ivr', label: 'IVR меню', description: 'Голосовое меню с выбором' },
  { value: 'queue', label: 'Очередь', description: 'Поставить в очередь ожидания' },
  { value: 'play_message', label: 'Проиграть сообщение', description: 'Воспроизвести аудио или TTS' },
  { value: 'hangup', label: 'Завершить', description: 'Завершить звонок' },
];
