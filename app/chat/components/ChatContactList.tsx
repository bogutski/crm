'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, User, Loader2 } from 'lucide-react';

interface Email {
  address: string;
  isVerified: boolean;
  isSubscribed: boolean;
}

interface Phone {
  e164: string;
  international: string;
  country: string;
  type: string;
  isPrimary: boolean;
  isVerified: boolean;
  isSubscribed: boolean;
}

export interface ChatContact {
  id: string;
  contactId: string;
  name: string;
  company?: string;
  position?: string;
  emails?: Email[];
  phones?: Phone[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface ChatContactListProps {
  selectedContactId: string | null;
  onSelectContact: (contact: ChatContact) => void;
  initialContactId?: string | null;
}

const CONTACTS_PER_PAGE = 20;

export function ChatContactList({ selectedContactId, onSelectContact, initialContactId }: ChatContactListProps) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialContactHandled, setInitialContactHandled] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    // Show searching indicator immediately when user types
    if (searchQuery !== debouncedSearch) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  // Reset pagination when search changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [debouncedSearch]);

  const fetchContacts = useCallback(async (pageNum: number, search: string, append: boolean = false, isInitial: boolean = false, priorityId?: string | null) => {
    // Only show full loading state on initial load (not during search)
    if (isInitial) {
      setLoading(true);
    } else if (pageNum > 1) {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: CONTACTS_PER_PAGE.toString(),
      });
      if (search) {
        params.set('search', search);
      }
      // Pass priority contact ID on first page to ensure it's included
      if (pageNum === 1 && priorityId) {
        params.set('priorityContactId', priorityId);
      }

      const response = await fetch(`/api/chat/contacts?${params}`);
      if (response.ok) {
        const data = await response.json();
        const newContacts = data.contacts || [];

        if (append) {
          // Filter out duplicates when appending
          setContacts(prev => {
            const existingIds = new Set(prev.map(c => c.contactId));
            const uniqueNewContacts = newContacts.filter((c: ChatContact) => !existingIds.has(c.contactId));
            return [...prev, ...uniqueNewContacts];
          });
        } else {
          setContacts(newContacts);
        }

        setHasMore(data.hasMore ?? false);
      }
    } catch (error) {
      console.error('Error fetching chat contacts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsSearching(false);
    }
  }, []);

  // Initial load
  const isInitialLoad = useRef(true);
  useEffect(() => {
    // Pass initialContactId on first load to ensure it's included in results
    fetchContacts(1, debouncedSearch, false, isInitialLoad.current, isInitialLoad.current ? initialContactId : null);
    isInitialLoad.current = false;
  }, [debouncedSearch, fetchContacts, initialContactId]);

  // Load more when page changes (except initial)
  useEffect(() => {
    if (page > 1) {
      fetchContacts(page, debouncedSearch, true, false, null);
    }
  }, [page, debouncedSearch, fetchContacts]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !isSearching) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadingMore, isSearching]);

  // Listen for new messages to refresh the list
  useEffect(() => {
    const handleMessagesUpdated = () => {
      setPage(1);
      setHasMore(true);
      fetchContacts(1, debouncedSearch, false, false);
    };

    window.addEventListener('messagesUpdated', handleMessagesUpdated);
    return () => window.removeEventListener('messagesUpdated', handleMessagesUpdated);
  }, [debouncedSearch, fetchContacts]);

  // Auto-select contact from URL after initial load
  useEffect(() => {
    if (!initialContactHandled && initialContactId && contacts.length > 0 && !loading) {
      const contact = contacts.find(c => c.contactId === initialContactId);
      if (contact) {
        onSelectContact(contact);
      }
      setInitialContactHandled(true);
    }
  }, [initialContactId, contacts, loading, initialContactHandled, onSelectContact]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    }

    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 && !loading && !isSearching ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {searchQuery ? 'Контакты не найдены' : 'Нет контактов с перепиской'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {contacts.map((contact) => {
              const isSelected = selectedContactId === contact.contactId;
              return (
                <button
                  key={contact.contactId}
                  onClick={() => onSelectContact(contact)}
                  className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 bg-zinc-100 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium truncate ${
                        contact.unreadCount > 0
                          ? 'text-zinc-900 dark:text-zinc-50'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}>
                        {contact.name}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                        {formatTime(contact.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`text-sm truncate ${
                        contact.unreadCount > 0
                          ? 'text-zinc-600 dark:text-zinc-300'
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}>
                        {truncateMessage(contact.lastMessage)}
                      </span>
                      {contact.unreadCount > 0 && (
                        <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-blue-500 rounded-full">
                          {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Load more trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex items-center justify-center py-4">
                {loadingMore && (
                  <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
