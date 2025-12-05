'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Users, Briefcase, CheckSquare, GitBranch, MessageSquare, Book, Radio, FolderKanban, User, LucideIcon } from 'lucide-react';

interface MCPTool {
  name: string;
  description: string;
  enabled: boolean;
}

interface MCPInfo {
  name: string;
  version: string;
  description: string;
  endpoints: {
    sse: string;
    messages: string;
  };
  tools: Array<{ name: string; description: string }>;
  authentication: {
    type: string;
    description: string;
  };
  usage: {
    claudeDesktop: {
      description: string;
      config: object;
    };
  };
}

interface MCPToolsSettings {
  tools: MCPTool[];
  allEnabled: boolean;
  total: number;
  enabledCount: number;
}

// Tool grouping by entity
interface ToolGroup {
  id: string;
  name: string;
  icon: LucideIcon;
  tools: Array<{
    name: string;
    description: string;
    operation: 'create' | 'read' | 'update' | 'delete';
    enabled: boolean;
  }>;
}

// Map tool names to their entity group and operation type
const TOOL_ENTITY_MAP: Record<string, { entity: string; operation: 'create' | 'read' | 'update' | 'delete' }> = {
  // Контакты
  search_contacts: { entity: 'contacts', operation: 'read' },
  get_contact_details: { entity: 'contacts', operation: 'read' },
  create_contact: { entity: 'contacts', operation: 'create' },
  update_contact: { entity: 'contacts', operation: 'update' },
  delete_contact: { entity: 'contacts', operation: 'delete' },
  // Сделки
  search_opportunities: { entity: 'opportunities', operation: 'read' },
  get_opportunity_details: { entity: 'opportunities', operation: 'read' },
  get_opportunities_stats: { entity: 'opportunities', operation: 'read' },
  create_opportunity: { entity: 'opportunities', operation: 'create' },
  update_opportunity: { entity: 'opportunities', operation: 'update' },
  update_opportunity_stage: { entity: 'opportunities', operation: 'update' },
  delete_opportunity: { entity: 'opportunities', operation: 'delete' },
  archive_opportunity: { entity: 'opportunities', operation: 'update' },
  // Задачи
  get_tasks_overview: { entity: 'tasks', operation: 'read' },
  get_task_details: { entity: 'tasks', operation: 'read' },
  get_tasks_by_contact: { entity: 'tasks', operation: 'read' },
  get_tasks_by_project: { entity: 'tasks', operation: 'read' },
  create_task: { entity: 'tasks', operation: 'create' },
  update_task: { entity: 'tasks', operation: 'update' },
  update_task_status: { entity: 'tasks', operation: 'update' },
  delete_task: { entity: 'tasks', operation: 'delete' },
  // Взаимодействия
  search_interactions: { entity: 'interactions', operation: 'read' },
  get_interaction_details: { entity: 'interactions', operation: 'read' },
  get_interaction_stats: { entity: 'interactions', operation: 'read' },
  get_interactions_by_contact: { entity: 'interactions', operation: 'read' },
  create_interaction: { entity: 'interactions', operation: 'create' },
  update_interaction: { entity: 'interactions', operation: 'update' },
  delete_interaction: { entity: 'interactions', operation: 'delete' },
  // Воронки
  get_pipelines: { entity: 'pipelines', operation: 'read' },
  get_pipeline_stages: { entity: 'pipelines', operation: 'read' },
  get_pipeline_analytics: { entity: 'pipelines', operation: 'read' },
  get_default_pipeline: { entity: 'pipelines', operation: 'read' },
  get_pipeline_by_code: { entity: 'pipelines', operation: 'read' },
  get_initial_stage: { entity: 'pipelines', operation: 'read' },
  // Справочники
  get_dictionaries: { entity: 'dictionaries', operation: 'read' },
  get_dictionary_items: { entity: 'dictionaries', operation: 'read' },
  get_dictionary_item_by_code: { entity: 'dictionaries', operation: 'read' },
  // Каналы
  get_channels: { entity: 'channels', operation: 'read' },
  // Пользователи
  search_users: { entity: 'users', operation: 'read' },
  get_user_details: { entity: 'users', operation: 'read' },
  update_user: { entity: 'users', operation: 'update' },
  // Проекты
  search_projects: { entity: 'projects', operation: 'read' },
  get_project_details: { entity: 'projects', operation: 'read' },
  create_project: { entity: 'projects', operation: 'create' },
  update_project: { entity: 'projects', operation: 'update' },
  delete_project: { entity: 'projects', operation: 'delete' },
};

