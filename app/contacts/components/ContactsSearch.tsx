'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface ContactsSearchProps {
  initialSearch?: string;
}

export function ContactsSearch({ initialSearch = '' }: ContactsSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(initialSearch);

  const currentSearch = searchParams.get('search') || '';

  const updateUrl = (search: string) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (search === '') {
      newParams.delete('search');
    } else {
      newParams.set('search', search);
    }
    newParams.delete('page');

    const queryString = newParams.toString();
    router.push(queryString ? `?${queryString}` : '/contacts', { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    updateUrl('');
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Поиск по имени, email, телефону..."
          className="w-full pl-10 pr-10 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {(searchInput || currentSearch) && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}
