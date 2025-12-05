// Типы событий Socket.IO

// События от сервера к клиенту
export interface ServerToClientEvents {
  // AI Assistant события
  'ai:stream:start': (data: { dialogueId: string }) => void;
  'ai:stream:chunk': (data: { dialogueId: string; chunk: string }) => void;
  'ai:stream:end': (data: { dialogueId: string; fullMessage: string }) => void;
  'ai:stream:error': (data: { dialogueId: string; error: string }) => void;
  'ai:tool:call': (data: {
    dialogueId: string;
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
  }) => void;
  'ai:tool:result': (data: {
    dialogueId: string;
    toolCallId: string;
    result: unknown;
    error?: string;
  }) => void;

  // Chat события (общение с контактами)
  'chat:message:new': (data: ChatMessageEvent) => void;
  'chat:message:read': (data: { contactId: string; messageIds: string[] }) => void;
  'chat:typing': (data: { contactId: string; isTyping: boolean }) => void;

  // Общие уведомления
  'notification:new': (data: NotificationEvent) => void;

  // Системные события
  'connection:authenticated': (data: { userId: string }) => void;
  'error': (data: { message: string; code?: string }) => void;
}

// События от клиента к серверу
export interface ClientToServerEvents {
  // Аутентификация
  'auth:login': (data: { token: string }, callback: (response: AuthResponse) => void) => void;

  // AI Assistant
  'ai:message:send': (data: { dialogueId?: string; message: string }) => void;
  'ai:stream:cancel': (data: { dialogueId: string }) => void;

  // Chat
  'chat:join': (data: { contactId: string }) => void;
  'chat:leave': (data: { contactId: string }) => void;
  'chat:typing:start': (data: { contactId: string }) => void;
  'chat:typing:stop': (data: { contactId: string }) => void;

  // Подписки на каналы
  'subscribe': (data: { channel: string }) => void;
  'unsubscribe': (data: { channel: string }) => void;
}

// Межсерверные события (для масштабирования с Redis)
export interface InterServerEvents {
  ping: () => void;
}

// Данные сокета
export interface SocketData {
  userId?: string;
  sessionId?: string;
  subscribedChannels: Set<string>;
}

// Вспомогательные типы
export interface ChatMessageEvent {
  id: string;
  contactId: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  channel: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface NotificationEvent {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  link?: string;
  timestamp: string;
}

export interface AuthResponse {
  success: boolean;
  userId?: string;
  error?: string;
}
