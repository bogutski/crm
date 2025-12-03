'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { SearchResultsSidebar } from './SearchResultsSidebar';

export interface SearchResults {
  contacts: {
    items: Array<{ id: string; name: string; company?: string; email?: string }>;
    total: number;
  };
  opportunities: {
    items: Array<{ id: string; name?: string; amount?: number; stage?: string }>;
    total: number;
  };
  tasks: {
    items: Array<{ id: string; title: string; status: string; dueDate?: Date }>;
    total: number;
  };
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults(null);
  };

  // Keyboard shortcut Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Trigger button in header */}
      <button
        onClick={handleOpen}
        className="
          flex items-center gap-2
          w-64 px-3 py-1.5
          text-sm text-left
          border rounded-lg
          bg-zinc-50 dark:bg-zinc-800
          text-zinc-400 dark:text-zinc-500
          border-zinc-200 dark:border-zinc-700
          hover:bg-zinc-100 dark:hover:bg-zinc-700
          hover:border-zinc-300 dark:hover:border-zinc-600
          transition-colors
          cursor-pointer
        "
      >
        <Search className="w-4 h-4" />
        <span>Поиск... (⌘K)</span>
      </button>

      <SearchResultsSidebar
        isOpen={isOpen}
        onClose={handleClose}
        results={results}
        query={query}
        onQueryChange={handleQueryChange}
        isLoading={isLoading}
      />
    </>
  );
}
