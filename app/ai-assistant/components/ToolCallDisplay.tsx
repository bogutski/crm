'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Check, AlertCircle, Wrench } from 'lucide-react';

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: unknown;
  error?: string;
}

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
}

// Маппинг названий инструментов на понятные описания
const TOOL_DISPLAY_NAMES: Record<string, { name: string; icon: string }> = {
  // Контакты
  search_contacts: { name: 'Поиск контактов', icon: '🔍' },
  get_contact_details: { name: 'Информация о контакте', icon: '👤' },
  create_contact: { name: 'Создание контакта', icon: '➕' },
  update_contact: { name: 'Обновление контакта', icon: '✏️' },
  delete_contact: { name: 'Удаление контакта', icon: '🗑️' },
  get_contact_tasks: { name: 'Задачи контакта', icon: '📋' },

  // Сделки
  search_opportunities: { name: 'Поиск сделок', icon: '🔍' },
  get_opportunity_details: { name: 'Информация о сделке', icon: '💼' },
  get_opportunities_stats: { name: 'Статистика сделок', icon: '📊' },
  create_opportunity: { name: 'Создание сделки', icon: '➕' },
  update_opportunity: { name: 'Обновление сделки', icon: '✏️' },
  update_opportunity_stage: { name: 'Перемещение по воронке', icon: '➡️' },
  archive_opportunity: { name: 'Архивация сделки', icon: '📦' },
  delete_opportunity: { name: 'Удаление сделки', icon: '🗑️' },

  // Задачи
  get_tasks_overview: { name: 'Обзор задач', icon: '📋' },
  get_task_details: { name: 'Информация о задаче', icon: '✅' },
  create_task: { name: 'Создание задачи', icon: '➕' },
  update_task: { name: 'Обновление задачи', icon: '✏️' },
  update_task_status: { name: 'Изменение статуса задачи', icon: '🔄' },
  delete_task: { name: 'Удаление задачи', icon: '🗑️' },
  get_tasks_by_contact: { name: 'Задачи контакта', icon: '📋' },
  get_tasks_by_project: { name: 'Задачи проекта', icon: '📋' },

  // Взаимодействия
  search_interactions: { name: 'Поиск взаимодействий', icon: '🔍' },
  get_interaction_details: { name: 'Информация о взаимодействии', icon: '📞' },
  get_interactions_by_contact: { name: 'Взаимодействия с контактом', icon: '📞' },
  get_interaction_stats: { name: 'Статистика взаимодействий', icon: '📊' },
  create_interaction: { name: 'Запись взаимодействия', icon: '➕' },
  update_interaction: { name: 'Обновление взаимодействия', icon: '✏️' },
  delete_interaction: { name: 'Удаление взаимодействия', icon: '🗑️' },

  // Воронки
  get_pipelines: { name: 'Список воронок', icon: '📊' },
  get_pipeline_stages: { name: 'Стадии воронки', icon: '📊' },
  get_pipeline_analytics: { name: 'Аналитика воронки', icon: '📈' },
  get_default_pipeline: { name: 'Воронка по умолчанию', icon: '📊' },
  get_pipeline_by_code: { name: 'Воронка по коду', icon: '📊' },
  get_initial_stage: { name: 'Начальная стадия', icon: '🏁' },

  // Проекты
  search_projects: { name: 'Поиск проектов', icon: '🔍' },
  get_project_details: { name: 'Информация о проекте', icon: '📁' },
  create_project: { name: 'Создание проекта', icon: '➕' },
  update_project: { name: 'Обновление проекта', icon: '✏️' },
  delete_project: { name: 'Удаление проекта', icon: '🗑️' },

  // Пользователи
  search_users: { name: 'Поиск пользователей', icon: '🔍' },
  get_user_details: { name: 'Информация о пользователе', icon: '👥' },

  // Справочники
  get_dictionaries: { name: 'Список справочников', icon: '📚' },
  get_dictionary_items: { name: 'Элементы справочника', icon: '📚' },
  get_dictionary_item_by_code: { name: 'Элемент по коду', icon: '📚' },
  get_channels: { name: 'Каналы коммуникации', icon: '📱' },
};

function getToolDisplayInfo(toolName: string) {
  return TOOL_DISPLAY_NAMES[toolName] || { name: toolName, icon: '🔧' };
}

function formatArguments(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return '';

  return entries
    .map(([key, value]) => {
      if (typeof value === 'string') return `${key}: "${value}"`;
      if (typeof value === 'object') return `${key}: ${JSON.stringify(value)}`;
      return `${key}: ${value}`;
    })
    .join(', ');
}

function ToolCallItem({ toolCall }: { toolCall: ToolCall }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayInfo = getToolDisplayInfo(toolCall.name);

  const statusIcon = () => {
    switch (toolCall.status) {
      case 'running':
        return <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />;
      case 'completed':
        return <Check className="w-3.5 h-3.5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const hasDetails = (toolCall.arguments && Object.keys(toolCall.arguments).length > 0) || toolCall.result || toolCall.error;

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-800/50">
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${
          hasDetails ? 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50 cursor-pointer' : 'cursor-default'
        }`}
      >
        {hasDetails && (
          isExpanded
            ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            : <ChevronRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
        )}
        {!hasDetails && <div className="w-3.5" />}

        <span className="flex-shrink-0">{displayInfo.icon}</span>
        <span className="font-medium text-zinc-700 dark:text-zinc-300 flex-1">
          {displayInfo.name}
        </span>
        {statusIcon()}
      </button>

      {isExpanded && hasDetails && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs space-y-2 bg-zinc-50 dark:bg-zinc-900/50">
          {toolCall.arguments && Object.keys(toolCall.arguments).length > 0 && (
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Параметры: </span>
              <span className="text-zinc-700 dark:text-zinc-300 font-mono">
                {formatArguments(toolCall.arguments)}
              </span>
            </div>
          )}

          {toolCall.error && (
            <div className="text-red-600 dark:text-red-400">
              <span className="font-medium">Ошибка: </span>
              {toolCall.error}
            </div>
          )}

          {toolCall.result !== undefined && toolCall.result !== null && (
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Результат: </span>
              <pre className="mt-1 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-700 dark:text-zinc-300 overflow-x-auto max-h-40 overflow-y-auto">
                {typeof toolCall.result === 'string'
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="space-y-2 mb-2">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <Wrench className="w-3 h-3" />
        <span>Использованные инструменты</span>
      </div>
      <div className="space-y-1.5">
        {toolCalls.map((toolCall) => (
          <ToolCallItem key={toolCall.id} toolCall={toolCall} />
        ))}
      </div>
    </div>
  );
}
