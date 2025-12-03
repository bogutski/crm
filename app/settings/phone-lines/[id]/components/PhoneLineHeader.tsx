'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, PhoneForwarded } from 'lucide-react';
import { ProviderIcon } from '../../../providers/components/ProviderIcon';

interface PhoneLine {
  id: string;
  phoneNumber: string;
  displayName: string;
  providerType?: string;
  providerName?: string;
  forwardingEnabled: boolean;
  isActive: boolean;
}

interface PhoneLineHeaderProps {
  phoneLineId: string;
}

export function PhoneLineHeader({ phoneLineId }: PhoneLineHeaderProps) {
  const [phoneLine, setPhoneLine] = useState<PhoneLine | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPhoneLine() {
      try {
        const response = await fetch(`/api/phone-lines/${phoneLineId}`);
        if (response.ok) {
          const data = await response.json();
          setPhoneLine(data);
        }
      } catch (error) {
        console.error('Error fetching phone line:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPhoneLine();
  }, [phoneLineId]);

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('+7') && phone.length === 12) {
      return `+7 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8, 10)}-${phone.slice(10)}`;
    }
    return phone;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 mb-6">
        <div className="animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-lg w-10 h-10"></div>
        <div className="animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded h-6 w-48"></div>
      </div>
    );
  }

  if (!phoneLine) {
    return (
      <div className="mb-6">
        <Link
          href="/settings/phone-lines"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к линиям
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mt-2">
          Линия не найдена
        </h1>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <Link
        href="/settings/phone-lines"
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 flex items-center gap-1 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к линиям
      </Link>

      <div className="flex items-center gap-4">
        {phoneLine.providerType ? (
          <ProviderIcon type={phoneLine.providerType} size={48} />
        ) : (
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
            <Phone className="w-6 h-6 text-zinc-400" />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 font-mono">
              {formatPhoneNumber(phoneLine.phoneNumber)}
            </h1>
            {phoneLine.forwardingEnabled && (
              <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded flex items-center gap-1">
                <PhoneForwarded className="w-3 h-3" />
                Переадресация
              </span>
            )}
            {!phoneLine.isActive && (
              <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs rounded">
                Отключена
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {phoneLine.displayName}
            {phoneLine.providerName && <span> · {phoneLine.providerName}</span>}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Правила маршрутизации
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Настройте обработку входящих звонков на эту линию
        </p>
      </div>
    </div>
  );
}
