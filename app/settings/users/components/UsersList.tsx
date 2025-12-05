'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Shield, ShieldCheck, User, Plus } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { UserForm } from './UserForm';
import { Badge } from '@/components/ui/Badge';

type UserRole = 'admin' | 'manager' | 'user';

interface UserData {
  id: string;
  email: string;
  name: string;
  image?: string;
  roles: UserRole[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  user: 'Пользователь',
};

const roleIcons: Record<UserRole, typeof Shield> = {
  admin: ShieldCheck,
  manager: Shield,
  user: User,
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
};

export function UsersList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchUsers();
  };

  const handleEditSuccess = () => {
    setEditingUser(null);
    fetchUsers();
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/users/${deletingUser.id}`, { method: 'DELETE' });
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          Добавить пользователя
        </button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <p>Пользователи не найдены</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-sm text-zinc-900 dark:text-zinc-50 underline"
          >
            Добавить первого пользователя
          </button>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Роли
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Последний вход
                </th>
                <th className="w-24 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/users/${user.id}`}
                          className="font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                        >
                          {user.name}
                        </Link>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => {
                        const Icon = roleIcons[role];
                        return (
                          <Badge
                            key={role}
                            className={`gap-1 ${roleColors[role]}`}
                            rounded="md"
                          >
                            <Icon className="w-3 h-3" />
                            {roleLabels[role]}
                          </Badge>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={user.isActive ? 'success' : 'default'}
                      rounded="md"
                    >
                      {user.isActive ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Никогда'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        title="Редактировать"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingUser(user)}
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

      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Добавить пользователя"
      >
        <UserForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateOpen(false)} />
      </SlideOver>

      <SlideOver
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Редактировать пользователя"
      >
        {editingUser && (
          <UserForm
            user={editingUser}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingUser(null)}
          />
        )}
      </SlideOver>

      <ConfirmDialog
        isOpen={!!deletingUser}
        title="Удалить пользователя?"
        message={`Вы уверены, что хотите удалить пользователя "${deletingUser?.name}"? Это действие необратимо.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeletingUser(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