// Human-readable names for tools
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  // Контакты
  search_contacts: 'Поиск контактов',
  get_contact_details: 'Детали контакта',
  create_contact: 'Создать контакт',
  update_contact: 'Обновить контакт',
  delete_contact: 'Удалить контакт',
  // Сделки
  search_opportunities: 'Поиск сделок',
  get_opportunity_details: 'Детали сделки',
  get_opportunities_stats: 'Статистика сделок',
  create_opportunity: 'Создать сделку',
  update_opportunity: 'Обновить сделку',
  update_opportunity_stage: 'Изменить стадию',
  delete_opportunity: 'Удалить сделку',
  archive_opportunity: 'Архивировать сделку',
  // Задачи
  get_tasks_overview: 'Обзор задач',
  get_task_details: 'Детали задачи',
  get_tasks_by_contact: 'Задачи контакта',
  get_tasks_by_project: 'Задачи проекта',
  create_task: 'Создать задачу',
  update_task: 'Обновить задачу',
  update_task_status: 'Изменить статус',
  delete_task: 'Удалить задачу',
  // Взаимодействия
  search_interactions: 'Поиск взаимодействий',
  get_interaction_details: 'Детали взаимодействия',
  get_interaction_stats: 'Статистика взаимодействий',
  get_interactions_by_contact: 'Взаимодействия контакта',
  create_interaction: 'Создать взаимодействие',
  update_interaction: 'Обновить взаимодействие',
  delete_interaction: 'Удалить взаимодействие',
  // Воронки
  get_pipelines: 'Список воронок',
  get_pipeline_stages: 'Стадии воронки',
  get_pipeline_analytics: 'Аналитика воронки',
  get_default_pipeline: 'Воронка по умолчанию',
  get_pipeline_by_code: 'Воронка по коду',
  get_initial_stage: 'Начальная стадия',
  // Справочники
  get_dictionaries: 'Список справочников',
  get_dictionary_items: 'Элементы справочника',
  get_dictionary_item_by_code: 'Элемент по коду',
  // Каналы
  get_channels: 'Список каналов',
  // Пользователи
  search_users: 'Поиск пользователей',
  get_user_details: 'Детали пользователя',
  update_user: 'Обновить пользователя',
  // Проекты
  search_projects: 'Поиск проектов',
  get_project_details: 'Детали проекта',
  create_project: 'Создать проект',
  update_project: 'Обновить проект',
  delete_project: 'Удалить проект',
};

const ENTITY_CONFIG: Record<string, { name: string; icon: LucideIcon }> = {
  contacts: { name: 'Контакты', icon: Users },
  opportunities: { name: 'Сделки', icon: Briefcase },
  tasks: { name: 'Задачи', icon: CheckSquare },
  interactions: { name: 'Взаимодействия', icon: MessageSquare },
  pipelines: { name: 'Воронки', icon: GitBranch },
  dictionaries: { name: 'Справочники', icon: Book },
  channels: { name: 'Каналы', icon: Radio },
  users: { name: 'Пользователи', icon: User },
  projects: { name: 'Проекты', icon: FolderKanban },
};

