'use client';

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

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

const dictionaryItemFormSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Название обязательно'),
  parentId: z.string().nullable(),
  properties: z.record(z.string(), z.unknown()),
});

type DictionaryItemFormData = z.infer<typeof dictionaryItemFormSchema>;

export function DictionaryItemForm({
  dictionaryCode,
  fields,
  items,
  allowHierarchy,
  item,
  onSuccess,
  onCancel,
}: DictionaryItemFormProps) {
  const isEditing = !!item;

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DictionaryItemFormData>({
    resolver: zodResolver(dictionaryItemFormSchema),
    defaultValues: {
      code: item?.code || '',
      name: item?.name || '',
      parentId: item?.parentId || null,
      properties: item?.properties || {},
    },
  });

  const properties = watch('properties');

  const availableParents = useMemo(() => {
    if (!allowHierarchy) return [];

    const excludeIds = new Set<string>();
    if (item) {
      excludeIds.add(item.id);
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
  }, [allowHierarchy, item, items]);

  const handlePropertyChange = (code: string, value: unknown) => {
    setValue('properties', { ...properties, [code]: value });
  };

  const onSubmit = async (data: DictionaryItemFormData) => {
    try {
      const url = isEditing
        ? `/api/dictionaries/${dictionaryCode}/items/${item.id}`
        : `/api/dictionaries/${dictionaryCode}/items`;
      const method = isEditing ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        name: data.name,
        properties: data.properties,
      };

      if (data.code?.trim()) {
        body.code = data.code.trim();
      } else if (isEditing && item?.code) {
        body.code = null;
      }

      if (allowHierarchy) {
        body.parentId = data.parentId;
      }

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
            <Input
              value={String(value || '')}
              onChange={(e) => handlePropertyChange(field.code, e.target.value)}
              className="flex-1"
              placeholder="#000000"
            />
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value !== undefined ? Number(value) : ''}
            onChange={(e) => handlePropertyChange(field.code, e.target.value ? Number(e.target.value) : undefined)}
          />
        );

      case 'boolean':
        return (
          <Checkbox
            checked={Boolean(value)}
            onChange={(e) => handlePropertyChange(field.code, e.target.checked)}
            label={field.name}
          />
        );

      case 'icon':
        return (
          <div className="space-y-1">
            <Input
              value={String(value || '')}
              onChange={(e) => handlePropertyChange(field.code, e.target.value)}
              placeholder="message, mail, phone..."
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Use icon names from{' '}
              <a
                href="https://lucide.dev/icons"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                lucide.dev/icons
              </a>
              {' '}(e.g., message, mail, phone-call, send)
            </p>
          </div>
        );

      default:
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => handlePropertyChange(field.code, e.target.value)}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      <FormField
        label="Код"
        htmlFor="code"
        hint="Уникальный код для связи с другими сущностями"
      >
        <Input
          id="code"
          {...register('code', {
            onChange: (e) => {
              e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
            },
          })}
          className="font-mono"
          placeholder="client"
        />
      </FormField>

      <FormField label="Название" htmlFor="name" required error={errors.name?.message}>
        <Input
          id="name"
          {...register('name')}
          placeholder="Название элемента"
          error={errors.name?.message}
        />
      </FormField>

      {allowHierarchy && availableParents.length > 0 && (
        <FormField label="Родительский элемент" htmlFor="parentId">
          <Controller
            control={control}
            name="parentId"
            render={({ field }) => (
              <Select
                id="parentId"
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value || null)}
              >
                <option value="">Без родителя (корневой)</option>
                {availableParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {'—'.repeat(p.depth)} {p.name}
                  </option>
                ))}
              </Select>
            )}
          />
        </FormField>
      )}

      {/* Дополнительные поля */}
      {fields.length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Дополнительные поля
          </h3>
          <div className="space-y-4">
            {fields.map((field) => (
              <FormField
                key={field.code}
                label={field.type !== 'boolean' ? field.name : undefined}
                required={field.required}
              >
                {renderFieldInput(field)}
              </FormField>
            ))}
          </div>
        </div>
      )}

      {/* Кнопки */}
      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {isEditing ? 'Save' : 'Add'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
