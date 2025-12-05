'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import {
  TelephonyProviderCode,
  TelephonyProviderResponse,
  TELEPHONY_PROVIDERS,
} from '@/modules/telephony/types';

interface ProviderFormProps {
  providerCode: TelephonyProviderCode;
  existingProvider?: TelephonyProviderResponse;
  onClose: () => void;
  onSuccess: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  accountSid: z.string().optional(),
  authToken: z.string().optional(),
  defaultCallerId: z.string().optional(),
  recordCalls: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function ProviderForm({
  providerCode,
  existingProvider,
  onClose,
  onSuccess,
}: ProviderFormProps) {
  const [error, setError] = useState<string | null>(null);
  const info = TELEPHONY_PROVIDERS[providerCode];
  const isNew = !existingProvider;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingProvider?.name || info.name,
      enabled: existingProvider?.enabled ?? true,
      defaultCallerId: existingProvider?.settings?.defaultCallerId || '',
      recordCalls: existingProvider?.settings?.recordCalls ?? false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);

      // Формируем credentials
      const credentials: Record<string, string> = {};
      if (data.apiKey) credentials.apiKey = data.apiKey;
      if (data.apiSecret) credentials.apiSecret = data.apiSecret;
      if (data.accountSid) credentials.accountSid = data.accountSid;
      if (data.authToken) credentials.authToken = data.authToken;

      const body = {
        code: providerCode,
        name: data.name,
        enabled: data.enabled,
        credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
        settings: {
          defaultCallerId: data.defaultCallerId || undefined,
          recordCalls: data.recordCalls,
        },
      };

      let response: Response;

      if (isNew) {
        // Создаём нового провайдера
        response = await fetch('/api/telephony/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        // Обновляем существующего
        response = await fetch(`/api/telephony/providers/${existingProvider._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            enabled: data.enabled,
            credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
            settings: {
              defaultCallerId: data.defaultCallerId || undefined,
              recordCalls: data.recordCalls,
            },
          }),
        });
      }

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Ошибка сохранения');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {isNew ? 'Подключить' : 'Настроить'} {info.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </div>
          )}

          {/* Информация о провайдере */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {info.description}
            </p>
            <a
              href={info.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {info.website}
            </a>
          </div>

          {/* Название */}
          <FormField label="Название" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              {...register('name')}
              placeholder={info.name}
              error={errors.name?.message}
            />
          </FormField>

          {/* Credentials */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Учётные данные
            </h4>

            {info.requiredCredentials.map((cred) => {
              const hasValue = existingProvider?.hasCredentials?.[cred.field];

              return (
                <FormField
                  key={cred.field}
                  label={cred.label}
                  htmlFor={cred.field}
                  error={errors[cred.field as keyof FormData]?.message}
                >
                  <Input
                    id={cred.field}
                    {...register(cred.field as keyof FormData)}
                    type="password"
                    placeholder={hasValue ? '••••••••••••' : cred.placeholder}
                    error={errors[cred.field as keyof FormData]?.message}
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {hasValue
                      ? 'Уже сохранено. Оставьте пустым чтобы сохранить текущее значение.'
                      : cred.helpText}
                  </p>
                </FormField>
              );
            })}
          </div>

          {/* Настройки */}
          <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Настройки
            </h4>

            <FormField
              label="Номер для исходящих (Caller ID)"
              htmlFor="defaultCallerId"
              error={errors.defaultCallerId?.message}
            >
              <Input
                id="defaultCallerId"
                {...register('defaultCallerId')}
                placeholder="+14155551234"
                error={errors.defaultCallerId?.message}
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Номер, который будет отображаться при исходящих звонках
              </p>
            </FormField>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('recordCalls')}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Записывать звонки
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('enabled')}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Провайдер включен
              </span>
            </label>
          </div>

          {/* Кнопки */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isNew ? 'Подключить' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
