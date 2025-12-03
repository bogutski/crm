'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, Power, PowerOff } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { ChannelForm } from './ChannelForm';
import { ChannelIcon } from './ChannelIcon';

interface Channel {
  id: string;
  code: string;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export function ChannelsList() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchChannels = useCallback(async () => {
    try {
      const response = await fetch('/api/channels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeInactive: true }),
      });
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchChannels();
  };

  const handleEditSuccess = () => {
    setEditingChannel(null);
    fetchChannels();
  };

  const handleDelete = async () => {
    if (!deletingChannel) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/channels/${deletingChannel.id}`, { method: 'DELETE' });
      setDeletingChannel(null);
      fetchChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (channel: Channel) => {
    try {
      await fetch(`/api/channels/${channel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !channel.isActive }),
      });
      fetchChannels();
    } catch (error) {
      console.error('Error toggling channel:', error);
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
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Создать канал
        </button>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <p>Каналы пока не созданы</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-sm text-zinc-900 dark:text-zinc-50 underline"
          >
            Создать первый канал
          </button>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Канал
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Код
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Статус
                </th>
                <th className="w-32 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {channels.map((channel) => (
                <tr
                  key={channel.id}
                  className={`bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                    !channel.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: channel.color + '20' }}
                      >
                        <ChannelIcon name={channel.icon} color={channel.color} size={18} />
                      </div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {channel.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                    {channel.code}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(channel)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        channel.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {channel.isActive ? (
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
                      <button
                        onClick={() => setEditingChannel(channel)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        title="Редактировать"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingChannel(channel)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        title="Удалить"
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

      {/* Создание канала */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Создать канал"
      >
        <ChannelForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateOpen(false)} />
      </SlideOver>

      {/* Редактирование канала */}
      <SlideOver
        isOpen={!!editingChannel}
        onClose={() => setEditingChannel(null)}
        title="Редактировать канал"
      >
        {editingChannel && (
          <ChannelForm
            channel={editingChannel}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingChannel(null)}
          />
        )}
      </SlideOver>

      {/* Подтверждение удаления */}
      <ConfirmDialog
        isOpen={!!deletingChannel}
        title="Удалить канал?"
        message={`Вы уверены, что хотите удалить канал "${deletingChannel?.name}"? Это действие необратимо.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeletingChannel(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
