'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema, type TaskFormData } from '@/modules/task/validation';
import { ColorSelect, type ColorOption } from '@/components/ui/ColorSelect';
import { Button } from '@/components/ui/Button';

interface Priority {
  id: string;
  name: string;
  color?: string;
}

interface Assignee {
  id: string;
  name: string;
  email: string;
}

interface LinkedEntity {
  entityType: 'contact' | 'project';
  entityId: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority?: Priority | null;
  dueDate?: string;
  assignee?: Assignee | null;
  linkedTo?: LinkedEntity | null;
}

interface Project {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
}

interface DictionaryItem {
  id: string;
  name: string;
  properties: Record<string, unknown>;
}

interface TaskFormProps {
  task?: Task;
  projects: Project[];
  onSuccess: () => void;
  onCancel: () => void;
}

const statusOptions: ColorOption[] = [
  { value: 'open', label: 'Открыта', color: '#71717a' },
  { value: 'in_progress', label: 'В работе', color: '#3b82f6' },
  { value: 'completed', label: 'Завершена', color: '#22c55e' },
  { value: 'cancelled', label: 'Отменена', color: '#ef4444' },
];

const entityTypeOptions: ColorOption[] = [
  { value: '', label: 'Без привязки' },
  { value: 'contact', label: 'Контакт' },
  { value: 'project', label: 'Проект' },
];

const getDefaultValues = (task?: Task): TaskFormData => {
  if (task) {
    return {
      title: task.title,
      description: task.description || '',
      status: task.status,
      priorityId: task.priority?.id || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assigneeId: task.assignee?.id || '',
      linkedEntityType: task.linkedTo?.entityType,
      linkedEntityId: task.linkedTo?.entityId || '',
    };
  }

  return {
    title: '',
    description: '',
    status: 'open',
    priorityId: '',
    dueDate: '',
    assigneeId: '',
    linkedEntityType: undefined,
    linkedEntityId: '',
  };
};

export function TaskForm({ task, projects, onSuccess, onCancel }: TaskFormProps) {
  const isEditMode = Boolean(task);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Data
  const [priorities, setPriorities] = useState<DictionaryItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: getDefaultValues(task),
  });

  const selectedEntityType = watch('linkedEntityType');

  useEffect(() => {
    Promise.all([
      fetch('/api/dictionaries/task_priority/items').then(r => r.ok ? r.json() : { items: [] }),
      fetch('/api/contacts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 100 }),
      }).then(r => r.ok ? r.json() : { contacts: [] }),
    ]).then(([prioritiesData, contactsData]) => {
      setPriorities(prioritiesData.items || []);
      setContacts(contactsData.contacts || []);
    });
  }, []);

  useEffect(() => {
    if (task) {
      reset(getDefaultValues(task));
    }
  }, [task, reset]);

  const onSubmit = async (data: TaskFormData) => {
    setSubmitError(null);

    try {
      const linkedTo = data.linkedEntityType && data.linkedEntityId
        ? { entityType: data.linkedEntityType, entityId: data.linkedEntityId }
        : isEditMode ? null : undefined;

      const payload = {
        title: data.title.trim(),
        description: data.description?.trim() || (isEditMode ? null : undefined),
        status: data.status,
        priorityId: data.priorityId || (isEditMode ? null : undefined),
        dueDate: data.dueDate || (isEditMode ? null : undefined),
        assigneeId: data.assigneeId || (isEditMode ? null : undefined),
        linkedTo,
      };

      const url = isEditMode ? `/api/tasks/${task!.id}` : '/api/tasks';
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} task`);
      }

      window.dispatchEvent(new CustomEvent(isEditMode ? 'taskUpdated' : 'taskCreated'));
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    }
  };

  const priorityOptions: ColorOption[] = useMemo(() => [
    { value: '', label: 'Не указан' },
    ...priorities.map(p => ({
      value: p.id,
      label: p.name,
      color: p.properties.color as string | undefined,
    })),
  ], [priorities]);

  const contactOptions: ColorOption[] = useMemo(() => [
    { value: '', label: 'Не выбран' },
    ...contacts.map(c => ({
      value: c.id,
      label: c.name,
    })),
  ], [contacts]);

  const projectOptions: ColorOption[] = useMemo(() => [
    { value: '', label: 'Не выбран' },
    ...projects.map(p => ({
      value: p.id,
      label: p.name,
    })),
  ], [projects]);

  const linkedEntityOptions = selectedEntityType === 'contact' ? contactOptions : projectOptions;

  const idPrefix = isEditMode ? 'edit-' : '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor={`${idPrefix}title`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Название *
        </label>
        <input
          id={`${idPrefix}title`}
          type="text"
          {...register('title')}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Что нужно сделать?"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      {/* Status & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}status`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Статус
          </label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <ColorSelect
                id={`${idPrefix}status`}
                options={statusOptions}
                value={field.value || 'open'}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}priorityId`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Приоритет
          </label>
          <Controller
            control={control}
            name="priorityId"
            render={({ field }) => (
              <ColorSelect
                id={`${idPrefix}priorityId`}
                options={priorityOptions}
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label htmlFor={`${idPrefix}dueDate`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Срок выполнения
        </label>
        <input
          id={`${idPrefix}dueDate`}
          type="date"
          {...register('dueDate')}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Linked Entity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}linkedEntityType`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Привязка
          </label>
          <Controller
            control={control}
            name="linkedEntityType"
            render={({ field }) => (
              <ColorSelect
                id={`${idPrefix}linkedEntityType`}
                options={entityTypeOptions}
                value={field.value || ''}
                onChange={(value) => {
                  field.onChange(value || undefined);
                }}
              />
            )}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}linkedEntityId`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {selectedEntityType === 'contact' ? 'Контакт' : selectedEntityType === 'project' ? 'Проект' : 'Сущность'}
          </label>
          <Controller
            control={control}
            name="linkedEntityId"
            render={({ field }) => (
              <ColorSelect
                id={`${idPrefix}linkedEntityId`}
                options={linkedEntityOptions}
                value={field.value || ''}
                onChange={field.onChange}
                isDisabled={!selectedEntityType}
                placeholder={selectedEntityType ? 'Выберите' : 'Сначала выберите тип'}
              />
            )}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor={`${idPrefix}description`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Описание
        </label>
        <textarea
          id={`${idPrefix}description`}
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Дополнительные детали..."
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {isEditMode ? 'Сохранить' : 'Создать задачу'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
