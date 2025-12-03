'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  Send,
  Filter,
  Check,
  CheckCheck,
  Smartphone,
  MessageCircle,
  Video,
  Globe,
  Camera,
  AtSign,
  Briefcase,
  Hash,
  PhoneCall,
  PhoneIncoming,
} from 'lucide-react';

// Map channel codes to icons
const CHANNEL_ICON_MAP: Record<string, React.ElementType> = {
  sms: Smartphone,
  email: Mail,
  phone: PhoneCall,
  callback: PhoneIncoming,
  telegram: Send,
  whatsapp: MessageCircle,
  facebook: MessageSquare,
  instagram: Camera,
  twitter: AtSign,
  linkedin: Briefcase,
  slack: Hash,
  webchat: Globe,
  zoom: Video,
  meet: Video,
  imessage: MessageCircle,
};

type InteractionDirection = 'inbound' | 'outbound';
type InteractionStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

interface Channel {
  id: string;
  code: string;
  name: string;
  icon: string;
  color: string;
}

interface Interaction {
  id: string;
  channelId: string;
  contactId: string;
  direction: InteractionDirection;
  status: InteractionStatus;
  subject?: string;
  content: string;
  createdAt: string;
  channel?: Channel;
}

interface TimelineProps {
  contactId: string;
}

/**
 * Timeline - универсальный компонент для отображения истории взаимодействий с контактом
 *
 * Используется в:
 * - Карточке контакта (ContactContent)
 * - Карточке сделки (OpportunityContent)
 *
 * Функционал:
 * - Отображение переписки в чат-виде (входящие слева, исходящие справа)
 * - Группировка по дням
 * - Фильтрация по каналам
 * - Отправка сообщений через выбранный канал
 */
export function Timeline({ contactId }: TimelineProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch all channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch('/api/channels/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (response.ok) {
          const data = await response.json();
          const channels = data.channels || [];
          setAllChannels(channels);
          // Set first channel as active by default
          if (channels.length > 0 && !activeChannel) {
            setActiveChannel(channels[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching channels:', err);
      }
    };
    fetchChannels();
  }, []);

  // Fetch interactions
  useEffect(() => {
    const fetchInteractions = async () => {
      if (!contactId) {
        setInteractions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/interactions/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch interactions');
        }

        const data = await response.json();
        // Sort by createdAt ascending for chat view (oldest first)
        const sorted = (data.interactions || []).sort(
          (a: Interaction, b: Interaction) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setInteractions(sorted);
      } catch (err) {
        console.error('Error fetching interactions:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [contactId]);

  // Scroll to bottom when messages load or new message added
  useEffect(() => {
    if (!loading && interactions.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading, interactions.length]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [messageText]);

  const filteredInteractions = useMemo(() => {
    if (selectedChannels.size === 0) return interactions;
    return interactions.filter(i => i.channel && selectedChannels.has(i.channel.code));
  }, [interactions, selectedChannels]);

  const toggleChannelFilter = (channelCode: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(channelCode)) {
        next.delete(channelCode);
      } else {
        next.add(channelCode);
      }
      return next;
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Interaction[] }[] = [];
    let currentDate = '';

    for (const msg of filteredInteractions) {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.createdAt, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }

    return groups;
  }, [filteredInteractions]);

  const availableChannels = useMemo(() => {
    const channelMap = new Map<string, Channel>();
    interactions.forEach(i => {
      if (i.channel) {
        channelMap.set(i.channel.code, i.channel);
      }
    });
    return Array.from(channelMap.values());
  }, [interactions]);

  const getStatusIcon = (status: InteractionStatus) => {
    switch (status) {
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-zinc-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-zinc-400" />;
      case 'pending':
        return <div className="w-3 h-3 rounded-full border border-zinc-300 dark:border-zinc-600" />;
      case 'failed':
        return <div className="w-3 h-3 rounded-full bg-red-500" />;
      default:
        return null;
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeChannel || !contactId || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: activeChannel.id,
          contactId,
          direction: 'outbound',
          status: 'sent',
          content: messageText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newInteraction = await response.json();
      setInteractions(prev => [...prev, newInteraction]);
      setMessageText('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 p-6">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4 flex-shrink-0">
          Переписка
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1 min-h-0 p-6">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4 flex-shrink-0">
          Переписка
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header with filters */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Переписка
        </h2>
        {availableChannels.length > 1 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-md transition-colors ${
              showFilters || selectedChannels.size > 0
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && availableChannels.length > 1 && (
        <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          {availableChannels.map(channel => {
            const isSelected = selectedChannels.has(channel.code);
            return (
              <button
                key={channel.code}
                onClick={() => toggleChannelFilter(channel.code)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  isSelected
                    ? 'text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
                style={isSelected ? { backgroundColor: channel.color } : undefined}
              >
                {channel.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {interactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
              Нет сообщений
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-[200px]">
              Начните переписку с контактом
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMessages.map((group, groupIdx) => (
              <div key={groupIdx}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDate(group.date)}
                  </span>
                </div>

                {/* Messages for this date */}
                <div className="space-y-2">
                  {group.messages.map((msg) => {
                    const isOutgoing = msg.direction === 'outbound';
                    const channelColor = msg.channel?.color || '#6b7280';
                    const ChannelIcon = msg.channel ? (CHANNEL_ICON_MAP[msg.channel.code] || MessageSquare) : MessageSquare;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Channel icon for incoming (left side) */}
                        {!isOutgoing && (
                          <div
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${channelColor}20` }}
                          >
                            <ChannelIcon className="w-3.5 h-3.5" style={{ color: channelColor }} />
                          </div>
                        )}

                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isOutgoing
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-zinc-900 dark:text-zinc-100 rounded-br-md'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md'
                          }`}
                        >
                          {/* Message content */}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>

                          {/* Time and status */}
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isOutgoing ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              {formatTime(msg.createdAt)}
                            </span>
                            {isOutgoing && getStatusIcon(msg.status)}
                          </div>
                        </div>

                        {/* Channel icon for outgoing (right side) */}
                        {isOutgoing && (
                          <div
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${channelColor}20` }}
                          >
                            <ChannelIcon className="w-3.5 h-3.5" style={{ color: channelColor }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input area */}
      <div className="flex-shrink-0 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/80">
        {/* Channel tabs */}
        <div className="flex flex-wrap items-center gap-1.5 px-5 pt-3 pb-4">
          {allChannels.map(channel => {
            const isActive = activeChannel?.id === channel.id;
            const IconComponent = CHANNEL_ICON_MAP[channel.code] || MessageSquare;
            return (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium whitespace-nowrap transition-all rounded border ${
                  isActive
                    ? 'border-transparent text-white shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
                style={isActive ? { backgroundColor: channel.color } : undefined}
              >
                <IconComponent className="w-3.5 h-3.5" />
                {channel.name}
              </button>
            );
          })}
        </div>

        {/* Text input */}
        <div className="flex items-end gap-3 px-5 pb-5">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeChannel ? `Написать в ${activeChannel.name}...` : 'Выберите канал...'}
            disabled={!activeChannel || sending}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || !activeChannel || sending}
            className="flex-shrink-0 px-4 py-3 rounded-lg bg-blue-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
          >
            <Send className="w-4 h-4" />
            <span>Отправить</span>
          </button>
        </div>
      </div>
    </div>
  );
}
