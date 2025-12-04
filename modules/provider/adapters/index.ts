// Provider Adapters exports and registry

export * from './types';
export { TwilioAdapter } from './twilio.adapter';
export { TelnyxAdapter } from './telnyx.adapter';
export { VAPIAdapter } from './vapi.adapter';
export { ElevenLabsAdapter } from './elevenlabs.adapter';

import { ITelephonyAdapter, IAIAgentAdapter } from './types';
import { TwilioAdapter } from './twilio.adapter';
import { TelnyxAdapter } from './telnyx.adapter';
import { VAPIAdapter } from './vapi.adapter';
import { ElevenLabsAdapter } from './elevenlabs.adapter';
import { ProviderType } from '../types';

// === Adapter Registry ===

type TelephonyAdapterConstructor = new () => ITelephonyAdapter;
type AIAgentAdapterConstructor = new () => IAIAgentAdapter;

const telephonyAdapters: Record<string, TelephonyAdapterConstructor> = {
  twilio: TwilioAdapter,
  telnyx: TelnyxAdapter,
};

const aiAgentAdapters: Record<string, AIAgentAdapterConstructor> = {
  vapi: VAPIAdapter,
  elevenlabs: ElevenLabsAdapter,
};

/**
 * Создаёт и инициализирует адаптер телефонии
 */
export async function createTelephonyAdapter(
  type: ProviderType,
  config: Record<string, unknown>
): Promise<ITelephonyAdapter> {
  const AdapterClass = telephonyAdapters[type];

  if (!AdapterClass) {
    throw new Error(`Unknown telephony provider type: ${type}`);
  }

  const adapter = new AdapterClass();
  await adapter.initialize(config);
  return adapter;
}

/**
 * Создаёт и инициализирует адаптер AI агента
 */
export async function createAIAgentAdapter(
  type: ProviderType,
  config: Record<string, unknown>
): Promise<IAIAgentAdapter> {
  const AdapterClass = aiAgentAdapters[type];

  if (!AdapterClass) {
    throw new Error(`Unknown AI agent provider type: ${type}`);
  }

  const adapter = new AdapterClass();
  await adapter.initialize(config);
  return adapter;
}

/**
 * Проверяет, является ли тип провайдера телефонией
 */
export function isTelephonyProvider(type: string): boolean {
  return type in telephonyAdapters;
}

/**
 * Проверяет, является ли тип провайдера AI агентом
 */
export function isAIAgentProvider(type: string): boolean {
  return type in aiAgentAdapters;
}

/**
 * Получает список поддерживаемых типов телефонии
 */
export function getSupportedTelephonyTypes(): string[] {
  return Object.keys(telephonyAdapters);
}

/**
 * Получает список поддерживаемых типов AI агентов
 */
export function getSupportedAIAgentTypes(): string[] {
  return Object.keys(aiAgentAdapters);
}
