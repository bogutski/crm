'use client';

import { useEffect, useState } from 'react';
import { Search, User } from 'lucide-react';

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
}

export function ChatContactList({ selectedContactId, onSelectContact }: ChatContactListProps) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/chat/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching chat contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Listen for new messages to refresh the list
  useEffect(() => {
    const handleMessagesUpdated = () => {
      fetchContacts();
    };

    window.addEventListener('messagesUpdated', handleMessagesUpdated);
    return () => window.removeEventListener('messagesUpdated', handleMessagesUpdated);
  }, []);

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.lastMessage?.toLowerCase().includes(query)
    );
  });

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
            className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
        </div>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {searchQuery ? 'Контакты не найдены' : 'Нет контактов с перепиской'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredContacts.map((contact) => {
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
          </div>
        )}
      </div>
    </div>
  );
}
