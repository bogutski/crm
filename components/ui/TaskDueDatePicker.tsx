'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { ru } from 'date-fns/locale';
import { format } from 'date-fns';
import { Calendar, ChevronDown, X } from 'lucide-react';

interface TaskDueDatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  id?: string;
}

export function TaskDueDatePicker({
  value,
  onChange,
  disabled = false,
  id,
}: TaskDueDatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
      if (timeRef.current && !timeRef.current.contains(event.target as Node)) {
        setIsTimeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCalendarOpen(false);
        setIsTimeOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => [0, 15, 30, 45], []);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date);
      if (value) {
        newDate.setHours(value.getHours(), value.getMinutes(), 0, 0);
      } else {
        newDate.setHours(9, 0, 0, 0);
      }
      onChange(newDate);
    } else {
      onChange(null);
    }
    setIsCalendarOpen(false);
  };

  const handleTimeSelect = (hours: number, mins: number) => {
    if (value) {
      const newDate = new Date(value);
      newDate.setHours(hours, mins, 0, 0);
      onChange(newDate);
    } else {
      const newDate = new Date();
      newDate.setHours(hours, mins, 0, 0);
      onChange(newDate);
    }
    setIsTimeOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleQuickSelect = (daysFromNow: number, hours: number, mins: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hours, mins, 0, 0);
    onChange(date);
  };

  const formatDate = () => {
    if (!value) return null;
    return format(value, 'd MMMM yyyy', { locale: ru });
  };

  const formatTime = () => {
    if (!value) return null;
    const h = value.getHours();
    const m = value.getMinutes();
    if (h === 0 && m === 0) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const hasTime = value && (value.getHours() !== 0 || value.getMinutes() !== 0);

  const inputClass = `
    px-2.5 py-1.5 text-sm
    border rounded-md
    bg-white dark:bg-zinc-800
    text-zinc-900 dark:text-zinc-100
    border-zinc-300 dark:border-zinc-700
    hover:border-zinc-400 dark:hover:border-zinc-600
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center gap-1.5
    transition-colors
  `.trim().replace(/\s+/g, ' ');

  const quickBtnClass = `
    px-2 py-1 text-xs font-medium rounded
    bg-zinc-100 dark:bg-zinc-800
    hover:bg-zinc-200 dark:hover:bg-zinc-700
    text-zinc-600 dark:text-zinc-400
    transition-colors
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="space-y-2">
      {/* Date and Time inputs */}
      <div className="flex items-center gap-2">
        {/* Date picker */}
        <div ref={calendarRef} className="relative">
          <button
            type="button"
            id={id}
            disabled={disabled}
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={`${inputClass} min-w-[120px]`}
          >
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className={value ? '' : 'text-zinc-400'}>
              {formatDate() || 'Выбрать дату'}
            </span>
          </button>

          {isCalendarOpen && (
            <div className="absolute z-50 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3">
              <DayPicker
                mode="single"
                selected={value || undefined}
                onSelect={handleDateSelect}
                locale={ru}
                weekStartsOn={1}
                showOutsideDays
              />
            </div>
          )}
        </div>

        {/* Time picker */}
        <div ref={timeRef} className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsTimeOpen(!isTimeOpen)}
            className={inputClass}
          >
            <span className={hasTime ? '' : 'text-zinc-400'}>
              {formatTime() || 'Время'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {isTimeOpen && (
            <div className="absolute right-0 z-50 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-2 w-48">
              <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
                {hours.map((h) =>
                  minutes.map((m) => (
                    <button
                      key={`${h}-${m}`}
                      type="button"
                      onClick={() => handleTimeSelect(h, m)}
                      className={`
                        px-2 py-1 text-xs rounded
                        ${value?.getHours() === h && value?.getMinutes() === m
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                        }
                      `}
                    >
                      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick presets - single row */}
      <div className="flex flex-wrap gap-1">
        <button type="button" onClick={() => handleQuickSelect(0, 9, 0)} className={quickBtnClass}>
          Сегодня 9:00
        </button>
        <button type="button" onClick={() => handleQuickSelect(0, 14, 0)} className={quickBtnClass}>
          Сегодня 14:00
        </button>
        <button type="button" onClick={() => handleQuickSelect(1, 9, 0)} className={quickBtnClass}>
          Завтра 9:00
        </button>
        <button type="button" onClick={() => handleQuickSelect(1, 14, 0)} className={quickBtnClass}>
          Завтра 14:00
        </button>
        <button type="button" onClick={() => handleQuickSelect(7, 9, 0)} className={quickBtnClass}>
          +7 дней
        </button>
      </div>
    </div>
  );
}
