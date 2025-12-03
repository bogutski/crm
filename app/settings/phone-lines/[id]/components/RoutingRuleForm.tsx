'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Bot, Phone, User, Clock, Info } from 'lucide-react';

interface Provider {
  id: string;
  type: string;
  name: string;
  category: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

interface Schedule {
  timezone: string;
  workingDays: number[];
  startTime: string;
  endTime: string;
}

interface RuleAction {
  type: string;
  targetUserId?: string;
  targetNumber?: string;
  aiProviderId?: string;
  aiAssistantId?: string;
  aiPromptTemplate?: string;
  voicemailGreeting?: string;
  messageText?: string;
  recordCall?: boolean;
  notifyOriginalOwner?: boolean;
  createTask?: boolean;
  taskPriority?: 'low' | 'medium' | 'high';
}

interface RoutingRule {
  id: string;
  phoneLineId: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  condition: string;
  schedule?: Schedule;
  noAnswerRings?: number;
  action: RuleAction;
}

interface RoutingRuleFormProps {
  phoneLineId: string;
  rule?: RoutingRule;
  onSuccess: () => void;
  onCancel: () => void;
}

const CONDITION_OPTIONS = [
  { value: 'always', label: 'Всегда', description: 'Применяется ко всем звонкам', requiresSchedule: false },
  { value: 'working_hours', label: 'В рабочее время', description: 'Только в рабочие часы', requiresSchedule: true },
  { value: 'after_hours', label: 'Вне рабочего времени', description: 'В нерабочее время', requiresSchedule: true },
  { value: 'no_answer', label: 'Нет ответа', description: 'Если не ответили', requiresRings: true },
  { value: 'busy', label: 'Линия занята', description: 'Если идёт другой разговор', requiresSchedule: false },
  { value: 'offline', label: 'Не в сети', description: 'Если менеджер офлайн', requiresSchedule: false },
  { value: 'schedule', label: 'По расписанию', description: 'В определённое время', requiresSchedule: true },
  { value: 'vip_caller', label: 'VIP клиент', description: 'Для VIP контактов', requiresSchedule: false },
  { value: 'new_caller', label: 'Новый звонящий', description: 'Неизвестный номер', requiresSchedule: false },
];

const ACTION_OPTIONS = [
  { value: 'forward_manager', label: 'Переадресовать на менеджера', icon: User, requiresUser: true },
  { value: 'forward_number', label: 'Переадресовать на номер', icon: Phone, requiresNumber: true },
  { value: 'forward_ai_agent', label: 'AI голосовой ассистент', icon: Bot, requiresAI: true },
  { value: 'voicemail', label: 'Голосовая почта', icon: Phone, requiresVoicemail: true },
  { value: 'play_message', label: 'Проиграть сообщение', icon: Phone, requiresMessage: true },
  { value: 'hangup', label: 'Завершить звонок', icon: Phone },
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 0, label: 'Вс' },
];

const formSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  isActive: z.boolean(),
  condition: z.string().min(1, 'Условие обязательно'),
  noAnswerRings: z.number().optional(),
  scheduleEnabled: z.boolean(),
  scheduleTimezone: z.string(),
  scheduleWorkingDays: z.array(z.number()),
  scheduleStartTime: z.string(),
  scheduleEndTime: z.string(),
  actionType: z.string().min(1, 'Действие обязательно'),
  actionTargetUserId: z.string().optional(),
  actionTargetNumber: z.string().optional(),
  actionAiProviderId: z.string().optional(),
  actionAiAssistantId: z.string().optional(),
  actionAiPromptTemplate: z.string().optional(),
  actionVoicemailGreeting: z.string().optional(),
  actionMessageText: z.string().optional(),
  actionRecordCall: z.boolean(),
  actionNotifyOwner: z.boolean(),
  actionCreateTask: z.boolean(),
  actionTaskPriority: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export function RoutingRuleForm({ phoneLineId, rule, onSuccess, onCancel }: RoutingRuleFormProps) {
  const isEditing = !!rule;
  const [providers, setProviders] = useState<Provider[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: rule?.name || '',
      description: rule?.description || '',
      isActive: rule?.isActive ?? true,
      condition: rule?.condition || 'no_answer',
      noAnswerRings: rule?.noAnswerRings || 3,
      scheduleEnabled: !!rule?.schedule,
      scheduleTimezone: rule?.schedule?.timezone || 'Europe/Moscow',
      scheduleWorkingDays: rule?.schedule?.workingDays || [1, 2, 3, 4, 5],
      scheduleStartTime: rule?.schedule?.startTime || '09:00',
      scheduleEndTime: rule?.schedule?.endTime || '18:00',
      actionType: rule?.action.type || 'forward_ai_agent',
      actionTargetUserId: rule?.action.targetUserId || '',
      actionTargetNumber: rule?.action.targetNumber || '',
      actionAiProviderId: rule?.action.aiProviderId || '',
      actionAiAssistantId: rule?.action.aiAssistantId || '',
      actionAiPromptTemplate: rule?.action.aiPromptTemplate || '',
      actionVoicemailGreeting: rule?.action.voicemailGreeting || 'Оставьте сообщение после сигнала.',
      actionMessageText: rule?.action.messageText || '',
      actionRecordCall: rule?.action.recordCall ?? true,
      actionNotifyOwner: rule?.action.notifyOriginalOwner ?? true,
      actionCreateTask: rule?.action.createTask ?? false,
      actionTaskPriority: rule?.action.taskPriority || 'medium',
    },
  });

  const condition = watch('condition');
  const actionType = watch('actionType');
  const scheduleWorkingDays = watch('scheduleWorkingDays');

  const selectedCondition = CONDITION_OPTIONS.find(c => c.value === condition);
  const selectedAction = ACTION_OPTIONS.find(a => a.value === actionType);

  useEffect(() => {
    async function fetchData() {
      try {
        const [providersRes, usersRes] = await Promise.all([
          fetch('/api/providers/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: 'ai_agent', isActive: true }),
          }),
          fetch('/api/users/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: true }),
          }),
        ]);

        const providersData = await providersRes.json();
        const usersData = await usersRes.json();

        setProviders(providersData.providers || []);
        setUsers(usersData.users || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, []);

  const toggleWorkingDay = (day: number) => {
    const current = scheduleWorkingDays || [];
    if (current.includes(day)) {
      setValue('scheduleWorkingDays', current.filter(d => d !== day));
    } else {
      setValue('scheduleWorkingDays', [...current, day]);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Build schedule if needed
      let schedule: Schedule | undefined;
      if (selectedCondition?.requiresSchedule || data.scheduleEnabled) {
        schedule = {
          timezone: data.scheduleTimezone,
          workingDays: data.scheduleWorkingDays,
          startTime: data.scheduleStartTime,
          endTime: data.scheduleEndTime,
        };
      }

      // Build action
      const action: RuleAction = {
        type: data.actionType,
        recordCall: data.actionRecordCall,
        notifyOriginalOwner: data.actionNotifyOwner,
        createTask: data.actionCreateTask,
        taskPriority: data.actionTaskPriority as 'low' | 'medium' | 'high',
      };

      if (selectedAction?.requiresUser) {
        action.targetUserId = data.actionTargetUserId;
      }
      if (selectedAction?.requiresNumber) {
        action.targetNumber = data.actionTargetNumber;
      }
      if (selectedAction?.requiresAI) {
        action.aiProviderId = data.actionAiProviderId;
        action.aiAssistantId = data.actionAiAssistantId;
        action.aiPromptTemplate = data.actionAiPromptTemplate;
      }
      if (selectedAction?.requiresVoicemail) {
        action.voicemailGreeting = data.actionVoicemailGreeting;
      }
      if (selectedAction?.requiresMessage) {
        action.messageText = data.actionMessageText;
      }

      const url = isEditing ? `/api/routing-rules/${rule.id}` : '/api/routing-rules';
      const method = isEditing ? 'PATCH' : 'POST';

      const body = {
        phoneLineId,
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        condition: data.condition,
        noAnswerRings: data.condition === 'no_answer' ? data.noAnswerRings : undefined,
        schedule,
        action,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Ошибка сохранения');
      }

      onSuccess();
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Ошибка сохранения',
      });
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="routing-rule-form">
      {errors.root && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      {/* Основная информация */}
      <div className="space-y-4">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Основная информация</h3>

        <FormField label="Название правила" htmlFor="name" required error={errors.name?.message}>
          <Input
            id="name"
            {...register('name')}
            placeholder="Переадресация на AI ночью"
            error={errors.name?.message}
            data-testid="routing-rule-name-input"
          />
        </FormField>

        <FormField label="Описание" htmlFor="description">
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Подробное описание правила..."
            rows={2}
          />
        </FormField>
      </div>

      {/* Условие срабатывания */}
      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Когда применять</h3>

        <FormField label="Условие" htmlFor="condition" required>
          <Select
            id="condition"
            {...register('condition')}
            data-testid="routing-rule-condition-select"
          >
            {CONDITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.description}
              </option>
            ))}
          </Select>
        </FormField>

        {condition === 'no_answer' && (
          <FormField label="Количество гудков" htmlFor="noAnswerRings">
            <Select
              id="noAnswerRings"
              {...register('noAnswerRings', { valueAsNumber: true })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'гудок' : n < 5 ? 'гудка' : 'гудков'} (~{n * 5} сек)
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {selectedCondition?.requiresSchedule && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Расписание</span>
            </div>

            <FormField label="Рабочие дни">
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWorkingDay(day.value)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      scheduleWorkingDays.includes(day.value)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Начало" htmlFor="scheduleStartTime">
                <Input
                  id="scheduleStartTime"
                  type="time"
                  {...register('scheduleStartTime')}
                />
              </FormField>
              <FormField label="Конец" htmlFor="scheduleEndTime">
                <Input
                  id="scheduleEndTime"
                  type="time"
                  {...register('scheduleEndTime')}
                />
              </FormField>
            </div>

            <FormField label="Часовой пояс" htmlFor="scheduleTimezone">
              <Select id="scheduleTimezone" {...register('scheduleTimezone')}>
                <option value="Europe/Moscow">Москва (UTC+3)</option>
                <option value="Europe/Samara">Самара (UTC+4)</option>
                <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
                <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
                <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
              </Select>
            </FormField>
          </div>
        )}
      </div>

      {/* Действие */}
      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Что делать</h3>

        <FormField label="Действие" htmlFor="actionType" required>
          <div className="grid grid-cols-2 gap-2">
            {ACTION_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('actionType', opt.value)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors text-left ${
                    actionType === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                  data-testid={`routing-rule-action-${opt.value}`}
                >
                  <Icon className={`w-5 h-5 ${actionType === opt.value ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
                  <span className={`text-sm font-medium ${actionType === opt.value ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </FormField>

        {/* Action-specific fields */}
        {selectedAction?.requiresUser && (
          <FormField label="Менеджер" htmlFor="actionTargetUserId" required>
            <Select
              id="actionTargetUserId"
              {...register('actionTargetUserId')}
            >
              <option value="">Выберите менеджера...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {selectedAction?.requiresNumber && (
          <FormField
            label="Номер телефона"
            htmlFor="actionTargetNumber"
            required
            hint="Формат E.164: +79001234567"
          >
            <Input
              id="actionTargetNumber"
              {...register('actionTargetNumber')}
              placeholder="+79001234567"
              className="font-mono"
            />
          </FormField>
        )}

        {selectedAction?.requiresAI && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Настройки AI агента</span>
            </div>

            <FormField label="AI провайдер" htmlFor="actionAiProviderId" required>
              <Select
                id="actionAiProviderId"
                {...register('actionAiProviderId')}
              >
                <option value="">Выберите провайдера...</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} ({provider.type})
                  </option>
                ))}
              </Select>
              {providers.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Сначала добавьте AI провайдера в настройках
                </p>
              )}
            </FormField>

            <FormField
              label="ID ассистента"
              htmlFor="actionAiAssistantId"
              hint="Оставьте пустым для использования ассистента по умолчанию"
            >
              <Input
                id="actionAiAssistantId"
                {...register('actionAiAssistantId')}
                placeholder="asst_xxx..."
              />
            </FormField>

            <FormField
              label="Контекст для ассистента"
              htmlFor="actionAiPromptTemplate"
              hint="Дополнительные инструкции для AI"
            >
              <Textarea
                id="actionAiPromptTemplate"
                {...register('actionAiPromptTemplate')}
                placeholder="Это звонок в нерабочее время. Запиши контактные данные и передай менеджеру."
                rows={3}
              />
            </FormField>
          </div>
        )}

        {selectedAction?.requiresVoicemail && (
          <FormField label="Приветствие голосовой почты" htmlFor="actionVoicemailGreeting">
            <Textarea
              id="actionVoicemailGreeting"
              {...register('actionVoicemailGreeting')}
              placeholder="Здравствуйте! В данный момент мы не можем ответить на ваш звонок. Пожалуйста, оставьте сообщение после сигнала."
              rows={3}
            />
          </FormField>
        )}

        {selectedAction?.requiresMessage && (
          <FormField label="Текст сообщения (TTS)" htmlFor="actionMessageText">
            <Textarea
              id="actionMessageText"
              {...register('actionMessageText')}
              placeholder="Спасибо за звонок. Наш офис работает с 9:00 до 18:00 по московскому времени."
              rows={3}
            />
          </FormField>
        )}
      </div>

      {/* Дополнительные опции */}
      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Дополнительно</h3>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('actionRecordCall')}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Записывать звонок</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('actionNotifyOwner')}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Уведомить владельца линии</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('actionCreateTask')}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Создать задачу на перезвон</span>
          </label>

          {watch('actionCreateTask') && (
            <FormField label="Приоритет задачи" htmlFor="actionTaskPriority">
              <Select id="actionTaskPriority" {...register('actionTaskPriority')}>
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </Select>
            </FormField>
          )}
        </div>
      </div>

      {/* Активность */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('isActive')}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            data-testid="routing-rule-active-checkbox"
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Правило активно</span>
        </label>
      </div>

      {/* Кнопки */}
      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="submit" fullWidth isLoading={isSubmitting} data-testid="routing-rule-submit-button">
          {isEditing ? 'Сохранить' : 'Добавить правило'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
