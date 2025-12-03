'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { ru } from 'date-fns/locale';
import { format } from 'date-fns';
import { Calendar, Clock, X } from 'lucide-react';

interface DateTimePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  error?: string;
  minuteStep?: 5 | 10 | 15 | 30;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Выберите дату и время',
  disabled = false,
  id,
  error,
  minuteStep = 15,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Local state for time when date is being selected
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value || undefined);
  const [selectedHours, setSelectedHours] = useState<number>(value?.getHours() ?? 9);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(value?.getMinutes() ?? 0);

  // Sync with external value
  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setSelectedHours(value.getHours());
      setSelectedMinutes(value.getMinutes());
    } else {
      setSelectedDate(undefined);
      setSelectedHours(9);
      setSelectedMinutes(0);
    }
  }, [value]);

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

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => {
    const result: number[] = [];
    for (let i = 0; i < 60; i += minuteStep) {
      result.push(i);
    }
    return result;
  }, [minuteStep]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(selectedHours, selectedMinutes, 0, 0);
      onChange(newDate);
    } else {
      onChange(null);
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = parseInt(e.target.value, 10);
    setSelectedHours(newHour);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(newHour, selectedMinutes, 0, 0);
      onChange(newDate);
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = parseInt(e.target.value, 10);
    setSelectedMinutes(newMinute);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(selectedHours, newMinute, 0, 0);
      onChange(newDate);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSelectedDate(undefined);
    setSelectedHours(9);
    setSelectedMinutes(0);
  };

  const handleQuickSelect = (daysFromNow: number, hours: number = 9, mins: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hours, mins, 0, 0);
    setSelectedDate(date);
    setSelectedHours(hours);
    setSelectedMinutes(mins);
    onChange(date);
    setIsOpen(false);
  };

  const formatDisplay = () => {
    if (!value) return placeholder;
    const dateStr = format(value, 'd MMMM yyyy', { locale: ru });
    const hours = value.getHours();
    const minutes = value.getMinutes();
    if (hours === 0 && minutes === 0) {
      return dateStr;
    }
    return `${dateStr}, ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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
          {formatDisplay()}
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
          <div className="flex flex-wrap gap-1 p-2 border-b border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => handleQuickSelect(0, 9, 0)}
              className="px-2 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Сегодня 9:00
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(1, 9, 0)}
              className="px-2 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Завтра 9:00
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(7, 9, 0)}
              className="px-2 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Через неделю
            </button>
          </div>

          <div className="flex">
            {/* Calendar */}
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={ru}
              weekStartsOn={1}
              showOutsideDays
            />

            {/* Time picker */}
            <div className="border-l border-zinc-200 dark:border-zinc-700 p-3 flex flex-col justify-center">
              <div className="flex items-center gap-1 mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Время</span>
              </div>

              <div className="flex items-center gap-1">
                {/* Hours */}
                <select
                  value={selectedHours}
                  onChange={handleHourChange}
                  className="w-14 px-2 py-1.5 text-sm text-center border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, '0')}
                    </option>
                  ))}
                </select>

                <span className="text-zinc-500 dark:text-zinc-400 font-medium">:</span>

                {/* Minutes */}
                <select
                  value={selectedMinutes}
                  onChange={handleMinuteChange}
                  className="w-14 px-2 py-1.5 text-sm text-center border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {minutes.map((minute) => (
                    <option key={minute} value={minute}>
                      {String(minute).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
