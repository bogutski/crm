'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Users, Shield, Key, GitBranch, MessageCircle, Settings, Phone, Plug, LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const settingsNavItems: NavItem[] = [
  {
    href: '/settings/general',
    label: 'Общие',
    icon: Settings,
  },
  {
    href: '/settings/pipelines',
    label: 'Воронки',
    icon: GitBranch,
  },
  {
    href: '/settings/dictionaries',
    label: 'Словари',
    icon: BookOpen,
  },
  {
    href: '/settings/channels',
    label: 'Каналы',
    icon: MessageCircle,
  },
  {
    href: '/settings/users',
    label: 'Пользователи',
    icon: Users,
  },
  {
    href: '/settings/roles',
    label: 'Роли',
    icon: Shield,
  },
  {
    href: '/settings/api',
    label: 'API',
    icon: Key,
  },
  {
    href: '/settings/providers',
    label: 'Провайдеры',
    icon: Plug,
  },
  {
    href: '/settings/phone-lines',
    label: 'Телефония',
    icon: Phone,
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 min-h-[calc(100vh-49px)]">
      <nav className="p-4">
        <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
          Настройки
        </h2>
        <ul className="space-y-1">
          {settingsNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
