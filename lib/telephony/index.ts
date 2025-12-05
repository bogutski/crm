import { TelephonyProviderCode } from '@/modules/telephony';
import { ITelephonyAdapter } from './types';
import { TelnyxAdapter } from './adapters/telnyx';
import { TwilioAdapter } from './adapters/twilio';
import { VonageAdapter } from './adapters/vonage';

// Экспорт типов
export * from './types';

// Кэш адаптеров
const adapters: Map<TelephonyProviderCode, ITelephonyAdapter> = new Map();

/**
 * Получить адаптер для указанного провайдера
 */
export function getAdapter(providerCode: TelephonyProviderCode): ITelephonyAdapter {
  let adapter = adapters.get(providerCode);

  if (!adapter) {
    switch (providerCode) {
      case 'telnyx':
        adapter = new TelnyxAdapter();
        break;
      case 'twilio':
        adapter = new TwilioAdapter();
        break;
      case 'vonage':
        adapter = new VonageAdapter();
        break;
      default:
        throw new Error(`Unknown telephony provider: ${providerCode}`);
    }
    adapters.set(providerCode, adapter);
  }

  return adapter;
}

/**
 * Получить все доступные адаптеры
 */
export function getAllAdapters(): ITelephonyAdapter[] {
  return [
    getAdapter('telnyx'),
    getAdapter('twilio'),
    getAdapter('vonage'),
  ];
}

/**
 * Проверить, поддерживается ли провайдер
 */
export function isProviderSupported(providerCode: string): providerCode is TelephonyProviderCode {
  return ['telnyx', 'twilio', 'vonage'].includes(providerCode);
}
