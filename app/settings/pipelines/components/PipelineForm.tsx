'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

const pipelineFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Код обязателен')
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Только латинские буквы, цифры и _'),
  name: z.string().min(1, 'Название обязательно').max(100),
  description: z.string().max(500).optional(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

type PipelineFormData = z.infer<typeof pipelineFormSchema>;

interface Pipeline {
  id: string;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
}

interface PipelineFormProps {
  pipeline?: Pipeline;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PipelineForm({ pipeline, onSuccess, onCancel }: PipelineFormProps) {
  const isEditing = !!pipeline;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PipelineFormData>({
    resolver: zodResolver(pipelineFormSchema),
    defaultValues: {
      code: pipeline?.code || '',
      name: pipeline?.name || '',
      description: pipeline?.description || '',
      isDefault: pipeline?.isDefault || false,
      isActive: pipeline?.isActive ?? true,
    },
  });

  const onSubmit = async (data: PipelineFormData) => {
    try {
      const url = isEditing ? `/api/pipelines/${pipeline.id}` : '/api/pipelines';
      const method = isEditing ? 'PATCH' : 'POST';

      const body = isEditing
        ? {
            name: data.name,
            description: data.description || null,
            isDefault: data.isDefault,
            isActive: data.isActive,
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
            placeholder="b2b_sales"
            className="font-mono"
            error={errors.code?.message}
          />
        </FormField>
      )}

      <FormField label="Название" htmlFor="name" required error={errors.name?.message}>
        <Input
          id="name"
          {...register('name')}
          placeholder="B2B Продажи"
          error={errors.name?.message}
        />
      </FormField>

      <FormField label="Описание" htmlFor="description">
        <Textarea
          id="description"
          {...register('description')}
          rows={2}
          placeholder="Описание воронки..."
        />
      </FormField>

      <div className="space-y-3 pt-2">
        <Controller
          control={control}
          name="isDefault"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              label="Воронка по умолчанию"
              description="Новые сделки будут попадать в эту воронку"
            />
          )}
        />

        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              label="Активна"
              description="Неактивные воронки скрыты из списка выбора"
            />
          )}
        />
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
