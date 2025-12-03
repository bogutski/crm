'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ProviderIcon } from './ProviderIcon';
import { ExternalLink, Eye, EyeOff } from 'lucide-react';

interface ProviderMetadata {
  type: string;
  category: string;
  name: string;
  description: string;
  capabilities: string[];
  configFields: ConfigField[];
  documentationUrl?: string;
}

interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'boolean';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
}

interface Provider {
  id: string;
  type: string;
  category: 'telephony' | 'ai_agent';
  name: string;
  description?: string;
  capabilities: string[];
  isDefault: boolean;
  priority: number;
  isActive: boolean;
}

interface ProviderFormProps {
  provider?: Provider;
  category: 'telephony' | 'ai_agent';
  onSuccess: () => void;
  onCancel: () => void;
}

const baseFormSchema = z.object({
  type: z.string().min(1, 'Тип провайдера обязателен'),
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

type BaseFormData = z.infer<typeof baseFormSchema>;

export function ProviderForm({ provider, category, onSuccess, onCancel }: ProviderFormProps) {
  const isEditing = !!provider;
  const [metadata, setMetadata] = useState<Record<string, ProviderMetadata>>({});
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BaseFormData>({
    resolver: zodResolver(baseFormSchema),
    defaultValues: {
      type: provider?.type || '',
      name: provider?.name || '',
      description: provider?.description || '',
      isDefault: provider?.isDefault ?? false,
      isActive: provider?.isActive ?? true,
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const response = await fetch('/api/providers/metadata');
        const data = await response.json();
        setMetadata(data.metadata || {});
      } catch (error) {
        console.error('Error fetching metadata:', error);
      } finally {
        setIsLoadingMetadata(false);
      }
    }
    fetchMetadata();
  }, []);

  // Auto-fill name when type is selected
  useEffect(() => {
    if (selectedType && metadata[selectedType] && !isEditing) {
      setValue('name', metadata[selectedType].name);
    }
  }, [selectedType, metadata, setValue, isEditing]);

  const availableTypes = Object.values(metadata).filter(m => m.category === category);
  const selectedMetadata = selectedType ? metadata[selectedType] : null;

  const handleConfigChange = (key: string, value: string) => {
    setConfigValues(prev => ({ ...prev, [key]: value }));
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const onSubmit = async (data: BaseFormData) => {
    try {
      // Build config object
      const config: Record<string, string> = {};
      if (selectedMetadata) {
        for (const field of selectedMetadata.configFields) {
          if (configValues[field.key]) {
            config[field.key] = configValues[field.key];
          }
        }
      }

      // Validate required config fields
      if (!isEditing && selectedMetadata) {
        for (const field of selectedMetadata.configFields) {
          if (field.required && !config[field.key]) {
            setError('root', { message: `Поле "${field.label}" обязательно` });
            return;
          }
        }
      }

      const url = isEditing ? `/api/providers/${provider.id}` : '/api/providers';
      const method = isEditing ? 'PATCH' : 'POST';

      const body = isEditing
        ? {
            name: data.name,
            description: data.description,
            isDefault: data.isDefault,
            isActive: data.isActive,
            ...(Object.keys(config).length > 0 && { config }),
          }
        : {
            ...data,
            config,
            capabilities: selectedMetadata?.capabilities || [],
          };

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

  if (isLoadingMetadata) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="provider-form">
      {errors.root && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      {/* Выбор типа провайдера */}
      {!isEditing && (
        <FormField
          label="Тип провайдера"
          htmlFor="type"
          required
          error={errors.type?.message}
        >
          <div className="grid grid-cols-2 gap-2">
            {availableTypes.map((meta) => (
              <button
                key={meta.type}
                type="button"
                onClick={() => setValue('type', meta.type)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                  selectedType === meta.type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
                data-testid={`provider-type-${meta.type}`}
              >
                <ProviderIcon type={meta.type} size={40} />
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-50 text-sm">
                    {meta.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {meta.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </FormField>
      )}

      {/* Информация о выбранном провайдере */}
      {selectedMetadata && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <ProviderIcon type={selectedType} size={32} />
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {selectedMetadata.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedMetadata.description}
                </div>
              </div>
            </div>
            {selectedMetadata.documentationUrl && (
              <a
                href={selectedMetadata.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Документация
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedMetadata.capabilities.map((cap) => (
              <span
                key={cap}
                className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded border border-zinc-200 dark:border-zinc-700"
              >
                {getCapabilityLabel(cap)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Основные поля */}
      <FormField label="Название" htmlFor="name" required error={errors.name?.message}>
        <Input
          id="name"
          {...register('name')}
          placeholder="Мой Twilio"
          error={errors.name?.message}
          data-testid="provider-name-input"
        />
      </FormField>

      <FormField label="Описание" htmlFor="description" error={errors.description?.message}>
        <Input
          id="description"
          {...register('description')}
          placeholder="Основной провайдер для исходящих звонков"
          data-testid="provider-description-input"
        />
      </FormField>

      {/* Конфигурация провайдера */}
      {selectedMetadata && selectedMetadata.configFields.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
            Настройки подключения
          </h3>
          {selectedMetadata.configFields.map((field) => (
            <FormField
              key={field.key}
              label={field.label}
              htmlFor={`config-${field.key}`}
              required={field.required && !isEditing}
              hint={field.helpText}
            >
              {field.type === 'select' ? (
                <Select
                  id={`config-${field.key}`}
                  value={configValues[field.key] || ''}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  data-testid={`provider-config-${field.key}`}
                >
                  <option value="">Выберите...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              ) : field.type === 'password' ? (
                <div className="relative">
                  <Input
                    id={`config-${field.key}`}
                    type={showPasswords[field.key] ? 'text' : 'password'}
                    value={configValues[field.key] || ''}
                    onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    placeholder={isEditing ? '••••••••' : field.placeholder}
                    className="pr-10"
                    data-testid={`provider-config-${field.key}`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field.key)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {showPasswords[field.key] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ) : (
                <Input
                  id={`config-${field.key}`}
                  type="text"
                  value={configValues[field.key] || ''}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  data-testid={`provider-config-${field.key}`}
                />
              )}
            </FormField>
          ))}
          {isEditing && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Оставьте поля пустыми, чтобы сохранить текущие значения
            </p>
          )}
        </div>
      )}

      {/* Опции */}
      <div className="flex items-center gap-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('isDefault')}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            data-testid="provider-default-checkbox"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">По умолчанию</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('isActive')}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            data-testid="provider-active-checkbox"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Активен</span>
        </label>
      </div>

      {/* Кнопки */}
      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="submit" fullWidth isLoading={isSubmitting} data-testid="provider-submit-button">
          {isEditing ? 'Сохранить' : 'Добавить'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

function getCapabilityLabel(capability: string): string {
  const labels: Record<string, string> = {
    voice_inbound: 'Входящие',
    voice_outbound: 'Исходящие',
    sms_inbound: 'SMS вход',
    sms_outbound: 'SMS исход',
    mms: 'MMS',
    call_recording: 'Запись',
    call_transfer: 'Перевод',
    warm_transfer: 'Тёплый перевод',
    ivr: 'IVR',
    voicemail: 'Голосовая почта',
    transcription: 'Транскрипция',
    ai_conversation: 'AI диалог',
    sip_trunking: 'SIP',
  };
  return labels[capability] || capability;
}
