'use client';

import Link from 'next/link';
import { Settings, FileText, Home } from 'lucide-react';
import { Navigation } from './Navigation';
import { UserMenu } from './UserMenu';
import { GlobalSearch } from './GlobalSearch';

interface HeaderProps {
  userName?: string | null;
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-8">
        <Link href="/" className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
          <Home className="w-5 h-5" />
        </Link>
        <Navigation />
      </div>
      <div className="flex items-center gap-4">
        <GlobalSearch />
        <Link
          href="/docs"
          className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          title="API Документация"
          target="_blank"
        >
          <FileText className="w-5 h-5" />
        </Link>
        <Link
          href="/settings"
          className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          title="Настройки"
        >
          <Settings className="w-5 h-5" />
        </Link>
        <UserMenu userName={userName} />
      </div>
    </header>
  );
}
