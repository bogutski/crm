'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import type { ServerToClientEvents } from '../types';

/**
 * Хук для подписки на события Socket.IO
 *
 * @example
 * // Подписка на новые сообщения чата
 * useSocketEvent('chat:message:new', (data) => {
 *   console.log('New message:', data);
 * });
 *
 * @example
 * // Подписка на стриминг AI
 * useSocketEvent('ai:stream:chunk', (data) => {
 *   setMessage(prev => prev + data.chunk);
 * });
 */
export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K],
  deps: any[] = []
) {
  const { socket, isConnected } = useSocket();

  const stableHandler = useCallback(handler as (...args: any[]) => void, deps);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(event, stableHandler as any);

    return () => {
      socket.off(event, stableHandler as any);
    };
  }, [socket, isConnected, event, stableHandler]);
}

/**
 * Хук для подписки на несколько событий одновременно
 */
export function useSocketEvents(
  events: Partial<{
    [K in keyof ServerToClientEvents]: ServerToClientEvents[K];
  }>
) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const entries = Object.entries(events) as [
      keyof ServerToClientEvents,
      (...args: any[]) => void
    ][];

    entries.forEach(([event, handler]) => {
      socket.on(event, handler as any);
    });

    return () => {
      entries.forEach(([event, handler]) => {
        socket.off(event, handler as any);
      });
    };
  }, [socket, isConnected, events]);
}
