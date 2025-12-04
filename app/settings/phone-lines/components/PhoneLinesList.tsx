'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus, Phone, PhoneForwarded, Power, PowerOff, User, Clock, Settings2 } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { PhoneLineForm } from './PhoneLineForm';
import { ProviderIcon } from '../../providers/components/ProviderIcon';

interface PhoneLine {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  providerId: string;
  providerName?: string;
  providerType?: string;
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
  lastInboundCall?: string;
  lastOutboundCall?: string;
  totalInboundCalls: number;
  totalOutboundCalls: number;
  createdAt: string;
  updatedAt: string;
}

export function PhoneLinesList() {
  const [phoneLines, setPhoneLines] = useState<PhoneLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<PhoneLine | null>(null);
  const [deletingLine, setDeletingLine] = useState<PhoneLine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPhoneLines = useCallback(async () => {
    try {
      const response = await fetch('/api/phone-lines/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeInactive: true }),
      });
      const data = await response.json();
      setPhoneLines(data.lines || []);
    } catch (error) {
      console.error('Error fetching phone lines:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhoneLines();
  }, [fetchPhoneLines]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchPhoneLines();
  };

  const handleEditSuccess = () => {
    setEditingLine(null);
    fetchPhoneLines();
  };

  const handleDelete = async () => {
    if (!deletingLine) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/phone-lines/${deletingLine.id}`, { method: 'DELETE' });
      setDeletingLine(null);
      fetchPhoneLines();
    } catch (error) {
      console.error('Error deleting phone line:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (line: PhoneLine) => {
    try {
      await fetch(`/api/phone-lines/${line.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !line.isActive }),
      });
      fetchPhoneLines();
    } catch (error) {
      console.error('Error toggling phone line:', error);
    }
  };

  const handleSetDefault = async (line: PhoneLine) => {
    try {
      await fetch(`/api/phone-lines/${line.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      fetchPhoneLines();
    } catch (error) {
      console.error('Error setting default phone line:', error);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Simple formatting for E.164 numbers
    if (phone.startsWith('+7') && phone.length === 12) {
      return `+7 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8, 10)}-${phone.slice(10)}`;
    }
    if (phone.startsWith('+1') && phone.length === 12) {
      return `+1 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
    }
    return phone;
  };

  const formatLastCall = (date?: string) => {
    if (!date) return 'Нет вызовов';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн. назад`;
    return d.toLocaleDateString('ru-RU');
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
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
          data-testid="add-phone-line-button"
        >
          <Plus className="w-5 h-5" />
          Добавить линию
        </button>
      </div>

      {phoneLines.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Телефонные линии не настроены</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-sm text-zinc-900 dark:text-zinc-50 underline"
          >
            Добавить первую линию
          </button>
        </div>
      ) : (
        <div className="space-y-4" data-testid="phone-lines-list">
          {phoneLines.map((line) => (
            <div
              key={line.id}
              className={`border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-900 ${
                !line.isActive ? 'opacity-50' : ''
              }`}
              data-testid={`phone-line-card-${line.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Иконка провайдера */}
                  <div className="flex-shrink-0 mt-1">
                    {line.providerType ? (
                      <ProviderIcon type={line.providerType} size={40} />
                    ) : (
                      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-zinc-400" />
                      </div>
                    )}
                  </div>

                  {/* Информация о линии */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-medium text-zinc-900 dark:text-zinc-50">
                        {formatPhoneNumber(line.phoneNumber)}
                      </span>
                      {line.isDefault && (
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                          По умолчанию
                        </span>
                      )}
                      {line.forwardingEnabled && (
                        <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded flex items-center gap-1">
                          <PhoneForwarded className="w-3 h-3" />
                          Переадресация
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {line.displayName}
                      {line.providerName && <span className="text-zinc-400 dark:text-zinc-500"> · {line.providerName}</span>}
                    </div>

                    {/* Статистика и информация о переадресации */}
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {line.userName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {line.userName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Вход: {line.totalInboundCalls} ({formatLastCall(line.lastInboundCall)})
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Исход: {line.totalOutboundCalls} ({formatLastCall(line.lastOutboundCall)})
                      </span>
                    </div>

                    {/* Настройки переадресации */}
                    {line.forwardingEnabled && line.forwardTo && (
                      <div className="mt-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded text-xs">
                        <span className="text-zinc-600 dark:text-zinc-400">Переадресация на: </span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-50">{formatPhoneNumber(line.forwardTo)}</span>
                        <span className="text-zinc-500 dark:text-zinc-400 ml-2">
                          (через {line.forwardAfterRings} гудк.
                          {line.forwardOnBusy && ', занято'}
                          {line.forwardOnNoAnswer && ', нет ответа'}
                          {line.forwardOnOffline && ', оффлайн'})
                        </span>
                      </div>
                    )}

                    {/* Возможности */}
                    <div className="flex gap-1 mt-2">
                      {line.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded uppercase"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Действия */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(line)}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      line.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    data-testid={`phone-line-toggle-${line.id}`}
                  >
                    {line.isActive ? (
                      <>
                        <Power className="w-3 h-3" />
                        Активна
                      </>
                    ) : (
                      <>
                        <PowerOff className="w-3 h-3" />
                        Отключена
                      </>
                    )}
                  </button>

                  {!line.isDefault && line.isActive && (
                    <button
                      onClick={() => handleSetDefault(line)}
                      className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                      title="Сделать по умолчанию"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  )}

                  <Link
                    href={`/settings/phone-lines/${line.id}`}
                    className="p-1.5 text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    title="Правила маршрутизации"
                    data-testid={`phone-line-rules-${line.id}`}
                  >
                    <Settings2 className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => setEditingLine(line)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    title="Редактировать"
                    data-testid={`phone-line-edit-${line.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingLine(line)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    title="Удалить"
                    data-testid={`phone-line-delete-${line.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Создание линии */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Добавить телефонную линию"
      >
        <PhoneLineForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateOpen(false)}
        />
      </SlideOver>

      {/* Редактирование линии */}
      <SlideOver
        isOpen={!!editingLine}
        onClose={() => setEditingLine(null)}
        title="Редактировать телефонную линию"
      >
        {editingLine && (
          <PhoneLineForm
            phoneLine={editingLine}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingLine(null)}
          />
        )}
      </SlideOver>

      {/* Подтверждение удаления */}
      <ConfirmDialog
        isOpen={!!deletingLine}
        title="Удалить телефонную линию?"
        message={`Вы уверены, что хотите удалить линию "${deletingLine?.displayName}" (${deletingLine?.phoneNumber})? Это повлияет на маршрутизацию звонков.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeletingLine(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
