'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface WebhookData {
  id: string;
  name: string;
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

interface WebhookLogsModalProps {
  webhook: WebhookData | null;
  onClose: () => void;
}

export function WebhookLogsModal({ webhook, onClose }: WebhookLogsModalProps) {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!webhook) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, limit: 20 }),
      });
      const data = await response.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [webhook, page]);

  useEffect(() => {
    if (webhook) {
      setPage(1);
      setExpandedLog(null);
    }
  }, [webhook]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusColor = (status: number | null) => {
    if (!status) return 'text-zinc-500';
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400';
    if (status >= 400 && status < 500) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (!webhook) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Логи вебхука
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {webhook.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
              <p>Логи не найдены</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                >
                  {/* Log header */}
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="w-full flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    <div className="flex-shrink-0">
                      {log.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {log.event}
                        </code>
                        {log.responseStatus && (
                          <span className={`text-sm font-medium ${getStatusColor(log.responseStatus)}`}>
                            {log.responseStatus}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {formatDateTime(log.createdAt)} • {log.duration}ms
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {expandedLog === log.id ? (
                        <ChevronUp className="w-5 h-5 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                  </button>

                  {/* Log details */}
                  {expandedLog === log.id && (
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 space-y-4">
                      {/* Error */}
                      {log.error && (
                        <div>
                          <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                            Ошибка
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {log.error}
                          </p>
                        </div>
                      )}

                      {/* Request */}
                      <div>
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Запрос
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                          {log.method} {log.url}
                        </p>
                        {log.requestBody && (
                          <pre className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-auto max-h-32">
                            {JSON.stringify(log.requestBody, null, 2)}
                          </pre>
                        )}
                      </div>

                      {/* Response */}
                      {log.responseBody && (
                        <div>
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Ответ
                          </p>
                          <pre className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-auto max-h-32">
                            {log.responseBody}
                          </pre>
                        </div>
                      )}

                      {/* Headers */}
                      {Object.keys(log.requestHeaders).length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Заголовки запроса
                          </p>
                          <div className="text-xs space-y-1">
                            {Object.entries(log.requestHeaders).map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="text-zinc-500 dark:text-zinc-400 w-40 flex-shrink-0">
                                  {key}:
                                </span>
                                <span className="text-zinc-700 dark:text-zinc-300 break-all">
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Показано {logs.length} из {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Назад
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Страница {page}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Вперёд
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
