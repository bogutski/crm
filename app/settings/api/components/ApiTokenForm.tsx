'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

const apiTokenFormSchema = z.object({
  name: z.string().min(1, 'Введите название токена').max(100, 'Максимум 100 символов'),
});

type ApiTokenFormData = z.infer<typeof apiTokenFormSchema>;

interface CreatedToken {
  id: string;
  name: string;
  tokenPrefix: string;
  token: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiTokenFormProps {
  onSuccess: (token: CreatedToken) => void;
  onCancel: () => void;
}

export function ApiTokenForm({ onSuccess, onCancel }: ApiTokenFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ApiTokenFormData>({
    resolver: zodResolver(apiTokenFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data: ApiTokenFormData) => {
    try {
      const response = await fetch('/api/api-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name.trim() }),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Ошибка создания токена');
      }

      const token = await response.json();
      onSuccess(token);
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
        label="Название токена"
        htmlFor="name"
        required
        error={errors.name?.message}
        hint="Например: Production API, Integration Bot, My App"
      >
        <Input
          id="name"
          {...register('name')}
          placeholder="Введите название"
          error={errors.name?.message}
        />
      </FormField>

      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 text-sm text-zinc-600 dark:text-zinc-400">
        <p className="font-medium text-zinc-900 dark:text-zinc-50 mb-2">
          Информация о токене:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Токен даёт полный доступ к API</li>
          <li>Токен будет показан только один раз при создании</li>
          <li>Храните токен в безопасном месте</li>
        </ul>
      </div>

      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Создать токен
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