const OPERATION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: 'Create', color: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' },
  read: { label: 'Read', color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' },
  update: { label: 'Update', color: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' },
  delete: { label: 'Delete', color: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' },
};

export function MCPServerInfo() {
  const [isLoading, setIsLoading] = useState(true);
  const [mcpData, setMcpData] = useState<MCPInfo | null>(null);
  const [toolsSettings, setToolsSettings] = useState<MCPToolsSettings | null>(null);
  const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [allEnabled, setAllEnabled] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Load MCP info and tools settings in parallel
        const [mcpResponse, toolsResponse] = await Promise.all([
          fetch('/api/mcp'),
          fetch('/api/system-settings/mcp/tools'),
        ]);

        if (mcpResponse.ok) {
          const mcpResult: MCPInfo = await mcpResponse.json();
          setMcpData(mcpResult);
        } else {
          throw new Error('MCP сервер недоступен');
        }

        if (toolsResponse.ok) {
          const toolsResult: MCPToolsSettings = await toolsResponse.json();
          setToolsSettings(toolsResult);
          setAllEnabled(toolsResult.allEnabled);

          // Initialize enabled tools set
          const enabled = new Set(
            toolsResult.tools.filter((t) => t.enabled).map((t) => t.name)
          );
          setEnabledTools(enabled);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Не удалось загрузить данные');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleToggleTool = (toolName: string) => {
    const newEnabled = new Set(enabledTools);
    if (newEnabled.has(toolName)) {
      newEnabled.delete(toolName);
    } else {
      newEnabled.add(toolName);
    }
    setEnabledTools(newEnabled);
    setAllEnabled(false);
  };

  const handleEnableAll = () => {
    if (!toolsSettings) return;
    const allTools = toolsSettings.tools.map((t) => t.name);
    setEnabledTools(new Set(allTools));
    setAllEnabled(true);
  };

  const handleDisableAll = () => {
    setEnabledTools(new Set());
    setAllEnabled(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSavedMessage('');

    try {
      // If all tools are enabled, send null to clear the setting
      const enabledArray = allEnabled ? null : Array.from(enabledTools);

      const response = await fetch('/api/system-settings/mcp/tools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: enabledArray }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Ошибка сохранения');
      }

      const result: MCPToolsSettings = await response.json();
      setToolsSettings(result);
      setAllEnabled(result.allEnabled);

      setSavedMessage('Настройки сохранены');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsSaving(false);
    }
  };

  // Group tools by entity from toolsSettings
  const getToolGroups = (): ToolGroup[] => {
    if (!toolsSettings?.tools) return [];

    const groups: Record<string, ToolGroup> = {};

    // Initialize groups
    for (const [entityId, config] of Object.entries(ENTITY_CONFIG)) {
      groups[entityId] = {
        id: entityId,
        name: config.name,
        icon: config.icon,
        tools: [],
      };
    }

    // Distribute tools to groups
    for (const tool of toolsSettings.tools) {
      const mapping = TOOL_ENTITY_MAP[tool.name];
      if (mapping && groups[mapping.entity]) {
        groups[mapping.entity].tools.push({
          name: tool.name,
          description: tool.description,
          operation: mapping.operation,
          enabled: enabledTools.has(tool.name),
        });
      } else {
        // If tool is not mapped, log for debugging
        console.warn(`Unmapped MCP tool: ${tool.name}`);
      }
    }

    // Return only groups with tools, sorted by number of tools
    return Object.values(groups)
      .filter((g) => g.tools.length > 0)
      .sort((a, b) => b.tools.length - a.tools.length);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-zinc-500 dark:text-zinc-400">Загрузка...</div>
      </div>
    );
  }

  if (!mcpData) {
    return (
      <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
        {error || 'Не удалось загрузить информацию о MCP сервере'}
      </div>
    );
  }

  const claudeDesktopConfig = JSON.stringify(mcpData.usage.claudeDesktop.config, null, 2);
  const totalCount = toolsSettings?.total || 0;
  const enabledCount = allEnabled ? totalCount : enabledTools.size;
  const toolGroups = getToolGroups();

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
      )}

      {savedMessage && (
        <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg">
          {savedMessage}
        </div>
      )}

      {/* Server Status */}
      <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
          <svg
            className="h-6 w-6 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-green-900 dark:text-green-100">
            MCP сервер активен
          </h3>
          <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
            {mcpData.name} v{mcpData.version}
          </p>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Эндпоинты</h3>
        <div className="space-y-3">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                SSE (Server-Sent Events)
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(mcpData.endpoints.sse, 'sse')}
                className="text-xs h-6"
              >
                {copied === 'sse' ? 'Скопировано' : 'Копировать'}
              </Button>
            </div>
            <code className="text-xs text-zinc-900 dark:text-zinc-100 break-all">
              {mcpData.endpoints.sse}
            </code>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Messages
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(mcpData.endpoints.messages, 'messages')}
                className="text-xs h-6"
              >
                {copied === 'messages' ? 'Скопировано' : 'Копировать'}
              </Button>
            </div>
            <code className="text-xs text-zinc-900 dark:text-zinc-100 break-all">
              {mcpData.endpoints.messages}
            </code>
          </div>
        </div>
      </div>

      {/* Tools Management */}
      {toolsSettings && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Инструменты
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {enabledCount} из {totalCount} активно
            </span>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Выберите инструменты, доступные внешним MCP клиентам (Claude Desktop, Cursor и др.)
          </p>

          {/* Quick actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleEnableAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Включить все
            </button>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <button
              type="button"
              onClick={handleDisableAll}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Выключить все
            </button>
          </div>

          {/* Unified tools table */}
          <div className="w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700/50">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-100/50 dark:bg-zinc-800/30">
                  <th className="w-10 px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400"></th>
                  <th className="w-48 px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Название</th>
                  <th className="w-16 px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">CRUD</th>
                  <th className="w-52 px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Код</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Описание</th>
                </tr>
              </thead>
              <tbody>
                {toolGroups.map((group) => {
                  const Icon = group.icon;
                  const enabledInGroup = group.tools.filter((t) => t.enabled).length;
                  return (
                    <>
                      {/* Group header row */}
                      <tr key={`group-${group.id}`} className="bg-zinc-200/50 dark:bg-zinc-700/50">
                        <td colSpan={5} className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                            <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">
                              {group.name}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              ({enabledInGroup}/{group.tools.length})
                            </span>
                          </div>
                        </td>
                      </tr>
                      {/* Tool rows */}
                      {group.tools.map((tool) => {
                        const operationConfig = OPERATION_LABELS[tool.operation];
                        const displayName = TOOL_DISPLAY_NAMES[tool.name] || tool.name;
                        return (
                          <tr
                            key={tool.name}
                            className="cursor-pointer transition-colors border-t border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                            onClick={() => handleToggleTool(tool.name)}
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={tool.enabled}
                                onChange={() => handleToggleTool(tool.name)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                              {displayName}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${operationConfig.color}`}>
                                {operationConfig.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 hidden sm:table-cell">
                              <code className="text-[11px] text-zinc-600 dark:text-zinc-300 font-mono">
                                {tool.name}
                              </code>
                            </td>
                            <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400 hidden md:table-cell">
                              {tool.description}
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <Button onClick={handleSave} isLoading={isSaving}>
              Сохранить
            </Button>
          </div>
        </div>
      )}

      {/* Claude Desktop Config */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Конфигурация для Claude Desktop
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(claudeDesktopConfig, 'config')}
            className="text-xs"
          >
            {copied === 'config' ? 'Скопировано' : 'Копировать'}
          </Button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Добавьте этот блок в{' '}
          <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
            claude_desktop_config.json
          </code>
        </p>
        <pre className="text-xs bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
          {claudeDesktopConfig}
        </pre>
      </div>

      {/* API Token Info */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
          Аутентификация
        </h4>
        <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
          Для подключения к MCP серверу необходим API токен. Создайте токен в настройках API и
          используйте его в конфигурации.
        </p>
        <Link href="/settings/api">
          <Button size="sm" variant="secondary">
            Управление API токенами
          </Button>
        </Link>
      </div>

      {/* Supported Clients */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Поддерживаемые клиенты
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Claude Desktop</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Официальное desktop-приложение от Anthropic
            </p>
          </div>
          <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Cursor</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              AI-powered редактор кода
            </p>
          </div>
          <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Continue.dev</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Расширение для VS Code</p>
          </div>
          <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Другие MCP клиенты
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Любые клиенты, поддерживающие MCP протокол
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
