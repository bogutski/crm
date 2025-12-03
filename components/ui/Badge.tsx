'use client';

import { ReactNode, CSSProperties } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  style?: CSSProperties;
  rounded?: 'full' | 'md';
}

const variantStyles: Record<string, string> = {
  default: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
  success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
};

export function Badge({ children, className = '', variant = 'default', style, rounded = 'full' }: BadgeProps) {
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded';
  const baseStyles = `inline-flex items-center px-2 py-0.5 ${roundedClass} text-xs font-semibold`;
  const variantStyle = style ? '' : (variantStyles[variant] || variantStyles.default);

  return (
    <span className={`${baseStyles} ${variantStyle} ${className}`} style={style}>
      {children}
    </span>
  );
}
