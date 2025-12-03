'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/contacts', label: 'Контакты' },
  { href: '/opportunities', label: 'Сделки' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm font-medium transition-colors ${
              isActive
                ? 'text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
