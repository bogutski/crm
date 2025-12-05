'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProviderCard } from './ProviderCard';
import { ProviderForm } from './ProviderForm';
import { TelephonyProviderCode, TelephonyProviderInfo, TelephonyProviderResponse } from '@/modules/telephony/types';

interface ProvidersData {
  providers: TelephonyProviderResponse[];
  available: TelephonyProviderInfo[];
}

export function TelephonyProvidersForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ProvidersData>({ providers: [], available: [] });
  const [selectedProvider, setSelectedProvider] = useState<TelephonyProviderCode | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadProviders = useCallback(async () => {
    try {
      const response = await fetch('/api/telephony/providers');
      if (response.ok) {
        const result: ProvidersData = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      setMessage({ type: 'error', text: 'Ошибка загрузки провайдеров' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleSelectProvider = (code: TelephonyProviderCode) => {
    setSelectedProvider(code);
    setMessage(null);
  };

  const handleCloseForm = () => {
    setSelectedProvider(null);
  };

  const handleSaveSuccess = () => {
    setMessage({ type: 'success', text: 'Провайдер сохранён' });
    loadProviders();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleActivate = async (providerId: string) => {
    try {
      const response = await fetch(`/api/telephony/providers/${providerId}/activate`, {
        method: 'POST',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Провайдер активирован' });
        loadProviders();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Ошибка активации' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка активации провайдера' });
    }
  };

  const handleDeactivate = async (providerId: string) => {
    try {
      const response = await fetch(`/api/telephony/providers/${providerId}/activate`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Провайдер деактивирован' });
        loadProviders();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Ошибка деактивации' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка деактивации провайдера' });
    }
  };

  const handleTest = async (providerId: string) => {
    try {
      setMessage({ type: 'success', text: 'Проверка подключения...' });

      const response = await fetch(`/api/telephony/providers/${providerId}/test`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        const balanceInfo = result.accountInfo?.balance !== undefined
          ? ` (баланс: ${result.accountInfo.balance} ${result.accountInfo.currency || ''})`
          : '';
        setMessage({ type: 'success', text: `Подключение успешно${balanceInfo}` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Ошибка подключения' });
      }

      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка проверки подключения' });
    }
  };

  const handleDelete = async (providerId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого провайдера?')) {
      return;
    }

    try {
      const response = await fetch(`/api/telephony/providers/${providerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Провайдер удалён' });
        loadProviders();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Ошибка удаления' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка удаления провайдера' });
    }
  };

  // Находим выбранного провайдера в списке настроенных или доступных
  const getSelectedProviderData = () => {
    if (!selectedProvider) return null;

    const configured = data.providers.find(p => p.code === selectedProvider);
    if (configured) {
      return { provider: configured, isNew: false };
    }

    const available = data.available.find(p => p.code === selectedProvider);
    if (available) {
      return { provider: null, info: available, isNew: true };
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-500 dark:text-zinc-400">Загрузка...</div>
      </div>
    );
  }

  const selectedData = getSelectedProviderData();

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-3 text-sm rounded-lg ${
            message.type === 'success'
              ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
              : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Настроенные провайдеры */}
      {data.providers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Настроенные провайдеры
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.providers.map((provider) => (
              <ProviderCard
                key={provider._id}
                provider={provider}
                onConfigure={() => handleSelectProvider(provider.code)}
                onActivate={() => handleActivate(provider._id)}
                onDeactivate={() => handleDeactivate(provider._id)}
                onTest={() => handleTest(provider._id)}
                onDelete={() => handleDelete(provider._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Доступные провайдеры */}
      {data.available.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Добавить провайдера
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.available.map((info) => (
              <button
                key={info.code}
                type="button"
                onClick={() => handleSelectProvider(info.code)}
                className="p-4 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors"
              >
                <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                  {info.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {info.description}
                </div>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  + Подключить
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Форма настройки */}
      {selectedProvider && selectedData && (
        <ProviderForm
          providerCode={selectedProvider}
          existingProvider={selectedData.isNew ? undefined : selectedData.provider!}
          onClose={handleCloseForm}
          onSuccess={handleSaveSuccess}
        />
      )}

      {/* Пустое состояние */}
      {data.providers.length === 0 && data.available.length === 0 && (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          Нет доступных провайдеров телефонии
        </div>
      )}
    </div>
  );
}
