'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

type AIProvider = 'openai' | 'anthropic' | 'google';

interface SystemSettings {
  ai?: {
    activeProvider?: AIProvider;
    providers: {
      openai?: { enabled: boolean; model: string; hasApiKey: boolean };
      anthropic?: { enabled: boolean; model: string; hasApiKey: boolean };
      google?: { enabled: boolean; model: string; hasApiKey: boolean };
    };
  };
}

const aiProviderConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google']),
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  model: z.string().min(1, 'Выберите модель'),
});

type AIProviderConfigData = z.infer<typeof aiProviderConfigSchema>;

const AVAILABLE_MODELS = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o (мощная)', description: 'Лучшая модель для сложных задач' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (экономичная)', description: 'Оптимальная для большинства задач' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Быстрая версия GPT-4' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', description: 'Лучшая модель для аналитики' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', description: 'Быстрая и экономичная' },
  ],
  google: [
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Мощная модель Google' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Самая экономичная модель' },
  ],
};

const PROVIDER_INFO = {
  openai: {
    name: 'OpenAI',
    description: 'GPT-4o и GPT-4o Mini - лучшее соотношение цена/качество',
    apiKeyHelp: 'Получите API ключ на platform.openai.com',
  },
  anthropic: {
    name: 'Anthropic Claude',
    description: 'Claude 3.5 Sonnet - отлично справляется со сложной аналитикой',
    apiKeyHelp: 'Получите API ключ на console.anthropic.com',
  },
  google: {
    name: 'Google Gemini',
    description: 'Gemini Flash - самая экономичная модель',
    apiKeyHelp: 'Получите API ключ на aistudio.google.com',
  },
};

export function AISettingsForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSettings>({});
  const [savedMessage, setSavedMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<AIProviderConfigData>({
    resolver: zodResolver(aiProviderConfigSchema),
    defaultValues: {
      provider: 'openai',
      enabled: true,
      apiKey: '',
      model: 'gpt-4o-mini',
    },
  });

  const currentModel = watch('model');

  // Загрузка текущих настроек
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/system-settings');
        if (response.ok) {
          const data: SystemSettings = await response.json();
          setSettings(data);

          // Если есть активный провайдер, выбираем его
          if (data.ai?.activeProvider) {
            setSelectedProvider(data.ai.activeProvider);
            const providerConfig = data.ai.providers[data.ai.activeProvider];
            if (providerConfig) {
              setValue('provider', data.ai.activeProvider);
              setValue('model', providerConfig.model);
              setValue('enabled', providerConfig.enabled);
            }
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [setValue]);

  // Смена провайдера
  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setValue('provider', provider);

    // Загружаем сохраненные настройки провайдера
    const providerConfig = settings.ai?.providers?.[provider];
    if (providerConfig) {
      setValue('model', providerConfig.model);
      setValue('enabled', providerConfig.enabled);
      setValue('apiKey', ''); // API ключ не загружаем из соображений безопасности
    } else {
      // Дефолтные значения для нового провайдера
      const defaultModel = AVAILABLE_MODELS[provider][0]?.value || '';
      setValue('model', defaultModel);
      setValue('enabled', true);
      setValue('apiKey', '');
    }

    reset({
      provider,
      model: providerConfig?.model || AVAILABLE_MODELS[provider][0]?.value || '',
      enabled: providerConfig?.enabled ?? true,
      apiKey: '',
    }, { keepDirtyValues: false });
  };

  const onSubmit = async (data: AIProviderConfigData) => {
    try {
      setSavedMessage('Проверка API ключа...');

      // Сохраняем конфигурацию провайдера (с валидацией на backend)
      const updateResponse = await fetch('/api/system-settings/ai/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!updateResponse.ok) {
        const responseData = await updateResponse.json();
        setSavedMessage('');
        throw new Error(responseData.details || responseData.error || 'Ошибка сохранения');
      }

      setSavedMessage('Активация провайдера...');

      // Устанавливаем как активного провайдера
      const activateResponse = await fetch('/api/system-settings/ai/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: data.provider }),
      });

      if (!activateResponse.ok) {
        const responseData = await activateResponse.json();
        throw new Error(responseData.error || 'Ошибка активации провайдера');
      }

      // Обновляем локальные настройки
      const updatedSettings = await activateResponse.json();
      setSettings(updatedSettings);

      setSavedMessage('AI провайдер настроен и активирован');
      setTimeout(() => setSavedMessage(''), 3000);

      // Сбрасываем dirty состояние
      reset(data, { keepValues: true });
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Произошла ошибка',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-500 dark:text-zinc-400">Загрузка...</div>
      </div>
    );
  }

  const providerConfig = settings.ai?.providers?.[selectedProvider];
  const isConfigured = providerConfig?.hasApiKey && providerConfig?.enabled;
  const isActive = settings.ai?.activeProvider === selectedProvider;

  return (
    <div className="space-y-8 max-w-3xl">
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

      {/* Выбор провайдера */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Выберите AI провайдера
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {(['openai', 'anthropic', 'google'] as AIProvider[]).map((provider) => {
            const info = PROVIDER_INFO[provider];
            const config = settings.ai?.providers?.[provider];
            const isProviderActive = settings.ai?.activeProvider === provider;
            const isProviderConfigured = config?.hasApiKey && config?.enabled;

            return (
              <button
                key={provider}
                type="button"
                onClick={() => handleProviderChange(provider)}
                className={`relative p-4 rounded-lg border text-left transition-colors ${
                  selectedProvider === provider
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {isProviderActive && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded">
                    Активен
                  </div>
                )}
                {isProviderConfigured && !isProviderActive && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
                    Настроен
                  </div>
                )}
                <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                  {info.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {info.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Форма настройки выбранного провайдера */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-2">
            Настройка {PROVIDER_INFO[selectedProvider].name}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {PROVIDER_INFO[selectedProvider].apiKeyHelp}
          </p>
        </div>

        <input type="hidden" {...register('provider')} />
        <input type="hidden" {...register('enabled')} value="true" />

        <FormField
          label="API Ключ"
          htmlFor="apiKey"
          required={!isConfigured}
          error={errors.apiKey?.message}
        >
          <Input
            id="apiKey"
            {...register('apiKey')}
            type="password"
            placeholder={isConfigured ? '••••••••••••••••' : 'sk-...'}
            error={errors.apiKey?.message}
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {isConfigured
              ? 'API ключ уже сохранен. Оставьте пустым чтобы сохранить текущий, или введите новый для обновления.'
              : 'Введите ваш API ключ от ' + PROVIDER_INFO[selectedProvider].name}
          </p>
        </FormField>

        <FormField label="Модель" htmlFor="model" required error={errors.model?.message}>
          <Select
            id="model"
            {...register('model')}
            error={errors.model?.message}
          >
            {AVAILABLE_MODELS[selectedProvider].map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </Select>
          {currentModel && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {AVAILABLE_MODELS[selectedProvider].find(m => m.value === currentModel)?.description}
            </p>
          )}
        </FormField>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button type="submit" isLoading={isSubmitting}>
            {isActive ? 'Обновить настройки' : 'Сохранить и активировать'}
          </Button>
        </div>
      </form>

      {/* Статус */}
      {settings.ai?.activeProvider && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                AI Ассистент активен
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Используется {PROVIDER_INFO[settings.ai.activeProvider].name}
                {' - '}
                модель {settings.ai.providers[settings.ai.activeProvider]?.model}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
