'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Copy, Check, Key, Plus } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { ApiTokenForm } from './ApiTokenForm';

interface ApiTokenData {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatedToken extends ApiTokenData {
  token: string;
}

export function ApiTokensList() {
  const [tokens, setTokens] = useState<ApiTokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdToken, setCreatedToken] = useState<CreatedToken | null>(null);
  const [deletingToken, setDeletingToken] = useState<ApiTokenData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      const response = await fetch('/api/api-tokens/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setTokens(data.tokens || []);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreateSuccess = (token: CreatedToken) => {
    setIsCreateOpen(false);
    setCreatedToken(token);
    fetchTokens();
  };

  const handleDelete = async () => {
    if (!deletingToken) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/api-tokens/${deletingToken.id}`, { method: 'DELETE' });
      setDeletingToken(null);
      fetchTokens();
    } catch (error) {
      console.error('Error deleting token:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
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
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Создать токен
        </button>
      </div>

      {tokens.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>API токены не найдены</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-sm text-zinc-900 dark:text-zinc-50 underline"
          >
            Создать первый токен
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
                  Токен
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Последнее использование
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Создан
                </th>
                <th className="w-16 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {tokens.map((token) => (
                <tr
                  key={token.id}
                  className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Key className="w-4 h-4 text-zinc-500" />
                      </div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {token.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
                      {token.tokenPrefix}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {token.lastUsedAt ? formatDateTime(token.lastUsedAt) : 'Никогда'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDateTime(token.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeletingToken(token)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Создать API токен"
      >
        <ApiTokenForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateOpen(false)}
        />
      </SlideOver>

      {/* Диалог с созданным токеном */}
      {createdToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCreatedToken(null)}
          />
          <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Токен создан
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {createdToken.name}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                Скопируйте токен сейчас. Он больше не будет показан!
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded font-mono break-all">
                  {createdToken.token}
                </code>
                <button
                  onClick={() => copyToClipboard(createdToken.token, createdToken.id)}
                  className="p-2 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded transition-colors"
                  title="Скопировать"
                >
                  {copiedId === createdToken.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              <p className="mb-2">Используйте этот токен в заголовке Authorization:</p>
              <code className="block px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">
                Authorization: Bearer {createdToken.token.substring(0, 20)}...
              </code>
            </div>

            <button
              onClick={() => setCreatedToken(null)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-colors"
            >
              Готово
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deletingToken}
        title="Удалить API токен?"
        message={`Вы уверены, что хотите удалить токен "${deletingToken?.name}"? Все приложения, использующие этот токен, потеряют доступ к API.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeletingToken(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
