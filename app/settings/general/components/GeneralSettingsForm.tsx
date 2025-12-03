'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

const currencyPositionSchema = z.enum(['before', 'after']);

const generalSettingsFormSchema = z.object({
  currency: z.string()
    .min(3, 'Код валюты должен содержать 3 символа')
    .max(3, 'Код валюты должен содержать 3 символа')
    .toUpperCase(),
  currencySymbol: z.string()
    .min(1, 'Введите символ валюты')
    .max(5, 'Символ валюты слишком длинный'),
  currencyPosition: currencyPositionSchema,
});

type GeneralSettingsFormData = z.infer<typeof generalSettingsFormSchema>;

// Популярные валюты для быстрого выбора
const popularCurrencies = [
  { code: 'RUB', symbol: '₽', position: 'after' as const, name: 'Российский рубль' },
  { code: 'USD', symbol: '$', position: 'before' as const, name: 'Доллар США' },
  { code: 'EUR', symbol: '€', position: 'before' as const, name: 'Евро' },
  { code: 'GBP', symbol: '£', position: 'before' as const, name: 'Британский фунт' },
  { code: 'KZT', symbol: '₸', position: 'after' as const, name: 'Казахстанский тенге' },
  { code: 'BYN', symbol: 'Br', position: 'after' as const, name: 'Белорусский рубль' },
  { code: 'UAH', symbol: '₴', position: 'after' as const, name: 'Украинская гривна' },
  { code: 'CNY', symbol: '¥', position: 'before' as const, name: 'Китайский юань' },
];

export function GeneralSettingsForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsFormSchema),
    defaultValues: {
      currency: 'RUB',
      currencySymbol: '₽',
      currencyPosition: 'after',
    },
  });

  const currency = watch('currency');
  const currencySymbol = watch('currencySymbol');
  const currencyPosition = watch('currencyPosition');

  // Загрузка текущих настроек
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/system-settings');
        if (response.ok) {
          const data = await response.json();
          setValue('currency', data.currency);
          setValue('currencySymbol', data.currencySymbol);
          setValue('currencyPosition', data.currencyPosition);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [setValue]);

  // Выбор популярной валюты
  const handleCurrencySelect = (code: string) => {
    const selected = popularCurrencies.find((c) => c.code === code);
    if (selected) {
      setValue('currency', selected.code, { shouldDirty: true });
      setValue('currencySymbol', selected.symbol, { shouldDirty: true });
      setValue('currencyPosition', selected.position, { shouldDirty: true });
    }
  };

  const onSubmit = async (data: GeneralSettingsFormData) => {
    try {
      const response = await fetch('/api/system-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Ошибка сохранения');
      }

      setSavedMessage('Настройки сохранены');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Произошла ошибка',
      });
    }
  };

  // Форматирование примера суммы
  const formatExampleAmount = () => {
    const amount = '1 234,56';
    if (currencyPosition === 'before') {
      return `${currencySymbol}${amount}`;
    }
    return `${amount} ${currencySymbol}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-500 dark:text-zinc-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-xl">
      {errors.root && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {errors.root.message}
        </div>
      )}

      {savedMessage && (
        <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg">
          {savedMessage}
        </div>
      )}

      {/* Секция валюты */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Валюта
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Выберите валюту, которая будет использоваться в системе для отображения сумм
        </p>

        {/* Быстрый выбор валюты */}
        <div className="grid grid-cols-4 gap-2">
          {popularCurrencies.map((curr) => (
            <button
              key={curr.code}
              type="button"
              onClick={() => handleCurrencySelect(curr.code)}
              className={`p-3 rounded-lg border text-center transition-colors ${
                currency === curr.code
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="text-lg font-semibold">{curr.symbol}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{curr.code}</div>
            </button>
          ))}
        </div>

        {/* Ручной ввод */}
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Код валюты" htmlFor="currency" required error={errors.currency?.message}>
            <Input
              id="currency"
              {...register('currency')}
              placeholder="RUB"
              maxLength={3}
              className="uppercase"
              error={errors.currency?.message}
            />
          </FormField>

          <FormField label="Символ" htmlFor="currencySymbol" required error={errors.currencySymbol?.message}>
            <Input
              id="currencySymbol"
              {...register('currencySymbol')}
              placeholder="₽"
              maxLength={5}
              error={errors.currencySymbol?.message}
            />
          </FormField>

          <FormField label="Позиция" htmlFor="currencyPosition" error={errors.currencyPosition?.message}>
            <Select
              id="currencyPosition"
              {...register('currencyPosition')}
              error={errors.currencyPosition?.message}
            >
              <option value="before">До суммы ($100)</option>
              <option value="after">После суммы (100₽)</option>
            </Select>
          </FormField>
        </div>

        {/* Предпросмотр */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
          <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
            Пример отображения:
          </div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatExampleAmount()}
          </div>
        </div>
      </div>

      {/* Кнопка сохранения */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
          Сохранить настройки
        </Button>
      </div>
    </form>
  );
}
