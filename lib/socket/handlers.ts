import { Server, Socket } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './types';
import { handleAIMessage, cancelAIStream } from './ai-handler';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// Хранилище активных соединений по userId
const userSockets = new Map<string, Set<string>>();

export function initSocketHandlers(io: TypedServer) {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Инициализируем данные сокета
    socket.data.subscribedChannels = new Set();

    // Аутентификация
    socket.on('auth:login', async (data, callback) => {
      try {
        // TODO: Валидация токена через next-auth
        // Пока просто принимаем токен как userId для демонстрации
        const userId = await validateToken(data.token);

        if (userId) {
          socket.data.userId = userId;

          // Добавляем сокет в комнату пользователя
          socket.join(`user:${userId}`);

          // Сохраняем соединение
          if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
          }
          userSockets.get(userId)!.add(socket.id);

          socket.emit('connection:authenticated', { userId });
          callback({ success: true, userId });

          console.log(`[Socket.IO] User authenticated: ${userId}`);
        } else {
          callback({ success: false, error: 'Invalid token' });
        }
      } catch (error) {
        console.error('[Socket.IO] Auth error:', error);
        callback({ success: false, error: 'Authentication failed' });
      }
    });

    // Подписка на канал
    socket.on('subscribe', (data) => {
      if (!socket.data.userId) {
        socket.emit('error', { message: 'Not authenticated', code: 'AUTH_REQUIRED' });
        return;
      }

      socket.join(data.channel);
      socket.data.subscribedChannels.add(data.channel);
      console.log(`[Socket.IO] ${socket.data.userId} subscribed to ${data.channel}`);
    });

    // Отписка от канала
    socket.on('unsubscribe', (data) => {
      socket.leave(data.channel);
      socket.data.subscribedChannels.delete(data.channel);
    });

    // Chat: присоединение к комнате контакта
    socket.on('chat:join', (data) => {
      if (!socket.data.userId) return;
      socket.join(`chat:${data.contactId}`);
    });

    socket.on('chat:leave', (data) => {
      socket.leave(`chat:${data.contactId}`);
    });

    // Typing индикаторы
    socket.on('chat:typing:start', (data) => {
      if (!socket.data.userId) return;
      socket.to(`chat:${data.contactId}`).emit('chat:typing', {
        contactId: data.contactId,
        isTyping: true,
      });
    });

    socket.on('chat:typing:stop', (data) => {
      if (!socket.data.userId) return;
      socket.to(`chat:${data.contactId}`).emit('chat:typing', {
        contactId: data.contactId,
        isTyping: false,
      });
    });

    // AI Assistant: отправка сообщения
    socket.on('ai:message:send', async (data) => {
      console.log(`[Socket.IO] ai:message:send from user ${socket.data.userId}:`, data);

      if (!socket.data.userId) {
        socket.emit('error', { message: 'Not authenticated', code: 'AUTH_REQUIRED' });
        return;
      }

      try {
        await handleAIMessage({
          userId: socket.data.userId,
          dialogueId: data.dialogueId,
          message: data.message,
        });
      } catch (error) {
        console.error('[Socket.IO] ai:message:send error:', error);
        socket.emit('error', { message: 'Failed to process message', code: 'AI_ERROR' });
      }
    });

    // AI Assistant: отмена стрима
    socket.on('ai:stream:cancel', (data) => {
      if (!socket.data.userId) return;
      cancelAIStream(data.dialogueId);
    });

    // Отключение
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}, reason: ${reason}`);

      if (socket.data.userId) {
        const userSocketSet = userSockets.get(socket.data.userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            userSockets.delete(socket.data.userId);
          }
        }
      }
    });
  });

  console.log('[Socket.IO] Handlers initialized');
}

// Валидация токена (упрощённая версия)
async function validateToken(token: string): Promise<string | null> {
  // TODO: Интегрировать с next-auth для проверки сессии
  // Пока возвращаем токен как userId для тестирования
  if (token && token.length > 0) {
    return token;
  }
  return null;
}

// Утилиты для отправки событий из API routes
export function getIO(): TypedServer | null {
  return (global as any).io || null;
}

export function emitToUser(userId: string, event: keyof ServerToClientEvents, data: any) {
  const io = getIO();
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToRoom(room: string, event: keyof ServerToClientEvents, data: any) {
  const io = getIO();
  if (io) {
    io.to(room).emit(event, data);
  }
}

export function getUserSocketCount(userId: string): number {
  return userSockets.get(userId)?.size || 0;
}
