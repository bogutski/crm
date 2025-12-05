'use client';

import { ReactNode, CSSProperties } from 'react';
import { getBadgeColors } from '@/lib/color-utils';

type BadgeVariant =
  | 'default'
  | 'dark'
  | 'red'
  | 'green'
  | 'yellow'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'blue'
  // Алиасы для обратной совместимости
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
  style?: CSSProperties;
  rounded?: 'full' | 'md';
  /** HEX цвет - будет сгенерирован светлый фон, бордер и насыщенный текст */
  color?: string;
}

// Flowbite стиль бейджей с бордером
const variantStyles: Record<string, string> = {
  default: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300',
  dark: 'bg-zinc-100 border-zinc-300 text-zinc-800 dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-300',
  blue: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300',
  red: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-300',
  green: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-300',
  yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-300',
  indigo: 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900 dark:border-indigo-700 dark:text-indigo-300',
  purple: 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-300',
  pink: 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900 dark:border-pink-700 dark:text-pink-300',
  // Алиасы
  success: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-300',
  warning: 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-300',
  error: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-300',
  info: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300',
};

export function Badge({ children, className = '', variant = 'default', style, rounded = 'full', color }: BadgeProps) {
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded';
  const baseStyles = `inline-flex items-center gap-1.5 px-1.5 py-0.5 ${roundedClass} text-xs font-medium border`;
  const dotStyles = 'w-2 h-2 rounded-full bg-current';

  // Если передан color, генерируем стили в стиле Flowbite
  if (color) {
    const colors = getBadgeColors(color);
    return (
      <span
        className={`${baseStyles} ${className}`}
        style={{
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          color: colors.textColor,
          ...style,
        }}
      >
        <span className={dotStyles} />
        {children}
      </span>
    );
  }

  const variantStyle = style ? '' : (variantStyles[variant] || variantStyles.default);

  return (
    <span className={`${baseStyles} ${variantStyle} ${className}`} style={style}>
      <span className={dotStyles} />
      {children}
    </span>
  );
}
