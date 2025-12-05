'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: TypedSocket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  connect: () => void;
  disconnect: () => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
  children: ReactNode;
  authToken?: string;
}

export function SocketProvider({ children, authToken }: SocketProviderProps) {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (socket?.connected) return;

    const newSocket: TypedSocket = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setIsConnected(true);

      // Автоматическая аутентификация при наличии токена
      if (authToken) {
        newSocket.emit('auth:login', { token: authToken }, (response) => {
          if (response.success) {
            setIsAuthenticated(true);
            setUserId(response.userId || null);
            console.log('[Socket] Authenticated:', response.userId);
          } else {
            console.error('[Socket] Auth failed:', response.error);
          }
        });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      setIsAuthenticated(false);
    });

    newSocket.on('connection:authenticated', (data) => {
      setIsAuthenticated(true);
      setUserId(data.userId);
    });

    newSocket.on('error', (data) => {
      console.error('[Socket] Error:', data.message, data.code);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [authToken, socket?.connected]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
      setIsAuthenticated(false);
      setUserId(null);
    }
  }, [socket]);

  const subscribe = useCallback(
    (channel: string) => {
      if (socket && isAuthenticated) {
        socket.emit('subscribe', { channel });
      }
    },
    [socket, isAuthenticated]
  );

  const unsubscribe = useCallback(
    (channel: string) => {
      if (socket) {
        socket.emit('unsubscribe', { channel });
      }
    },
    [socket]
  );

  // Автоподключение при наличии токена
  useEffect(() => {
    if (authToken && !socket) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [authToken]);

  const value: SocketContextValue = {
    socket,
    isConnected,
    isAuthenticated,
    userId,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
