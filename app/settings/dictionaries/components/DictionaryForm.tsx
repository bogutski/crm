'use client';

import { useState } from 'react';

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

interface DictionaryFormProps {
  dictionary?: Dictionary;
  onSuccess: () => void;
  onCancel: () => void;
}

const fieldTypes = [
  { value: 'string', label: 'Строка' },
  { value: 'number', label: 'Число' },
  { value: 'boolean', label: 'Да/Нет' },
  { value: 'color', label: 'Цвет' },
  { value: 'icon', label: 'Иконка' },
];

export function DictionaryForm({ dictionary, onSuccess, onCancel }: DictionaryFormProps) {
  const [code, setCode] = useState(dictionary?.code || '');
  const [name, setName] = useState(dictionary?.name || '');
  const [description, setDescription] = useState(dictionary?.description || '');
  const [allowHierarchy, setAllowHierarchy] = useState(dictionary?.allowHierarchy || false);
  const [maxDepth, setMaxDepth] = useState(dictionary?.maxDepth || 1);
  const [fields, setFields] = useState<DictionaryField[]>(dictionary?.fields || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!dictionary;

  const handleAddField = () => {
    setFields([...fields, { code: '', name: '', type: 'string', required: false }]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: keyof DictionaryField, value: string | boolean) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const url = isEditing ? `/api/dictionaries/${dictionary.code}` : '/api/dictionaries';
      const method = isEditing ? 'PATCH' : 'POST';

      const body = isEditing
        ? { name, description, allowHierarchy, maxDepth, fields }
        : { code, name, description, allowHierarchy, maxDepth, fields };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!isEditing && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Код <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent"
            placeholder="contact_types"
            required
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Только латинские буквы, цифры и _
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Название <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent"
          placeholder="Типы контактов"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Описание
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:border-transparent resize-none"
          placeholder="Описание словаря..."
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allowHierarchy}
            onChange={(e) => setAllowHierarchy(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 focus:ring-zinc-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Разрешить иерархию
          </span>
        </label>

        {allowHierarchy && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-700 dark:text-zinc-300">
              Макс. глубина:
            </label>
            <select
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
        )}
      </div>

      {/* Поля словаря */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Дополнительные поля
          </label>
          <button
            type="button"
            onClick={handleAddField}
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            + Добавить поле
          </button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
            Дополнительные поля не добавлены
          </p>
        ) : (
          <div className="space-y-2">
            {/* Заголовки колонок */}
            <div className="flex gap-2 items-center px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <span className="w-24">Код</span>
              <span className="flex-1 min-w-0">Название</span>
              <span className="w-20">Тип</span>
              <span className="w-12 text-center">Обяз.</span>
              <span className="w-6"></span>
            </div>
            {fields.map((field, index) => (
              <div
                key={index}
                className="flex gap-2 items-center p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
              >
                <input
                  type="text"
                  value={field.code}
                  onChange={(e) => handleFieldChange(index, 'code', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-24 px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                  placeholder="color"
                />
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                  placeholder="Цвет"
                />
                <select
                  value={field.type}
                  onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                  className="w-20 px-1.5 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                >
                  {fieldTypes.map((ft) => (
                    <option key={ft.value} value={ft.value}>
                      {ft.label}
                    </option>
                  ))}
                </select>
                <div className="w-12 flex justify-center">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveField(index)}
                  className="w-6 p-1 text-zinc-400 hover:text-red-500 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
          {isSubmitting ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  );
}
