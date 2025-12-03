'use client';

import { Shield, ShieldCheck, User } from 'lucide-react';

type UserRole = 'admin' | 'manager' | 'user';

interface RoleInfo {
  code: UserRole;
  name: string;
  description: string;
  icon: typeof Shield;
  color: string;
}

const roles: RoleInfo[] = [
  {
    code: 'admin',
    name: 'Администратор',
    description: 'Полный доступ ко всем функциям системы, включая управление пользователями и настройками',
    icon: ShieldCheck,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  {
    code: 'manager',
    name: 'Менеджер',
    description: 'Доступ к работе с контактами, сделками и отчётами',
    icon: Shield,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    code: 'user',
    name: 'Пользователь',
    description: 'Базовый доступ к просмотру и редактированию своих данных',
    icon: User,
    color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
  },
];

export function RolesList() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Системные роли определяют уровень доступа пользователей
      </p>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Код
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Описание
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <tr
                  key={role.code}
                  className="bg-white dark:bg-zinc-900"
                >
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${role.color}`}
                    >
                      <Icon className="w-4 h-4" />
                      {role.name}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                    {role.code}
                  </td>
                  <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {role.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
