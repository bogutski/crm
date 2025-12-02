'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { DictionaryForm } from './DictionaryForm';

interface DictionaryField {
  code: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'icon';
  required: boolean;
}

interface Dictionary {
  id: string;
  code: string;
  name: string;
  description?: string;
  allowHierarchy: boolean;
  maxDepth: number;
  fields: DictionaryField[];
  itemCount?: number;
}

export function DictionariesList() {
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDict, setEditingDict] = useState<Dictionary | null>(null);
  const [deletingDict, setDeletingDict] = useState<Dictionary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDictionaries = useCallback(async () => {
    try {
      const response = await fetch('/api/dictionaries');
      const data = await response.json();
      setDictionaries(data.dictionaries || []);
    } catch (error) {
      console.error('Error fetching dictionaries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDictionaries();
  }, [fetchDictionaries]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchDictionaries();
  };

  const handleEditSuccess = () => {
    setEditingDict(null);
    fetchDictionaries();
  };

  const handleDelete = async () => {
    if (!deletingDict) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/dictionaries/${deletingDict.code}`, { method: 'DELETE' });
      setDeletingDict(null);
      fetchDictionaries();
    } catch (error) {
      console.error('Error deleting dictionary:', error);
    } finally {
      setIsDeleting(false);
    }
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
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-colors"
        >
          Создать словарь
        </button>
      </div>

      {dictionaries.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <p>Словари пока не созданы</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-sm text-zinc-900 dark:text-zinc-50 underline"
          >
            Создать первый словарь
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
                  Код
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Элементов
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Полей
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Опции
                </th>
                <th className="w-24 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {dictionaries.map((dict) => (
                <tr
                  key={dict.id}
                  className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/settings/dictionaries/${dict.code}`}
                      className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline"
                    >
                      {dict.name}
                    </Link>
                    {dict.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-xs">
                        {dict.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                    {dict.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {dict.itemCount || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {dict.fields.length}
                  </td>
                  <td className="px-4 py-3">
                    {dict.allowHierarchy && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        Иерархия
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => setEditingDict(dict)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        title="Редактировать"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingDict(dict)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Создание словаря */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Создать словарь"
        size="lg"
      >
        <DictionaryForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateOpen(false)} />
      </SlideOver>

      {/* Редактирование словаря */}
      <SlideOver
        isOpen={!!editingDict}
        onClose={() => setEditingDict(null)}
        title="Редактировать словарь"
        size="lg"
      >
        {editingDict && (
          <DictionaryForm
            dictionary={editingDict}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingDict(null)}
          />
        )}
      </SlideOver>

      {/* Подтверждение удаления */}
      <ConfirmDialog
        isOpen={!!deletingDict}
        title="Удалить словарь?"
        message={`Вы уверены, что хотите удалить словарь "${deletingDict?.name}"? Все элементы словаря также будут удалены. Это действие необратимо.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeletingDict(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
