'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/contacts', label: 'Контакты' },
  { href: '/opportunities', label: 'Сделки' },
  { href: '/tasks', label: 'Задачи' },
  { href: '/ai-assistant', label: 'AI Ассистент' },
  { href: '/chat', label: 'Чат' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm font-medium transition-all px-3 py-1.5 rounded-full cursor-pointer ${
              isActive
                ? 'text-black dark:text-white bg-zinc-100 dark:bg-zinc-800'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
