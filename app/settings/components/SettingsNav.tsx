'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const settingsNavItems = [
  { href: '/settings', label: 'Общие' },
  { href: '/settings/profile', label: 'Профиль' },
  { href: '/settings/dictionaries', label: 'Словари' },
  { href: '/settings/notifications', label: 'Уведомления' },
  { href: '/settings/security', label: 'Безопасность' },
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
            const isActive = item.href === '/settings'
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50'
                  }`}
                >
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
