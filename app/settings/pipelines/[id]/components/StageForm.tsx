'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

const stageFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Код обязателен')
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Только латинские буквы, цифры и _'),
  name: z.string().min(1, 'Название обязательно').max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Неверный формат цвета'),
  probability: z.number().int().min(0).max(100),
  isInitial: z.boolean(),
  isFinal: z.boolean(),
  isWon: z.boolean(),
  isActive: z.boolean(),
});

type StageFormData = z.infer<typeof stageFormSchema>;

interface Stage {
  id: string;
  name: string;
  code: string;
  color: string;
  probability: number;
  isInitial: boolean;
  isFinal: boolean;
  isWon: boolean;
  isActive: boolean;
}

interface StageFormProps {
  pipelineId: string;
  stage?: Stage;
  onSuccess: () => void;
  onCancel: () => void;
}

const presetColors = [
  '#6b7280', // gray
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
];

export function StageForm({ pipelineId, stage, onSuccess, onCancel }: StageFormProps) {
  const isEditing = !!stage;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StageFormData>({
    resolver: zodResolver(stageFormSchema),
    defaultValues: {
      code: stage?.code || '',
      name: stage?.name || '',
      color: stage?.color || '#6b7280',
      probability: stage?.probability ?? 0,
      isInitial: stage?.isInitial || false,
      isFinal: stage?.isFinal || false,
      isWon: stage?.isWon || false,
      isActive: stage?.isActive ?? true,
    },
  });

  const isFinal = watch('isFinal');
  const isWon = watch('isWon');

  const onSubmit = async (data: StageFormData) => {
    try {
      const url = isEditing
        ? `/api/pipelines/${pipelineId}/stages/${stage.id}`
        : `/api/pipelines/${pipelineId}/stages`;
      const method = isEditing ? 'PATCH' : 'POST';

      const body = isEditing
        ? {
            name: data.name,
            color: data.color,
            probability: data.probability,
            isInitial: data.isInitial,
            isFinal: data.isFinal,
            isWon: data.isWon,
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

  // Auto-set probability to 100 when isWon is checked
  const handleIsWonChange = (checked: boolean) => {
    setValue('isWon', checked);
    if (checked) {
      setValue('probability', 100);
      setValue('isFinal', true);
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
            placeholder="qualification"
            className="font-mono"
            error={errors.code?.message}
          />
        </FormField>
      )}

      <FormField label="Название" htmlFor="name" required error={errors.name?.message}>
        <Input
          id="name"
          {...register('name')}
          placeholder="Квалификация"
          error={errors.name?.message}
        />
      </FormField>

      <FormField label="Цвет" htmlFor="color" error={errors.color?.message}>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <div className="flex gap-2 flex-wrap">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => field.onChange(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    field.value === color
                      ? 'border-blue-500 scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer"
              />
            </div>
          )}
        />
      </FormField>

      <FormField
        label="Вероятность закрытия"
        htmlFor="probability"
        hint="0-100%, используется для прогнозирования"
        error={errors.probability?.message}
      >
        <div className="flex items-center gap-2">
          <Input
            id="probability"
            type="number"
            {...register('probability', { valueAsNumber: true })}
            min={0}
            max={100}
            className="w-24"
            error={errors.probability?.message}
          />
          <span className="text-zinc-500">%</span>
        </div>
      </FormField>

      <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 pt-2">
          Тип этапа
        </p>

        <Controller
          control={control}
          name="isInitial"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              label="Начальный этап"
              description="Новые сделки попадают на этот этап"
            />
          )}
        />

        <Controller
          control={control}
          name="isFinal"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              label="Финальный этап"
              description="Сделка считается завершённой на этом этапе"
              disabled={isWon}
            />
          )}
        />

        <Controller
          control={control}
          name="isWon"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={(e) => handleIsWonChange(e.target.checked)}
              label="Успешное закрытие"
              description="Сделка считается выигранной (автоматически финальный, 100%)"
            />
          )}
        />

        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              label="Активен"
              description="Неактивные этапы скрыты из выбора"
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
