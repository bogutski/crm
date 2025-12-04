'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, Power, PowerOff, Phone, Bot, ExternalLink, RefreshCw } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { ProviderForm } from './ProviderForm';
import { ProviderIcon } from './ProviderIcon';

interface Provider {
  id: string;
  channelId: string;
  type: string;
  category: 'telephony' | 'ai_agent';
  name: string;
  description?: string;
  webhookUrl?: string;
  capabilities: string[];
  isDefault: boolean;
  priority: number;
  isActive: boolean;
  lastHealthCheck?: string;
  healthStatus?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  createdAt: string;
  updatedAt: string;
}

export function ProvidersList() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'telephony' | 'ai_agent'>('telephony');

  const fetchProviders = useCallback(async () => {
    try {
      const response = await fetch('/api/providers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeInactive: true }),
      });
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchProviders();
  };

  const handleEditSuccess = () => {
    setEditingProvider(null);
    fetchProviders();
  };

  const handleDelete = async () => {
    if (!deletingProvider) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/providers/${deletingProvider.id}`, { method: 'DELETE' });
      setDeletingProvider(null);
      fetchProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (provider: Provider) => {
    try {
      await fetch(`/api/providers/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !provider.isActive }),
      });
      fetchProviders();
    } catch (error) {
      console.error('Error toggling provider:', error);
    }
  };

  const handleSetDefault = async (provider: Provider) => {
    try {
      await fetch(`/api/providers/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      fetchProviders();
    } catch (error) {
      console.error('Error setting default provider:', error);
    }
  };

  const filteredProviders = providers.filter(p => p.category === activeTab);

  const getHealthStatusBadge = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Работает</span>;
      case 'degraded':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Нестабилен</span>;
      case 'unhealthy':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Недоступен</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">Не проверен</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  return (
    <>
      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 mb-4">
        <nav className="-mb-px flex gap-4">
          <button
            onClick={() => setActiveTab('telephony')}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'telephony'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            <Phone className="w-4 h-4" />
            Телефония
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-xs">
              {providers.filter(p => p.category === 'telephony').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ai_agent')}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'ai_agent'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            <Bot className="w-4 h-4" />
            AI Агенты
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-xs">
              {providers.filter(p => p.category === 'ai_agent').length}
            </span>
          </button>
        </nav>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
          data-testid="add-provider-button"
        >
          <Plus className="w-5 h-5" />
          Добавить провайдера
        </button>
      </div>

      {filteredProviders.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <p>{activeTab === 'telephony' ? 'Провайдеры телефонии не настроены' : 'AI агенты не настроены'}</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-sm text-zinc-900 dark:text-zinc-50 underline"
          >
            Добавить первого провайдера
          </button>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full" data-testid="providers-table">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Провайдер
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Возможности
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Состояние
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Статус
                </th>
                <th className="w-32 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredProviders.map((provider) => (
                <tr
                  key={provider.id}
                  className={`bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                    !provider.isActive ? 'opacity-50' : ''
                  }`}
                  data-testid={`provider-row-${provider.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProviderIcon type={provider.type} size={32} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {provider.name}
                          </span>
                          {provider.isDefault && (
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                              По умолчанию
                            </span>
                          )}
                        </div>
                        {provider.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {provider.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {provider.capabilities.slice(0, 3).map((cap) => (
                        <span
                          key={cap}
                          className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded"
                        >
                          {getCapabilityLabel(cap)}
                        </span>
                      ))}
                      {provider.capabilities.length > 3 && (
                        <span className="px-1.5 py-0.5 text-zinc-500 dark:text-zinc-400 text-xs">
                          +{provider.capabilities.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getHealthStatusBadge(provider.healthStatus)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(provider)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        provider.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                      data-testid={`provider-toggle-${provider.id}`}
                    >
                      {provider.isActive ? (
                        <>
                          <Power className="w-3 h-3" />
                          Активен
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-3 h-3" />
                          Отключён
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {!provider.isDefault && provider.isActive && (
                        <button
                          onClick={() => handleSetDefault(provider)}
                          className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                          title="Сделать по умолчанию"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingProvider(provider)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        title="Редактировать"
                        data-testid={`provider-edit-${provider.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingProvider(provider)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        title="Удалить"
                        data-testid={`provider-delete-${provider.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Создание провайдера */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Добавить провайдера"
      >
        <ProviderForm
          category={activeTab}
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateOpen(false)}
        />
      </SlideOver>

      {/* Редактирование провайдера */}
      <SlideOver
        isOpen={!!editingProvider}
        onClose={() => setEditingProvider(null)}
        title="Редактировать провайдера"
      >
        {editingProvider && (
          <ProviderForm
            provider={editingProvider}
            category={editingProvider.category}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingProvider(null)}
          />
        )}
      </SlideOver>

      {/* Подтверждение удаления */}
      <ConfirmDialog
        isOpen={!!deletingProvider}
        title="Удалить провайдера?"
        message={`Вы уверены, что хотите удалить провайдера "${deletingProvider?.name}"? Это может повлиять на работу телефонии.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeletingProvider(null)}
        isLoading={isDeleting}
      />
    </>
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
