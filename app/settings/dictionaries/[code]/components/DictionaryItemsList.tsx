'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { DictionaryItemForm } from './DictionaryItemForm';

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
}

interface DictionaryItem {
  id: string;
  dictionaryCode: string;
  code?: string;
  name: string;
  weight: number;
  parentId: string | null;
  depth: number;
  isActive: boolean;
  properties: Record<string, unknown>;
}

interface DictionaryItemsListProps {
  dictionaryCode: string;
}

export function DictionaryItemsList({ dictionaryCode }: DictionaryItemsListProps) {
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [items, setItems] = useState<DictionaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DictionaryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<DictionaryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DictionaryItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [dictRes, itemsRes] = await Promise.all([
        fetch(`/api/dictionaries/${dictionaryCode}`),
        fetch(`/api/dictionaries/${dictionaryCode}/items?includeInactive=true`),
      ]);

      if (dictRes.ok) {
        const dictData = await dictRes.json();
        setDictionary(dictData);
      }

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dictionaryCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchData();
  };

  const handleEditSuccess = () => {
    setEditingItem(null);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/dictionaries/${dictionaryCode}/items/${deletingItem.id}`, {
        method: 'DELETE',
      });
      setDeletingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: DictionaryItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetItem: DictionaryItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      return;
    }

    // Находим индексы
    const draggedIndex = items.findIndex((i) => i.id === draggedItem.id);
    const targetIndex = items.findIndex((i) => i.id === targetItem.id);

    // Создаём новый порядок
    const newItems = [...items];
    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    // Обновляем веса
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      weight: index,
    }));

    setItems(updatedItems);
    setDraggedItem(null);

    // Отправляем на сервер
    try {
      await fetch(`/api/dictionaries/${dictionaryCode}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems.map((item) => ({
            id: item.id,
            weight: item.weight,
          })),
        }),
      });
    } catch (error) {
      console.error('Error updating order:', error);
      fetchData(); // Откатываем при ошибке
    }
  };

  const handleToggleActive = async (item: DictionaryItem) => {
    try {
      await fetch(`/api/dictionaries/${dictionaryCode}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling active state:', error);
    }
  };

  const getPropertyDisplay = (item: DictionaryItem, field: DictionaryField) => {
    const value = item.properties[field.code];
    if (value === undefined || value === null) return null;

    if (field.type === 'color') {
      return (
        <span
          className="inline-block w-4 h-4 rounded border border-zinc-300 dark:border-zinc-700"
          style={{ backgroundColor: String(value) }}
          title={String(value)}
        />
      );
    }

    if (field.type === 'boolean') {
      return value ? 'Да' : 'Нет';
    }

    return String(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  if (!dictionary) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        Словарь не найден
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {dictionary.name}
          </h1>
          {dictionary.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {dictionary.description}
            </p>
          )}
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-colors"
        >
          Добавить элемент
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
          <p>Элементы пока не добавлены</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-sm text-zinc-900 dark:text-zinc-50 underline"
          >
            Добавить первый элемент
          </button>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="w-8 px-3 py-2"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Код
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Название
                </th>
                {dictionary.fields.map((field) => (
                  <th
                    key={field.code}
                    className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                  >
                    {field.name}
                  </th>
                ))}
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Статус
                </th>
                <th className="w-24 px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => (
                <tr
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, item)}
                  className={`bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                    draggedItem?.id === item.id ? 'opacity-50' : ''
                  } ${!item.isActive ? 'opacity-60' : ''}`}
                >
                  <td className="px-3 py-3 cursor-move">
                    <GripVertical className="w-4 h-4 text-zinc-400" />
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                    {item.code || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-medium text-zinc-900 dark:text-zinc-50"
                      style={{ paddingLeft: `${item.depth * 20}px` }}
                    >
                      {item.name}
                    </span>
                  </td>
                  {dictionary.fields.map((field) => (
                    <td key={field.code} className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {getPropertyDisplay(item, field)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {item.isActive ? 'Активен' : 'Скрыт'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        title="Редактировать"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
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

      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
        Перетащите строки для изменения порядка
      </p>

      {/* Создание элемента */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Добавить элемент"
      >
        <DictionaryItemForm
          dictionaryCode={dictionaryCode}
          fields={dictionary.fields}
          items={items}
          allowHierarchy={dictionary.allowHierarchy}
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateOpen(false)}
        />
      </SlideOver>

      {/* Редактирование элемента */}
      <SlideOver
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Редактировать элемент"
      >
        {editingItem && (
          <DictionaryItemForm
            dictionaryCode={dictionaryCode}
            fields={dictionary.fields}
            items={items}
            allowHierarchy={dictionary.allowHierarchy}
            item={editingItem}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </SlideOver>

      {/* Подтверждение удаления */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        title="Удалить элемент?"
        message={`Вы уверены, что хотите удалить "${deletingItem?.name}"? Это действие необратимо.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
