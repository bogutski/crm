'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Shield, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { UserStats } from './UserStats';

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

interface UserViewProps {
  userId: string;
}

export function UserView({ userId }: UserViewProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Пользователь не найден');
            return;
          }
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-red-500 text-center mb-4">{error || 'Пользователь не найден'}</p>
        <Link
          href="/settings/users"
          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к списку пользователей
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-6 overflow-y-auto">
      {/* Header with avatar, name, status and roles */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-14 h-14 rounded-full"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <User className="w-7 h-7 text-zinc-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {user.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={user.isActive ? 'success' : 'default'}
                rounded="md"
              >
                {user.isActive ? 'Активен' : 'Неактивен'}
              </Badge>
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
          </div>
        </div>

        <Link
          href="/settings/users"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4" />
          К списку
        </Link>
      </div>

      {/* Compact info table */}
      <table className="text-sm">
        <tbody>
          <tr className="h-7">
            <td className="pr-4 text-zinc-500 dark:text-zinc-400 w-40 align-middle">
              Email
            </td>
            <td className="text-zinc-900 dark:text-zinc-100 align-middle">
              <a
                href={`mailto:${user.email}`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {user.email}
              </a>
            </td>
          </tr>
          <tr className="h-7">
            <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
              Последний вход
            </td>
            <td className="text-zinc-900 dark:text-zinc-100 align-middle">
              {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : <span className="text-zinc-400">—</span>}
            </td>
          </tr>
          <tr className="h-7">
            <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
              Дата регистрации
            </td>
            <td className="text-zinc-900 dark:text-zinc-100 align-middle">
              {formatDateTime(user.createdAt)}
            </td>
          </tr>
          <tr className="h-7">
            <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
              Обновлено
            </td>
            <td className="text-zinc-900 dark:text-zinc-100 align-middle">
              {formatDateTime(user.updatedAt)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Analytics and Stats */}
      <UserStats userId={userId} />
    </div>
  );
}
