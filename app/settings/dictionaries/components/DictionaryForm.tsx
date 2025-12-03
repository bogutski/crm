'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

const fieldTypeSchema = z.enum(['string', 'number', 'boolean', 'color', 'icon']);

const dictionaryFieldSchema = z.object({
  code: z.string().min(1, 'Код обязателен'),
  name: z.string().min(1, 'Название обязательно'),
  type: fieldTypeSchema,
  required: z.boolean(),
});

const dictionaryFormSchema = z.object({
  code: z.string().min(1, 'Код обязателен'),
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  allowHierarchy: z.boolean(),
  maxDepth: z.number().min(1).max(3),
  fields: z.array(dictionaryFieldSchema),
});

type DictionaryFormData = z.infer<typeof dictionaryFormSchema>;

interface Dictionary {
  id: string;
  code: string;
  name: string;
  description?: string;
  allowHierarchy: boolean;
  maxDepth: number;
  fields: Array<{
    code: string;
    name: string;
    type: 'string' | 'number' | 'boolean' | 'color' | 'icon';
    required: boolean;
  }>;
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
  const isEditing = !!dictionary;

  const {
    register,
    control,
    watch,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DictionaryFormData>({
    resolver: zodResolver(dictionaryFormSchema),
    defaultValues: {
      code: dictionary?.code || '',
      name: dictionary?.name || '',
      description: dictionary?.description || '',
      allowHierarchy: dictionary?.allowHierarchy || false,
      maxDepth: dictionary?.maxDepth || 1,
      fields: dictionary?.fields || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  const allowHierarchy = watch('allowHierarchy');

  const onSubmit = async (data: DictionaryFormData) => {
    try {
      const url = isEditing ? `/api/dictionaries/${dictionary.code}` : '/api/dictionaries';
      const method = isEditing ? 'PATCH' : 'POST';

      const body = isEditing
        ? {
            name: data.name,
            description: data.description,
            allowHierarchy: data.allowHierarchy,
            maxDepth: data.maxDepth,
            fields: data.fields,
          }
        : data;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Ошибка сохранения');
      }

      onSuccess();
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Ошибка сохранения',
      });
    }
  };

  const handleAddField = () => {
    append({ code: '', name: '', type: 'string', required: false });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      {!isEditing && (
        <FormField
          label="Код"
          htmlFor="code"
          required
          error={errors.code?.message}
          hint="Только латинские буквы, цифры и _"
        >
          <Input
            id="code"
            {...register('code', {
              onChange: (e) => {
                e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
              },
            })}
            placeholder="contact_types"
            className="font-mono"
            error={errors.code?.message}
          />
        </FormField>
      )}

      <FormField label="Название" htmlFor="name" required error={errors.name?.message}>
        <Input
          id="name"
          {...register('name')}
          placeholder="Типы контактов"
          error={errors.name?.message}
        />
      </FormField>

      <FormField label="Описание" htmlFor="description">
        <Textarea
          id="description"
          {...register('description')}
          rows={2}
          placeholder="Описание словаря..."
        />
      </FormField>

      <div className="flex items-center gap-4">
        <Controller
          control={control}
          name="allowHierarchy"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              label="Разрешить иерархию"
            />
          )}
        />

        {allowHierarchy && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-700 dark:text-zinc-300">
              Макс. глубина:
            </label>
            <Select {...register('maxDepth', { valueAsNumber: true })} className="w-16">
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </Select>
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
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
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
              <span style={{ width: 100 }}>Код</span>
              <span style={{ width: 160 }}>Название</span>
              <span style={{ width: 90 }}>Тип</span>
              <span className="w-8 text-center">Обяз.</span>
              <span className="w-6"></span>
            </div>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex gap-2 items-center p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
              >
                <div style={{ width: 100 }}>
                  <Input
                    {...register(`fields.${index}.code`, {
                      onChange: (e) => {
                        e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      },
                    })}
                    className="px-2 py-1.5 text-sm font-mono"
                    placeholder="color"
                  />
                </div>
                <div style={{ width: 160 }}>
                  <Input
                    {...register(`fields.${index}.name`)}
                    className="px-2 py-1.5 text-sm"
                    placeholder="Цвет"
                  />
                </div>
                <Select
                  {...register(`fields.${index}.type`)}
                  style={{ width: 90 }}
                  className="px-1.5 py-1.5 text-sm"
                >
                  {fieldTypes.map((ft) => (
                    <option key={ft.value} value={ft.value}>
                      {ft.label}
                    </option>
                  ))}
                </Select>
                <div className="w-8 flex justify-center">
                  <input
                    type="checkbox"
                    {...register(`fields.${index}.required`)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="w-6 p-1 text-zinc-400 hover:text-red-500 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Кнопки */}
      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {isEditing ? 'Сохранить' : 'Создать'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
