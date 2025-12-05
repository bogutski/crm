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
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

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
          className={`p-4 rounded-lg mb-6 ${
            testResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`font-medium ${
                  testResult.success
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {testResult.success ? 'Тест успешен' : 'Тест не прошёл'}
              </span>
              {testResult.responseStatus && (
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  HTTP {testResult.responseStatus}
                </span>
              )}
              <span className="text-sm text-zinc-500">{testResult.duration}ms</span>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Скрыть
            </button>
          </div>
          {testResult.error && (
            <p className="text-sm text-red-600 dark:text-red-400">{testResult.error}</p>
          )}
          {testResult.responseBody && (
            <pre className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded text-xs overflow-auto max-h-32">
              {testResult.responseBody}
            </pre>
          )}
        </div>
      )}

      {/* Settings Form - Collapsible */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg mb-6">
        <button
          onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Настройки
          </h2>
          {isSettingsExpanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </button>

        {isSettingsExpanded && (
          <div className="p-6 pt-0 border-t border-zinc-200 dark:border-zinc-800">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
              {errors.root && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  {errors.root.message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Название" htmlFor="name" required error={errors.name?.message}>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Например: Уведомление в Telegram"
                    error={errors.name?.message}
                  />
                </FormField>

                <FormField label="URL" htmlFor="url" required error={errors.url?.message}>
                  <Input
                    id="url"
                    type="url"
                    {...register('url')}
                    placeholder="https://example.com/webhook"
                    error={errors.url?.message}
                  />
                </FormField>

                <FormField label="HTTP метод" htmlFor="method" required>
                  <select
                    id="method"
                    {...register('method')}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Headers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Заголовки
                    </label>
                    <button
                      type="button"
                      onClick={() => appendHeader({ key: '', value: '' })}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить
                    </button>
                  </div>
                  {headerFields.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Нет дополнительных заголовков
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {headerFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                          <Input
                            {...register(`headers.${index}.key`)}
                            placeholder="Header-Name"
                            className="flex-1"
                          />
                          <Input
                            {...register(`headers.${index}.value`)}
                            placeholder="Значение"
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeHeader(index)}
                            className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Events */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    События <span className="text-red-500">*</span>
                  </label>
                  {errors.events && (
                    <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                      {errors.events.message}
                    </p>
                  )}
                  {isLoadingEvents ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                      {availableEvents.map((group) => {
                        const groupEventIds = group.items.map((e) => e.event);
                        const selectedCount = groupEventIds.filter((e) =>
                          selectedEvents?.includes(e)
                        ).length;
                        const allSelected = selectedCount === groupEventIds.length;
                        const someSelected = selectedCount > 0 && selectedCount < groupEventIds.length;

                        return (
                          <div key={group.entity}>
                            <label className="flex items-center gap-2 mb-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => {
                                  if (el) el.indeterminate = someSelected;
                                }}
                                onChange={() => toggleEntityEvents(group.entity, group.items)}
                                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                                {group.entityLabel}
                              </span>
                              <span className="text-xs text-zinc-500">
                                ({selectedCount}/{groupEventIds.length})
                              </span>
                            </label>
                            <div className="ml-6 space-y-1">
                              {group.items.map((item) => (
                                <label
                                  key={item.event}
                                  className="flex items-center gap-2 cursor-pointer text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedEvents?.includes(item.event) || false}
                                    onChange={() => toggleEvent(item.event)}
                                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-zinc-700 dark:text-zinc-300">{item.label}</span>
                                  <code className="text-xs text-zinc-500 dark:text-zinc-500">
                                    {item.event}
                                  </code>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button type="submit" isLoading={isSaving} disabled={!isDirty}>
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить изменения
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Logs Section - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Logs List */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col h-[calc(100vh-320px)] min-h-[400px]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Логи
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
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Логи не найдены</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`cursor-pointer transition-colors ${
                        selectedLog?.id === log.id
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <td className="pl-3 py-1.5 w-5">
                        {log.success ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                        )}
                      </td>
                      <td className="py-1.5 font-medium text-zinc-900 dark:text-zinc-50 truncate max-w-[120px]">
                        {log.event.split('.')[1] || log.event}
                      </td>
                      <td className="py-1.5 w-10">
                        {log.responseStatus && (
                          <span className={`font-medium ${getStatusColor(log.responseStatus)}`}>
                            {log.responseStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 pr-3 text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap">
                        {formatLogDateTime(log.createdAt).split(',')[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {logsTotal > 50 && (
            <div className="flex items-center justify-between px-2 py-1.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
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

        {/* Log Details */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col h-[calc(100vh-320px)] min-h-[400px]">
          {selectedLog ? (
            <>
              {/* Log Detail Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  {selectedLog.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <code className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {selectedLog.event}
                  </code>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {selectedLog.responseStatus && (
                    <span className={`font-medium ${getStatusColor(selectedLog.responseStatus)}`}>
                      HTTP {selectedLog.responseStatus}
                    </span>
                  )}
                  <span>{selectedLog.duration}ms</span>
                  <span>{formatFullDateTime(selectedLog.createdAt)}</span>
                </div>
              </div>

              {/* Log Detail Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Error */}
                {selectedLog.error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                      Ошибка
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">{selectedLog.error}</p>
                  </div>
                )}

                {/* Request */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                    Запрос
                  </h3>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getMethodBadgeColor(selectedLog.method)}`}>
                        {selectedLog.method}
                      </span>
                      <code className="text-sm text-zinc-600 dark:text-zinc-400 break-all">
                        {selectedLog.url}
                      </code>
                    </div>
                  </div>

                  {/* Request Headers */}
                  {Object.keys(selectedLog.requestHeaders).length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase">
                        Заголовки
                      </p>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="text-xs space-y-1 font-mono">
                          {Object.entries(selectedLog.requestHeaders).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="text-zinc-500 dark:text-zinc-400 mr-2">
                                {key}:
                              </span>
                              <span className="text-zinc-700 dark:text-zinc-300 break-all">
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {selectedLog.requestBody && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase">
                        Тело запроса
                      </p>
                      <pre className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs overflow-auto max-h-64 font-mono">
                        {JSON.stringify(selectedLog.requestBody, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Response */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                    Ответ
                  </h3>
                  {selectedLog.responseBody ? (
                    <pre className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs overflow-auto max-h-64 font-mono">
                      {selectedLog.responseBody}
                    </pre>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                      Нет тела ответа
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Выберите лог для просмотра</p>
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
