'use client';

import { ReactNode } from 'react';
import { SocketProvider } from '@/lib/socket/client';

interface SocketWrapperProps {
  children: ReactNode;
  userId?: string;
}

export function SocketWrapper({ children, userId }: SocketWrapperProps) {
  return (
    <SocketProvider authToken={userId}>
      {children}
    </SocketProvider>
  );
}
