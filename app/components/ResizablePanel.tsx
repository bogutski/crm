'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

// Tailwind grid step: 4rem = 64px
const GRID_STEP = 64;

interface ResizablePanelProps {
  children: ReactNode;
  /** Минимальная ширина в колонках grid (кратно 64px) */
  minColumns?: number;
  /** Максимальная ширина в колонках grid (кратно 64px) или процент от родителя (например "50%") */
  maxColumns?: number | string;
  /** Начальная ширина в колонках grid (кратно 64px) */
  defaultColumns?: number;
  /** Позиция ручки изменения размера */
  resizeFrom?: 'left' | 'right';
  /** Ключ для сохранения в localStorage */
  storageKey?: string;
  /** Дополнительные классы для панели */
  className?: string;
}

export function ResizablePanel({
  children,
  minColumns = 4, // 256px
  maxColumns = 8, // 512px
  defaultColumns = 5, // 320px (w-80)
  resizeFrom = 'left',
  storageKey,
  className = '',
}: ResizablePanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startColumnsRef = useRef(defaultColumns);

  // Вычисляем максимум в колонках (поддержка процентов)
  const getMaxColumns = useCallback(() => {
    if (typeof maxColumns === 'number') {
      return maxColumns;
    }
    if (typeof maxColumns === 'string' && maxColumns.endsWith('%')) {
      const percent = parseFloat(maxColumns) / 100;
      const parentWidth = panelRef.current?.parentElement?.clientWidth || window.innerWidth;
      return Math.floor((parentWidth * percent) / GRID_STEP);
    }
    return 8;
  }, [maxColumns]);

  // Загрузка сохранённого размера (с ленивой инициализацией)
  const [columns, setColumns] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        // Используем defaultColumns для max, так как getMaxColumns зависит от DOM
        if (!isNaN(parsed) && parsed >= minColumns) {
          return parsed;
        }
      }
    }
    return defaultColumns;
  });

  // Сохранение размера
  useEffect(() => {
    if (storageKey && !isDragging) {
      localStorage.setItem(storageKey, columns.toString());
    }
  }, [columns, storageKey, isDragging]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
      startColumnsRef.current = columns;
    },
    [columns]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startXRef.current;
      // При resizeFrom='left' движение влево увеличивает панель
      const direction = resizeFrom === 'left' ? -1 : 1;
      const deltaColumns = Math.round((deltaX * direction) / GRID_STEP);
      const max = getMaxColumns();
      const newColumns = Math.min(
        max,
        Math.max(minColumns, startColumnsRef.current + deltaColumns)
      );

      setColumns(newColumns);
    },
    [isDragging, minColumns, getMaxColumns, resizeFrom]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const width = columns * GRID_STEP;

  return (
    <div
      ref={panelRef}
      className={`relative flex-shrink-0 flex h-full ${className}`}
      style={{ width }}
    >
      {/* Ручка для изменения размера */}
      <div
        className={`absolute top-0 bottom-0 w-4 cursor-col-resize z-20 group ${
          resizeFrom === 'left' ? '-left-2' : '-right-2'
        }`}
        onMouseDown={handleMouseDown}
      >
        {/* Тонкая линия-граница */}
        <div
          className={`absolute inset-y-0 w-px left-1/2 -translate-x-1/2 transition-colors ${
            isDragging
              ? 'bg-blue-500'
              : 'bg-zinc-200 dark:bg-zinc-800 group-hover:bg-blue-400'
          }`}
        />
        {/* Ручка-гамбургер по центру */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-px px-1 py-3 rounded transition-colors ${
            isDragging
              ? 'bg-blue-500'
              : 'bg-zinc-300 dark:bg-zinc-600 group-hover:bg-blue-400'
          }`}
        >
          <div className="w-px h-3 bg-zinc-500 dark:bg-zinc-400 group-hover:bg-white" />
          <div className="w-px h-3 bg-zinc-500 dark:bg-zinc-400 group-hover:bg-white" />
          <div className="w-px h-3 bg-zinc-500 dark:bg-zinc-400 group-hover:bg-white" />
        </div>
      </div>

      {/* Содержимое панели */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}
