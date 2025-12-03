'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value?: { hours: number; minutes: number } | null;
  onChange: (time: { hours: number; minutes: number } | null) => void;
  minuteStep?: 5 | 10 | 15 | 30;
  disabled?: boolean;
  id?: string;
  error?: string;
}

export function TimePicker({
  value,
  onChange,
  minuteStep = 15,
  disabled = false,
  id,
  error,
}: TimePickerProps) {
  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  const minutes = useMemo(() => {
    const result: number[] = [];
    for (let i = 0; i < 60; i += minuteStep) {
      result.push(i);
    }
    return result;
  }, [minuteStep]);

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = parseInt(e.target.value, 10);
    if (isNaN(newHour) || newHour === -1) {
      onChange(null);
    } else {
      onChange({
        hours: newHour,
        minutes: value?.minutes ?? 0,
      });
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = parseInt(e.target.value, 10);
    if (isNaN(newMinute) || newMinute === -1) {
      onChange(null);
    } else {
      onChange({
        hours: value?.hours ?? 9,
        minutes: newMinute,
      });
    }
  };

  const baseSelectClass = `
    px-2 py-2
    border rounded-md
    bg-white dark:bg-zinc-800
    text-zinc-900 dark:text-zinc-100
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    appearance-none cursor-pointer
    ${error
      ? 'border-red-500 dark:border-red-500'
      : 'border-zinc-300 dark:border-zinc-700'
    }
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="flex items-center gap-1">
      <Clock className="w-4 h-4 text-zinc-400 flex-shrink-0" />

      {/* Hours */}
      <select
        id={id}
        value={value?.hours ?? -1}
        onChange={handleHourChange}
        disabled={disabled}
        className={`${baseSelectClass} w-16 text-center`}
      >
        <option value={-1}>--</option>
        {hours.map((hour) => (
          <option key={hour} value={hour}>
            {String(hour).padStart(2, '0')}
          </option>
        ))}
      </select>

      <span className="text-zinc-500 dark:text-zinc-400 font-medium">:</span>

      {/* Minutes */}
      <select
        value={value?.minutes ?? -1}
        onChange={handleMinuteChange}
        disabled={disabled}
        className={`${baseSelectClass} w-16 text-center`}
      >
        <option value={-1}>--</option>
        {minutes.map((minute) => (
          <option key={minute} value={minute}>
            {String(minute).padStart(2, '0')}
          </option>
        ))}
      </select>
    </div>
  );
}
