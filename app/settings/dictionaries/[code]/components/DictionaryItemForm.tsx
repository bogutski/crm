'use client';

import { useState } from 'react';

interface DictionaryField {
  code: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'icon';
  required: boolean;
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

interface DictionaryItemFormProps {
  dictionaryCode: string;
  fields: DictionaryField[];
  items: DictionaryItem[];
  allowHierarchy: boolean;
  item?: DictionaryItem;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DictionaryItemForm({
  dictionaryCode,
  fields,
  items,
  allowHierarchy,
  item,
  onSuccess,
  onCancel,
}: DictionaryItemFormProps) {
  const [code, setCode] = useState(item?.code || '');
  const [name, setName] = useState(item?.name || '');
  const [parentId, setParentId] = useState<string | null>(item?.parentId || null);
  const [properties, setProperties] = useState<Record<string, unknown>>(item?.properties || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;

  // Получаем доступных родителей (исключаем самого себя и своих детей при редактировании)
  const getAvailableParents = () => {
    if (!allowHierarchy) return [];

    const excludeIds = new Set<string>();
    if (item) {
      excludeIds.add(item.id);
      // Рекурсивно исключаем детей
      const addChildren = (parentId: string) => {
        items.forEach((i) => {
          if (i.parentId === parentId) {
            excludeIds.add(i.id);
            addChildren(i.id);
          }
        });
      };
      addChildren(item.id);
    }

    return items.filter((i) => !excludeIds.has(i.id) && i.depth < 2);
  };

  const handlePropertyChange = (code: string, value: unknown) => {
    setProperties({ ...properties, [code]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/dictionaries/${dictionaryCode}/items/${item.id}`
        : `/api/dictionaries/${dictionaryCode}/items`;
      const method = isEditing ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        name,
        properties,
      };

      // Код только при создании или если изменился
      if (code.trim()) {
        body.code = code.trim();
      } else if (isEditing && item?.code) {
        body.code = null; // Убираем код если очистили
      }

      if (allowHierarchy) {
        body.parentId = parentId;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка сохранения');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldInput = (field: DictionaryField) => {
    const value = properties[field.code];

    switch (field.type) {
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={String(value || '#000000')}
              onChange={(e) => handlePropertyChange(field.code, e.target.value)}
              className="w-10 h-10 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
            />
            <input
              type="text"
              value={String(value || '')}
              onChange={(e) => handlePropertyChange(field.code, e.target.value)}
              className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
              placeholder="#000000"
            />
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value !== undefined ? Number(value) : ''}
            onChange={(e) => handlePropertyChange(field.code, e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handlePropertyChange(field.code, e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {field.name}
            </span>
          </label>
        );

      case 'icon':
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => handlePropertyChange(field.code, e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
            placeholder="user, star, folder..."
          />
        );

      default:
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => handlePropertyChange(field.code, e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
          />
        );
    }
  };

  const availableParents = getAvailableParents();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Код
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent font-mono"
          placeholder="client"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Уникальный код для связи с другими сущностями
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Название <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent"
          placeholder="Название элемента"
          required
        />
      </div>

      {allowHierarchy && availableParents.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Родительский элемент
          </label>
          <select
            value={parentId || ''}
            onChange={(e) => setParentId(e.target.value || null)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
          >
            <option value="">Без родителя (корневой)</option>
            {availableParents.map((p) => (
              <option key={p.id} value={p.id}>
                {'—'.repeat(p.depth)} {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Дополнительные поля */}
      {fields.length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Дополнительные поля
          </h3>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.code}>
                {field.type !== 'boolean' && (
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {field.name}
                    {field.required && <span className="text-red-500"> *</span>}
                  </label>
                )}
                {renderFieldInput(field)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Кнопки */}
      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </form>
  );
}
