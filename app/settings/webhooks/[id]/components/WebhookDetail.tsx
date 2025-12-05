'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Play,
  Save,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';

const webhookFormSchema = z.object({
  name: z.string().min(1, 'Введите название').max(100, 'Максимум 100 символов'),
  url: z.string().url('Введите корректный URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
  events: z.array(z.string()).min(1, 'Выберите хотя бы одно событие'),
  isActive: z.boolean(),
});

type WebhookFormData = z.infer<typeof webhookFormSchema>;

interface WebhookHeader {
  key: string;
  value: string;
}

interface WebhookData {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: WebhookHeader[];
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody: object | null;
  responseStatus: number | null;
  responseBody: string | null;
  error: string | null;
  duration: number;
  success: boolean;
  createdAt: string;
}

interface EventGroup {
  entity: string;
  entityLabel: string;
  items: { event: string; label: string }[];
}

interface TestResult {
  success: boolean;
  responseStatus: number | null;
  responseBody: string | null;
  error: string | null;
  duration: number;
}

interface WebhookDetailProps {
  webhookId: string;
}

export function WebhookDetail({ webhookId }: WebhookDetailProps) {
  const router = useRouter();
  const [webhook, setWebhook] = useState<WebhookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<EventGroup[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true);

  // Logs state
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      name: '',
      url: '',
      method: 'POST',
      headers: [],
      events: [],
      isActive: true,
    },
  });

  const {
    fields: headerFields,
    append: appendHeader,
    remove: removeHeader,
  } = useFieldArray({
    control,
    name: 'headers',
  });

  const selectedEvents = watch('events');
  const isActive = watch('isActive');

  const fetchWebhook = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/webhooks/${webhookId}`);
      if (!response.ok) {
        throw new Error('Webhook not found');
      }
      const data = await response.json();
      setWebhook(data);
      reset({
        name: data.name,
        url: data.url,
        method: data.method,
        headers: data.headers?.filter((h: WebhookHeader) => h.key) || [],
        events: data.events || [],
        isActive: data.isActive,
      });
    } catch (error) {
      console.error('Error fetching webhook:', error);
      router.push('/settings/webhooks');
    } finally {
      setIsLoading(false);
    }
  }, [webhookId, reset, router]);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/webhooks/events');
      const data = await response.json();
      setAvailableEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: logsPage, limit: 50 }),
      });
      const data = await response.json();
      setLogs(data.logs || []);
      setLogsTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [webhookId, logsPage]);

  useEffect(() => {
    fetchWebhook();
    fetchEvents();
  }, [fetchWebhook, fetchEvents]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleEvent = (event: string) => {
    const currentEvents = selectedEvents || [];
    if (currentEvents.includes(event)) {
      setValue('events', currentEvents.filter((e) => e !== event), { shouldDirty: true });
    } else {
      setValue('events', [...currentEvents, event], { shouldDirty: true });
    }
  };

  const toggleEntityEvents = (entity: string, entityEvents: { event: string }[]) => {
    const currentEvents = selectedEvents || [];
    const entityEventIds = entityEvents.map((e) => e.event);
    const allSelected = entityEventIds.every((e) => currentEvents.includes(e));

    if (allSelected) {
      setValue('events', currentEvents.filter((e) => !entityEventIds.includes(e)), { shouldDirty: true });
    } else {
      const newEvents = [...new Set([...currentEvents, ...entityEventIds])];
      setValue('events', newEvents, { shouldDirty: true });
    }
  };

  const onSubmit = async (data: WebhookFormData) => {
    setIsSaving(true);
    try {
      const filteredHeaders = data.headers.filter((h) => h.key.trim() !== '');

      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          url: data.url.trim(),
          method: data.method,
          headers: filteredHeaders,
          events: data.events,
          isActive: data.isActive,
        }),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Ошибка сохранения');
      }

      const updatedWebhook = await response.json();
      setWebhook(updatedWebhook);
      reset({
        name: updatedWebhook.name,
        url: updatedWebhook.url,
        method: updatedWebhook.method,
        headers: updatedWebhook.headers?.filter((h: WebhookHeader) => h.key) || [],
        events: updatedWebhook.events || [],
        isActive: updatedWebhook.isActive,
      });
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Произошла ошибка',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/webhooks/${webhookId}`, { method: 'DELETE' });
      router.push('/settings/webhooks');
    } catch (error) {
      console.error('Error deleting webhook:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST',
      });
      const result = await response.json();
      setTestResult(result);
      fetchLogs();
    } catch (error) {
      console.error('Error testing webhook:', error);
      setTestResult({
        success: false,
        responseStatus: null,
        responseBody: null,
        error: 'Ошибка выполнения теста',
        duration: 0,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleActive = async () => {
    const newValue = !isActive;
    setValue('isActive', newValue, { shouldDirty: true });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLogDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatFullDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'POST':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PUT':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'PATCH':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'DELETE':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const getStatusColor = (status: number | null) => {
    if (!status) return 'text-zinc-500';
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400';
    if (status >= 400 && status < 500) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusBgColor = (status: number | null) => {
    if (!status) return 'bg-zinc-100 dark:bg-zinc-800';
    if (status >= 200 && status < 300) return 'bg-green-100 dark:bg-green-900/30';
    if (status >= 400 && status < 500) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const highlightJson = (json: string) => {
    return json
      .replace(/(".*?")\s*:/g, '<span class="text-purple-600 dark:text-purple-400">$1</span>:')
      .replace(/:\s*(".*?")/g, ': <span class="text-green-600 dark:text-green-400">$1</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-blue-600 dark:text-blue-400">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="text-amber-600 dark:text-amber-400">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="text-zinc-400">$1</span>');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  if (!webhook) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/settings/webhooks')}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {webhook.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-1.5 py-0.5 text-xs font-medium rounded ${getMethodBadgeColor(webhook.method)}`}
              >
                {webhook.method}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Создан {formatDateTime(webhook.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleActive}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                : 'text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800'
            }`}
          >
            {isActive ? (
              <>
                <ToggleRight className="w-5 h-5" />
                Активен
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                Неактивен
              </>
            )}
          </button>
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isTesting ? (
              <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Тест
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={`p-3 rounded-lg mb-4 ${
            testResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  testResult.success ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  testResult.success
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {testResult.success ? 'Успешно' : 'Ошибка'}
              </span>
              {testResult.responseStatus && (
                <span className="text-xs text-zinc-500">{testResult.responseStatus}</span>
              )}
              <span className="text-xs text-zinc-400">{testResult.duration}ms</span>
              {testResult.error && (
                <span className="text-xs text-red-600 dark:text-red-400">{testResult.error}</span>
              )}
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Three Column Layout: Settings (left, collapsible) + Logs List (middle) + Log Details (right) */}
      <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Settings Panel - Collapsible */}
        <div
          className={`border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col transition-all duration-300 shrink-0 ${
            isSettingsExpanded ? 'w-72' : 'w-12'
          }`}
        >
          <button
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            {isSettingsExpanded ? (
              <>
                <ChevronDown className="w-4 h-4 text-zinc-400 rotate-90" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Настройки</span>
              </>
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 -rotate-90" />
            )}
          </button>

          {isSettingsExpanded && (
            <div className="flex-1 overflow-y-auto p-3">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                {errors.root && (
                  <div className="p-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">
                    {errors.root.message}
                  </div>
                )}

                <FormField label="Название" htmlFor="name" required error={errors.name?.message}>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Название вебхука"
                    error={errors.name?.message}
                    className="text-sm"
                  />
                </FormField>

                <FormField label="URL" htmlFor="url" required error={errors.url?.message}>
                  <Input
                    id="url"
                    type="url"
                    {...register('url')}
                    placeholder="https://..."
                    error={errors.url?.message}
                    className="text-sm"
                  />
                </FormField>

                <FormField label="Метод" htmlFor="method" required>
                  <select
                    id="method"
                    {...register('method')}
                    className="w-full px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </FormField>

                {/* Headers */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Заголовки
                    </label>
                    <button
                      type="button"
                      onClick={() => appendHeader({ key: '', value: '' })}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {headerFields.length === 0 ? (
                    <p className="text-xs text-zinc-400">Нет заголовков</p>
                  ) : (
                    <div className="space-y-1.5">
                      {headerFields.map((field, index) => (
                        <div key={field.id} className="flex gap-1">
                          <Input
                            {...register(`headers.${index}.key`)}
                            placeholder="Key"
                            className="flex-1 text-xs"
                          />
                          <Input
                            {...register(`headers.${index}.value`)}
                            placeholder="Value"
                            className="flex-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeHeader(index)}
                            className="p-1 text-zinc-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Events */}
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                    События <span className="text-red-500">*</span>
                  </label>
                  {errors.events && (
                    <p className="text-xs text-red-600 dark:text-red-400 mb-1">
                      {errors.events.message}
                    </p>
                  )}
                  {isLoadingEvents ? (
                    <div className="flex items-center justify-center py-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded p-2">
                      {availableEvents.map((group) => {
                        const groupEventIds = group.items.map((e) => e.event);
                        const selectedCount = groupEventIds.filter((e) =>
                          selectedEvents?.includes(e)
                        ).length;
                        const allSelected = selectedCount === groupEventIds.length;
                        const someSelected = selectedCount > 0 && selectedCount < groupEventIds.length;

                        return (
                          <div key={group.entity}>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => {
                                  if (el) el.indeterminate = someSelected;
                                }}
                                onChange={() => toggleEntityEvents(group.entity, group.items)}
                                className="w-3 h-3 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                                {group.entityLabel}
                              </span>
                              <span className="text-xs text-zinc-400">
                                {selectedCount}/{groupEventIds.length}
                              </span>
                            </label>
                            <div className="ml-4 mt-1 space-y-0.5">
                              {group.items.map((item) => (
                                <label
                                  key={item.event}
                                  className="flex items-center gap-1.5 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedEvents?.includes(item.event) || false}
                                    onChange={() => toggleEvent(item.event)}
                                    className="w-3 h-3 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{item.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSaving || !isDirty}
                  className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed rounded transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Сохранить
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Logs List Panel */}
        <div className="w-72 shrink-0 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              История
            </h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {logsTotal}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Логи не найдены</p>
              </div>
            ) : (
              <div>
                {logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`px-3 py-2 cursor-pointer transition-colors border-b border-zinc-200 dark:border-zinc-800 ${
                      selectedLog?.id === log.id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          log.success ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <code className="text-xs font-medium text-zinc-900 dark:text-zinc-50 truncate">
                        {log.event}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 pl-4">
                      <span>{formatLogDateTime(log.createdAt)}</span>
                      <span>•</span>
                      {log.responseStatus ? (
                        <span className={getStatusColor(log.responseStatus)}>
                          {log.responseStatus}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                      <span>•</span>
                      <span>{log.duration}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {logsTotal > 50 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <button
                onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                disabled={logsPage === 1}
                className="px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {logsPage}/{Math.ceil(logsTotal / 50)}
              </span>
              <button
                onClick={() => setLogsPage((p) => p + 1)}
                disabled={logsPage * 50 >= logsTotal}
                className="px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* Log Details Panel */}
        <div className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col min-w-0">
          {selectedLog ? (
            <>
            {/* Detail Header */}
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      selectedLog.success ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <code className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                    {selectedLog.event}
                  </code>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 shrink-0 ml-2"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                {selectedLog.responseStatus && (
                  <span className={`font-medium ${getStatusColor(selectedLog.responseStatus)}`}>
                    HTTP {selectedLog.responseStatus}
                  </span>
                )}
                <span>{selectedLog.duration}ms</span>
                <span>{formatFullDateTime(selectedLog.createdAt)}</span>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Error */}
              {selectedLog.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                    Ошибка
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">{selectedLog.error}</p>
                </div>
              )}

              {/* Request */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 mb-2 uppercase tracking-wider">
                  Запрос
                </h3>
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded shrink-0 ${getMethodBadgeColor(selectedLog.method)}`}>
                      {selectedLog.method}
                    </span>
                    <code className="text-xs text-zinc-600 dark:text-zinc-400 break-all">
                      {selectedLog.url}
                    </code>
                  </div>
                </div>

                {Object.keys(selectedLog.requestHeaders).length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-zinc-500 mb-1">Заголовки</p>
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                      <div className="text-xs space-y-0.5 font-mono">
                        {Object.entries(selectedLog.requestHeaders).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-zinc-400">{key}:</span>{' '}
                            <span className="text-zinc-700 dark:text-zinc-300">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedLog.requestBody && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Тело</p>
                    <pre
                      className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{
                        __html: highlightJson(JSON.stringify(selectedLog.requestBody, null, 2))
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Response */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 mb-2 uppercase tracking-wider">
                  Ответ
                </h3>
                {selectedLog.responseBody ? (
                  <pre
                    className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        try {
                          const parsed = JSON.parse(selectedLog.responseBody);
                          return highlightJson(JSON.stringify(parsed, null, 2));
                        } catch {
                          return selectedLog.responseBody;
                        }
                      })()
                    }}
                  />
                ) : (
                  <p className="text-xs text-zinc-400 italic">Нет тела ответа</p>
                )}
              </div>
            </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-zinc-400 dark:text-zinc-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Выберите запрос из списка</p>
                <p className="text-xs mt-1">для просмотра деталей</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Удалить вебхук?"
        message={`Вы уверены, что хотите удалить вебхук "${webhook.name}"? Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}
