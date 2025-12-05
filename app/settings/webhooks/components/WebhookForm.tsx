'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

const webhookFormSchema = z.object({
  name: z.string().min(1, 'Введите название').max(100, 'Максимум 100 символов'),
  url: z.string().url('Введите корректный URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })),
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
}

interface EventGroup {
  entity: string;
  entityLabel: string;
  items: { event: string; label: string }[];
}

interface WebhookFormProps {
  webhook?: WebhookData | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WebhookForm({ webhook, onSuccess, onCancel }: WebhookFormProps) {
  const [availableEvents, setAvailableEvents] = useState<EventGroup[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      name: webhook?.name || '',
      url: webhook?.url || '',
      method: (webhook?.method as WebhookFormData['method']) || 'POST',
      headers: webhook?.headers?.filter(h => h.key) || [],
      events: webhook?.events || [],
      isActive: webhook?.isActive ?? true,
    },
  });

  const { fields: headerFields, append: appendHeader, remove: removeHeader } = useFieldArray({
    control,
    name: 'headers',
  });

  const selectedEvents = watch('events');

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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const toggleEvent = (event: string) => {
    const currentEvents = selectedEvents || [];
    if (currentEvents.includes(event)) {
      setValue('events', currentEvents.filter(e => e !== event));
    } else {
      setValue('events', [...currentEvents, event]);
    }
  };

  const toggleEntityEvents = (entity: string, entityEvents: { event: string }[]) => {
    const currentEvents = selectedEvents || [];
    const entityEventIds = entityEvents.map(e => e.event);
    const allSelected = entityEventIds.every(e => currentEvents.includes(e));

    if (allSelected) {
      setValue('events', currentEvents.filter(e => !entityEventIds.includes(e)));
    } else {
      const newEvents = [...new Set([...currentEvents, ...entityEventIds])];
      setValue('events', newEvents);
    }
  };

  const onSubmit = async (data: WebhookFormData) => {
    try {
      const filteredHeaders = data.headers.filter(h => h.key.trim() !== '');

      const url = webhook ? `/api/webhooks/${webhook.id}` : '/api/webhooks';
      const method = webhook ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
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

      onSuccess();
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Произошла ошибка',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errors.root && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {errors.root.message}
        </div>
      )}

      <FormField
        label="Название"
        htmlFor="name"
        required
        error={errors.name?.message}
      >
        <Input
          id="name"
          {...register('name')}
          placeholder="Например: Уведомление в Telegram"
          error={errors.name?.message}
        />
      </FormField>

      <FormField
        label="URL"
        htmlFor="url"
        required
        error={errors.url?.message}
      >
        <Input
          id="url"
          type="url"
          {...register('url')}
          placeholder="https://example.com/webhook"
          error={errors.url?.message}
        />
      </FormField>

      <FormField
        label="HTTP метод"
        htmlFor="method"
        required
      >
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
          <div className="space-y-4 max-h-80 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            {availableEvents.map((group) => {
              const groupEventIds = group.items.map(e => e.event);
              const selectedCount = groupEventIds.filter(e => selectedEvents?.includes(e)).length;
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
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {item.label}
                        </span>
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

      {/* Is Active */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          {...register('isActive')}
          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          Активен
        </span>
      </label>

      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {webhook ? 'Сохранить' : 'Создать'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
