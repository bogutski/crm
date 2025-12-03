'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { ru } from 'date-fns/locale';
import { format } from 'date-fns';
import { Calendar, X } from 'lucide-react';

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  error?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Выберите дату',
  disabled = false,
  id,
  error,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (date: Date | undefined) => {
    onChange(date || null);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleQuickSelect = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(0, 0, 0, 0);
    onChange(date);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2 text-left
          border rounded-md
          bg-white dark:bg-zinc-800
          text-zinc-900 dark:text-zinc-100
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-between gap-2
          ${error
            ? 'border-red-500 dark:border-red-500'
            : 'border-zinc-300 dark:border-zinc-700'
          }
        `.trim().replace(/\s+/g, ' ')}
      >
        <span className={value ? '' : 'text-zinc-400 dark:text-zinc-500'}>
          {value ? format(value, 'd MMMM yyyy', { locale: ru }) : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </span>
          )}
          <Calendar className="w-4 h-4 text-zinc-400" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg">
          {/* Quick select buttons */}
          <div className="flex gap-1 p-2 border-b border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => handleQuickSelect(0)}
              className="px-2 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(1)}
              className="px-2 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Завтра
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(7)}
              className="px-2 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Через неделю
            </button>
          </div>

          <DayPicker
            mode="single"
            selected={value || undefined}
            onSelect={handleSelect}
            locale={ru}
            weekStartsOn={1}
            showOutsideDays
          />
        </div>
      )}
    </div>
  );
}
