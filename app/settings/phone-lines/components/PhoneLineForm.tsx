'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Phone, PhoneForwarded, Info } from 'lucide-react';

interface Provider {
  id: string;
  type: string;
  name: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

interface PhoneLine {
  id: string;
  userId: string;
  providerId: string;
  phoneNumber: string;
  displayName: string;
  capabilities: string[];
  isDefault: boolean;
  isActive: boolean;
  forwardingEnabled: boolean;
  forwardTo?: string;
  forwardOnBusy: boolean;
  forwardOnNoAnswer: boolean;
  forwardOnOffline: boolean;
  forwardAfterRings: number;
}

interface PhoneLineFormProps {
  phoneLine?: PhoneLine;
  onSuccess: () => void;
  onCancel: () => void;
}

const phoneLineFormSchema = z.object({
  userId: z.string().min(1, 'Пользователь обязателен'),
  providerId: z.string().min(1, 'Провайдер обязателен'),
  phoneNumber: z.string()
    .min(1, 'Номер телефона обязателен')
    .regex(/^\+[1-9]\d{1,14}$/, 'Используйте формат E.164 (+79001234567)'),
  displayName: z.string().min(1, 'Название обязательно'),
  capabilities: z.array(z.string()),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  forwardingEnabled: z.boolean(),
  forwardTo: z.string().optional(),
  forwardOnBusy: z.boolean(),
  forwardOnNoAnswer: z.boolean(),
  forwardOnOffline: z.boolean(),
  forwardAfterRings: z.number().min(1).max(10),
});

type PhoneLineFormData = z.infer<typeof phoneLineFormSchema>;

const LINE_CAPABILITIES = [
  { value: 'voice', label: 'Голос' },
  { value: 'sms', label: 'SMS' },
  { value: 'mms', label: 'MMS' },
  { value: 'fax', label: 'Факс' },
];

export function PhoneLineForm({ phoneLine, onSuccess, onCancel }: PhoneLineFormProps) {
  const isEditing = !!phoneLine;
  const [providers, setProviders] = useState<Provider[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PhoneLineFormData>({
    resolver: zodResolver(phoneLineFormSchema),
    defaultValues: {
      userId: phoneLine?.userId || '',
      providerId: phoneLine?.providerId || '',
      phoneNumber: phoneLine?.phoneNumber || '',
      displayName: phoneLine?.displayName || '',
      capabilities: phoneLine?.capabilities || ['voice'],
      isDefault: phoneLine?.isDefault ?? false,
      isActive: phoneLine?.isActive ?? true,
      forwardingEnabled: phoneLine?.forwardingEnabled ?? false,
      forwardTo: phoneLine?.forwardTo || '',
      forwardOnBusy: phoneLine?.forwardOnBusy ?? true,
      forwardOnNoAnswer: phoneLine?.forwardOnNoAnswer ?? true,
      forwardOnOffline: phoneLine?.forwardOnOffline ?? true,
      forwardAfterRings: phoneLine?.forwardAfterRings ?? 3,
    },
  });

  const forwardingEnabled = watch('forwardingEnabled');
  const capabilities = watch('capabilities');

  useEffect(() => {
    async function fetchData() {
      try {
        const [providersRes, usersRes] = await Promise.all([
          fetch('/api/providers/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: 'telephony', isActive: true }),
          }),
          fetch('/api/users/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: true }),
          }),
        ]);

        const providersData = await providersRes.json();
        const usersData = await usersRes.json();

        setProviders(providersData.providers || []);
        setUsers(usersData.users || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, []);

  const toggleCapability = (cap: string) => {
    const current = capabilities || [];
    if (current.includes(cap)) {
      setValue('capabilities', current.filter(c => c !== cap));
    } else {
      setValue('capabilities', [...current, cap]);
    }
  };

  const onSubmit = async (data: PhoneLineFormData) => {
    try {
      const url = isEditing ? `/api/phone-lines/${phoneLine.id}` : '/api/phone-lines';
      const method = isEditing ? 'PATCH' : 'POST';

      const body = isEditing
        ? {
            displayName: data.displayName,
            capabilities: data.capabilities,
            isDefault: data.isDefault,
            isActive: data.isActive,
            forwardingEnabled: data.forwardingEnabled,
            forwardTo: data.forwardTo || undefined,
            forwardOnBusy: data.forwardOnBusy,
            forwardOnNoAnswer: data.forwardOnNoAnswer,
            forwardOnOffline: data.forwardOnOffline,
            forwardAfterRings: data.forwardAfterRings,
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

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="phone-line-form">
      {errors.root && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      {/* Пользователь */}
      {!isEditing && (
        <FormField
          label="Пользователь"
          htmlFor="userId"
          required
          error={errors.userId?.message}
        >
          <Select
            id="userId"
            {...register('userId')}
            data-testid="phone-line-user-select"
          >
            <option value="">Выберите пользователя...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </Select>
        </FormField>
      )}

      {/* Провайдер */}
      {!isEditing && (
        <FormField
          label="Провайдер"
          htmlFor="providerId"
          required
          error={errors.providerId?.message}
        >
          <Select
            id="providerId"
            {...register('providerId')}
            data-testid="phone-line-provider-select"
          >
            <option value="">Выберите провайдера...</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name} ({provider.type})
              </option>
            ))}
          </Select>
          {providers.length === 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Сначала добавьте провайдера телефонии
            </p>
          )}
        </FormField>
      )}

      {/* Номер телефона */}
      <FormField
        label="Номер телефона"
        htmlFor="phoneNumber"
        required
        error={errors.phoneNumber?.message}
        hint="Формат E.164: +79001234567"
      >
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            id="phoneNumber"
            {...register('phoneNumber')}
            placeholder="+79001234567"
            className="pl-9 font-mono"
            disabled={isEditing}
            error={errors.phoneNumber?.message}
            data-testid="phone-line-number-input"
          />
        </div>
      </FormField>

      {/* Название */}
      <FormField
        label="Название"
        htmlFor="displayName"
        required
        error={errors.displayName?.message}
      >
        <Input
          id="displayName"
          {...register('displayName')}
          placeholder="Рабочий"
          error={errors.displayName?.message}
          data-testid="phone-line-name-input"
        />
      </FormField>

      {/* Возможности */}
      <FormField label="Возможности">
        <div className="flex flex-wrap gap-2">
          {LINE_CAPABILITIES.map((cap) => (
            <button
              key={cap.value}
              type="button"
              onClick={() => toggleCapability(cap.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                capabilities.includes(cap.value)
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
              data-testid={`phone-line-cap-${cap.value}`}
            >
              {cap.label}
            </button>
          ))}
        </div>
      </FormField>

      {/* Переадресация */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            {...register('forwardingEnabled')}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            data-testid="phone-line-forwarding-checkbox"
          />
          <PhoneForwarded className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Включить переадресацию</span>
        </label>

        {forwardingEnabled && (
          <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <FormField
              label="Переадресовывать на"
              htmlFor="forwardTo"
              hint="Номер телефона или SIP URI"
            >
              <Input
                id="forwardTo"
                {...register('forwardTo')}
                placeholder="+79001234567 или sip:user@domain.com"
                className="font-mono"
                data-testid="phone-line-forward-to-input"
              />
            </FormField>

            <FormField
              label="Количество гудков"
              htmlFor="forwardAfterRings"
            >
              <Select
                id="forwardAfterRings"
                {...register('forwardAfterRings', { valueAsNumber: true })}
                data-testid="phone-line-rings-select"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'гудок' : n < 5 ? 'гудка' : 'гудков'} (~{n * 5} сек)
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Переадресовывать когда:</p>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('forwardOnNoAnswer')}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Нет ответа</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('forwardOnBusy')}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Линия занята</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('forwardOnOffline')}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Пользователь оффлайн</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Опции */}
      <div className="flex items-center gap-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('isDefault')}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            data-testid="phone-line-default-checkbox"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">По умолчанию для исходящих</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('isActive')}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            data-testid="phone-line-active-checkbox"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Активна</span>
        </label>
      </div>

      {/* Кнопки */}
      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="submit" fullWidth isLoading={isSubmitting} data-testid="phone-line-submit-button">
          {isEditing ? 'Сохранить' : 'Добавить'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
