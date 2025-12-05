'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Pencil, Plus, Webhook, Play, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { WebhookForm } from './WebhookForm';
import { WebhookLogsModal } from './WebhookLogsModal';

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

interface TestResult {
  success: boolean;
  responseStatus: number | null;
  responseBody: string | null;
  error: string | null;
  duration: number;
}

export function WebhooksList() {
  const router = useRouter();
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookData | null>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<WebhookData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logsWebhook, setLogsWebhook] = useState<WebhookData | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleRowClick = (webhookId: string) => {
    router.push(`/settings/webhooks/${webhookId}`);
  };

  const fetchWebhooks = useCallback(async () => {
    try {
      const response = await fetch('/api/webhooks/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCreate = () => {
    setEditingWebhook(null);
    setIsFormOpen(true);
  };

  const handleEdit = (webhook: WebhookData) => {
    setEditingWebhook(webhook);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingWebhook(null);
    fetchWebhooks();
  };

  const handleDelete = async () => {
    if (!deletingWebhook) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/webhooks/${deletingWebhook.id}`, { method: 'DELETE' });
      setDeletingWebhook(null);
      fetchWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (webhook: WebhookData) => {
    try {
      await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      });
      fetchWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  };

  const handleTest = async (webhook: WebhookData) => {
    setTestingId(webhook.id);
    setTestResult(null);
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}/test`, {
        method: 'POST',
      });
      const result = await response.json();
      setTestResult(result);
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
      setTestingId(null);
    }
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
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Создать вебхук
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Вебхуки не найдены</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-sm text-zinc-900 dark:text-zinc-50 underline"
          >
            Создать первый вебхук
          </button>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  События
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Статус
                </th>
                <th className="w-40 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {webhooks.map((webhook) => {
                const maxEvents = 5;
                const visibleEvents = webhook.events.slice(0, maxEvents);
                const remainingCount = webhook.events.length - maxEvents;

                return (
                  <tr
                    key={webhook.id}
                    onClick={() => handleRowClick(webhook.id)}
                    className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {webhook.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {visibleEvents.map((event) => (
                          <span
                            key={event}
                            className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded"
                          >
                            {event}
                          </span>
                        ))}
                        {remainingCount > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded font-medium">
                            +{remainingCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getMethodBadgeColor(webhook.method)}`}>
                          {webhook.method}
                        </span>
                        <code className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-xs block">
                          {webhook.url}
                        </code>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(webhook); }}
                        className={`flex items-center gap-2 text-sm ${
                          webhook.isActive
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {webhook.isActive ? (
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
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTest(webhook); }}
                          disabled={testingId === webhook.id}
                          className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-50"
                          title="Тестировать"
                        >
                          {testingId === webhook.id ? (
                            <div className="w-4 h-4 border-2 border-zinc-300 border-t-blue-600 rounded-full animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setLogsWebhook(webhook); }}
                          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                          title="Логи"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(webhook); }}
                          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingWebhook(webhook); }}
                          className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Test Result Dialog */}
      {testResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setTestResult(null)}
          />
          <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Результат тестирования
            </h3>

            <div className={`p-4 rounded-lg mb-4 ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-medium ${
                  testResult.success
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {testResult.success ? 'Успешно' : 'Ошибка'}
                </span>
                {testResult.responseStatus && (
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    HTTP {testResult.responseStatus}
                  </span>
                )}
                <span className="text-sm text-zinc-500 dark:text-zinc-500">
                  {testResult.duration}ms
                </span>
              </div>
              {testResult.error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {testResult.error}
                </p>
              )}
            </div>

            {testResult.responseBody && (
              <div className="mb-4">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Ответ сервера:
                </p>
                <pre className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-auto max-h-40">
                  {testResult.responseBody}
                </pre>
              </div>
            )}

            <button
              onClick={() => setTestResult(null)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <SlideOver
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingWebhook(null);
        }}
        title={editingWebhook ? 'Редактировать вебхук' : 'Создать вебхук'}
      >
        <WebhookForm
          webhook={editingWebhook}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingWebhook(null);
          }}
        />
      </SlideOver>

      <WebhookLogsModal
        webhook={logsWebhook}
        onClose={() => setLogsWebhook(null)}
      />

      <ConfirmDialog
        isOpen={!!deletingWebhook}
        title="Удалить вебхук?"
        message={`Вы уверены, что хотите удалить вебхук "${deletingWebhook?.name}"? Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeletingWebhook(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
