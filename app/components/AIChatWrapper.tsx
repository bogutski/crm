'use client';

import { AIChat } from './AIChat';
import { usePathname } from 'next/navigation';

/**
 * Wrapper для AI чата, который показывает его только на нужных страницах
 */
export function AIChatWrapper() {
  const pathname = usePathname();

  // Не показываем чат на страницах авторизации
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    return null;
  }

  return <AIChat />;
}
