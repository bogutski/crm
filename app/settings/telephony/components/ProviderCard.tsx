'use client';

import { Phone, Settings, Power, PowerOff, TestTube, Trash2, ExternalLink } from 'lucide-react';
import { TelephonyProviderResponse, TELEPHONY_PROVIDERS } from '@/modules/telephony/types';

interface ProviderCardProps {
  provider: TelephonyProviderResponse;
  onConfigure: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onTest: () => void;
  onDelete: () => void;
}

export function ProviderCard({
  provider,
  onConfigure,
  onActivate,
  onDeactivate,
  onTest,
  onDelete,
}: ProviderCardProps) {
  const info = TELEPHONY_PROVIDERS[provider.code];
  const hasCredentials = Object.values(provider.hasCredentials).some(Boolean);

  return (
    <div
      className={`relative p-4 rounded-lg border transition-colors ${
        provider.isActive
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : provider.enabled && hasCredentials
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
          : 'border-zinc-200 dark:border-zinc-700'
      }`}
    >
      {/* Статус */}
      <div className="absolute top-3 right-3">
        {provider.isActive ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Активен
          </span>
        ) : provider.enabled && hasCredentials ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded">
            Настроен
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
            Не настроен
          </span>
        )}
      </div>

      {/* Заголовок */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Phone className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate">
            {provider.name}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {info?.description}
          </p>
        </div>
      </div>

      {/* Информация о credentials */}
      <div className="mb-4 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
        {info?.requiredCredentials.map((cred) => (
          <div key={cred.field} className="flex items-center gap-2">
            {provider.hasCredentials[cred.field] ? (
              <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              </span>
            )}
            <span>{cred.label}</span>
          </div>
        ))}
      </div>

      {/* Действия */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onConfigure}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Настроить
        </button>

        {hasCredentials && (
          <>
            <button
              type="button"
              onClick={onTest}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded transition-colors"
            >
              <TestTube className="w-3.5 h-3.5" />
              Тест
            </button>

            {provider.isActive ? (
              <button
                type="button"
                onClick={onDeactivate}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded transition-colors"
              >
                <PowerOff className="w-3.5 h-3.5" />
                Выключить
              </button>
            ) : (
              <button
                type="button"
                onClick={onActivate}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
                Включить
              </button>
            )}
          </>
        )}

        {!provider.isActive && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {info?.website && (
          <a
            href={info.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors ml-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
