'use client';

import { Phone, Settings, Power, PowerOff, TestTube, Trash2, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
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
  const isConfigured = provider.enabled && hasCredentials;
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      className={`rounded-lg border transition-colors ${
        provider.isActive
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : isConfigured
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
          : 'border-zinc-200 dark:border-zinc-700'
      }`}
    >
      <div className="p-4">
        {/* Заголовок и основная информация */}
        <div className="flex items-start gap-4">
          {/* Иконка */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Phone className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
          </div>

          {/* Основная информация */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {provider.name}
              </h4>
              {provider.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Активен
                </span>
              ) : isConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  Настроен
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  Не настроен
                </span>
              )}
              {info?.website && (
                <a
                  href={info.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  title="Открыть сайт провайдера"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {info?.description}
            </p>
          </div>

          {/* Кнопки действий */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={onConfigure}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Настроить
            </button>

            {hasCredentials && (
              <>
                <button
                  type="button"
                  onClick={onTest}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                >
                  <TestTube className="w-4 h-4" />
                  Тест
                </button>

                {provider.isActive ? (
                  <button
                    type="button"
                    onClick={onDeactivate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded-lg transition-colors"
                  >
                    <PowerOff className="w-4 h-4" />
                    Выключить
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onActivate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                  >
                    <Power className="w-4 h-4" />
                    Включить
                  </button>
                )}
              </>
            )}

            {!provider.isActive && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center justify-center w-9 h-9 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Детальная информация */}
        {isConfigured && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Twilio: Account SID */}
              {provider.code === 'twilio' && provider.publicCredentials?.accountSid && (
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Account SID
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
                      {provider.publicCredentials.accountSid}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(provider.publicCredentials!.accountSid!, 'accountSid')}
                      className="flex-shrink-0 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                      title="Копировать"
                    >
                      {copiedField === 'accountSid' ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Twilio: Auth Token */}
              {provider.code === 'twilio' && (
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Auth Token
                  </div>
                  <div className="flex items-center gap-2 h-[34px]">
                    {provider.hasCredentials.authToken ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Настроен
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
                        Не указан
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Telnyx: API Key */}
              {provider.code === 'telnyx' && (
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    API Key
                  </div>
                  <div className="flex items-center gap-2 h-[34px]">
                    {provider.hasCredentials.apiKey ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Настроен
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
                        Не указан
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Vonage: API Key */}
              {provider.code === 'vonage' && (
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    API Key
                  </div>
                  <div className="flex items-center gap-2 h-[34px]">
                    {provider.hasCredentials.apiKey ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Настроен
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
                        Не указан
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Vonage: API Secret */}
              {provider.code === 'vonage' && (
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    API Secret
                  </div>
                  <div className="flex items-center gap-2 h-[34px]">
                    {provider.hasCredentials.apiSecret ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Настроен
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
                        Не указан
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Webhook URL */}
              {provider.webhookUrl && (
                <div className="sm:col-span-2">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Webhook URL
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
                      {provider.webhookUrl}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(provider.webhookUrl!, 'webhook')}
                      className="flex-shrink-0 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                      title="Копировать"
                    >
                      {copiedField === 'webhook' ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Caller ID */}
              {provider.settings.defaultCallerId && (
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Caller ID
                  </div>
                  <div className="px-2 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded text-sm text-zinc-700 dark:text-zinc-300">
                    {provider.settings.defaultCallerId}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Статус для ненастроенного провайдера */}
        {!isConfigured && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700/50">
            <div className="flex flex-wrap gap-3">
              {info?.requiredCredentials.map((cred) => (
                <div key={cred.field} className="flex items-center gap-2 text-sm">
                  {provider.hasCredentials[cred.field] ? (
                    <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-zinc-400" />
                    </span>
                  )}
                  <span className="text-zinc-600 dark:text-zinc-400">{cred.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
