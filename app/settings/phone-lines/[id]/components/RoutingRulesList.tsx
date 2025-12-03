'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, Power, PowerOff, GripVertical, Bot, Phone, PhoneForwarded, VoicemailIcon, Clock, User } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { RoutingRuleForm } from './RoutingRuleForm';

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
  voicemailGreeting?: string;
  messageText?: string;
  recordCall?: boolean;
  createTask?: boolean;
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
  triggeredCount: number;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

interface RoutingRulesListProps {
  phoneLineId: string;
}

const CONDITION_LABELS: Record<string, string> = {
  always: 'Всегда',
  working_hours: 'Рабочее время',
  after_hours: 'Нерабочее время',
  no_answer: 'Нет ответа',
  busy: 'Занято',
  offline: 'Не в сети',
  schedule: 'По расписанию',
  vip_caller: 'VIP клиент',
  new_caller: 'Новый звонящий',
};

const ACTION_LABELS: Record<string, string> = {
  forward_manager: 'Менеджер',
  forward_number: 'Номер',
  forward_ai_agent: 'AI агент',
  voicemail: 'Голосовая почта',
  ivr: 'IVR',
  queue: 'Очередь',
  play_message: 'Сообщение',
  hangup: 'Завершить',
};

const ACTION_ICONS: Record<string, typeof Phone> = {
  forward_manager: User,
  forward_number: PhoneForwarded,
  forward_ai_agent: Bot,
  voicemail: VoicemailIcon,
  ivr: Phone,
  queue: Clock,
  play_message: Phone,
  hangup: Phone,
};

export function RoutingRulesList({ phoneLineId }: RoutingRulesListProps) {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<RoutingRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      const response = await fetch('/api/routing-rules/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneLineId, includeInactive: true }),
      });
      const data = await response.json();
      setRules(data.rules || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setIsLoading(false);
    }
  }, [phoneLineId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchRules();
  };

  const handleEditSuccess = () => {
    setEditingRule(null);
    fetchRules();
  };

  const handleDelete = async () => {
    if (!deletingRule) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/routing-rules/${deletingRule.id}`, { method: 'DELETE' });
      setDeletingRule(null);
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (rule: RoutingRule) => {
    try {
      await fetch(`/api/routing-rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const handleDragStart = (ruleId: string) => {
    setDraggedItem(ruleId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const newRules = [...rules];
    const draggedIndex = newRules.findIndex(r => r.id === draggedItem);
    const targetIndex = newRules.findIndex(r => r.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedRule] = newRules.splice(draggedIndex, 1);
      newRules.splice(targetIndex, 0, draggedRule);
      setRules(newRules);
    }
  };

  const handleDragEnd = async () => {
    if (!draggedItem) return;

    // Save new order
    const ruleIds = rules.map(r => r.id);
    try {
      await fetch('/api/routing-rules/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneLineId, ruleIds }),
      });
    } catch (error) {
      console.error('Error reordering rules:', error);
      fetchRules(); // Revert on error
    }

    setDraggedItem(null);
  };

  const formatSchedule = (schedule?: Schedule) => {
    if (!schedule) return '';
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const workDays = schedule.workingDays.map(d => days[d]).join(', ');
    return `${workDays} ${schedule.startTime}-${schedule.endTime}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
          data-testid="add-routing-rule-button"
        >
          <Plus className="w-5 h-5" />
          Добавить правило
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900">
          <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Правила маршрутизации не настроены</p>
          <p className="text-sm mt-1">Входящие звонки будут переадресованы на владельца линии</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 underline"
          >
            Добавить первое правило
          </button>
        </div>
      ) : (
        <div className="space-y-2" data-testid="routing-rules-list">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            Правила применяются сверху вниз. Перетащите для изменения порядка.
          </div>
          {rules.map((rule, index) => {
            const ActionIcon = ACTION_ICONS[rule.action.type] || Phone;
            return (
              <div
                key={rule.id}
                draggable
                onDragStart={() => handleDragStart(rule.id)}
                onDragOver={(e) => handleDragOver(e, rule.id)}
                onDragEnd={handleDragEnd}
                className={`border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-900 cursor-move transition-all ${
                  !rule.isActive ? 'opacity-50' : ''
                } ${draggedItem === rule.id ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                data-testid={`routing-rule-card-${rule.id}`}
              >
                <div className="flex items-start gap-3">
                  {/* Drag handle */}
                  <div className="flex-shrink-0 mt-1 text-zinc-400 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Priority badge */}
                  <div className="flex-shrink-0 w-6 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {index + 1}
                  </div>

                  {/* Action icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    rule.action.type === 'forward_ai_agent'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                    <ActionIcon className="w-5 h-5" />
                  </div>

                  {/* Rule info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {rule.name}
                      </span>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {rule.description}
                      </p>
                    )}

                    {/* Condition and action info */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                        Если: {CONDITION_LABELS[rule.condition] || rule.condition}
                        {rule.condition === 'no_answer' && rule.noAnswerRings && ` (${rule.noAnswerRings} гудк.)`}
                      </span>
                      <span className="text-zinc-400">→</span>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                        {ACTION_LABELS[rule.action.type] || rule.action.type}
                        {rule.action.targetNumber && `: ${rule.action.targetNumber}`}
                      </span>

                      {rule.schedule && (
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatSchedule(rule.schedule)}
                        </span>
                      )}

                      {rule.action.recordCall && (
                        <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs">
                          Запись
                        </span>
                      )}

                      {rule.action.createTask && (
                        <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs">
                          Задача
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>Сработало: {rule.triggeredCount} раз</span>
                      {rule.lastTriggered && (
                        <span>
                          Последний: {new Date(rule.lastTriggered).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(rule)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        rule.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                      data-testid={`routing-rule-toggle-${rule.id}`}
                    >
                      {rule.isActive ? (
                        <>
                          <Power className="w-3 h-3" />
                          Вкл
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-3 h-3" />
                          Выкл
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                      title="Редактировать"
                      data-testid={`routing-rule-edit-${rule.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingRule(rule)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                      title="Удалить"
                      data-testid={`routing-rule-delete-${rule.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Создание правила */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Добавить правило маршрутизации"
        size="lg"
      >
        <RoutingRuleForm
          phoneLineId={phoneLineId}
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateOpen(false)}
        />
      </SlideOver>

      {/* Редактирование правила */}
      <SlideOver
        isOpen={!!editingRule}
        onClose={() => setEditingRule(null)}
        title="Редактировать правило"
        size="lg"
      >
        {editingRule && (
          <RoutingRuleForm
            phoneLineId={phoneLineId}
            rule={editingRule}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingRule(null)}
          />
        )}
      </SlideOver>

      {/* Подтверждение удаления */}
      <ConfirmDialog
        isOpen={!!deletingRule}
        title="Удалить правило?"
        message={`Вы уверены, что хотите удалить правило "${deletingRule?.name}"? Это может повлиять на обработку звонков.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeletingRule(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
