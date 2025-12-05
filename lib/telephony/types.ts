import { TelephonyProviderCode, ITelephonyCredentials } from '@/modules/telephony';

/**
 * Результат валидации учётных данных провайдера
 */
export interface CredentialsValidationResult {
  valid: boolean;
  error?: string;
  accountInfo?: {
    balance?: number;
    currency?: string;
    accountName?: string;
    accountId?: string;
  };
}

/**
 * Нормализованное событие звонка (от webhook)
 */
export interface NormalizedCallEvent {
  type: 'initiated' | 'ringing' | 'answered' | 'ended' | 'failed' | 'recording_ready';
  callId: string;
  providerCallId: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  timestamp: Date;
  duration?: number;
  endReason?: string;
  recordingUrl?: string;
  rawPayload: unknown;
}

/**
 * Параметры для инициации звонка
 */
export interface MakeCallParams {
  from: string;
  to: string;
  callerId?: string;
  record?: boolean;
  webhookUrl?: string;
}

/**
 * Результат инициации звонка
 */
export interface MakeCallResult {
  success: boolean;
  callId?: string;
  providerCallId?: string;
  error?: string;
}

/**
 * Параметры переадресации
 */
export interface TransferParams {
  callId: string;
  to: string;
  type: 'blind' | 'warm';
}

/**
 * Информация о телефонном номере от провайдера
 */
export interface ProviderPhoneNumber {
  phoneNumber: string;
  providerNumberId: string;
  friendlyName?: string;
  type: 'local' | 'tollfree' | 'mobile' | 'unknown';
  country: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
    fax: boolean;
  };
}

/**
 * Интерфейс адаптера телефонии
 * Каждый провайдер реализует этот интерфейс
 */
export interface ITelephonyAdapter {
  /**
   * Код провайдера
   */
  readonly providerCode: TelephonyProviderCode;

  /**
   * Валидация учётных данных
   * Проверяет, что API ключи корректны
   */
  validateCredentials(credentials: ITelephonyCredentials): Promise<CredentialsValidationResult>;

  /**
   * Получить список номеров аккаунта
   */
  listNumbers(credentials: ITelephonyCredentials): Promise<ProviderPhoneNumber[]>;

  /**
   * Инициировать исходящий звонок
   */
  makeCall(credentials: ITelephonyCredentials, params: MakeCallParams): Promise<MakeCallResult>;

  /**
   * Завершить звонок
   */
  hangup(credentials: ITelephonyCredentials, callId: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Переадресовать звонок
   */
  transfer(credentials: ITelephonyCredentials, params: TransferParams): Promise<{ success: boolean; error?: string }>;

  /**
   * Парсинг webhook payload в нормализованный формат
   */
  parseWebhook(payload: unknown): NormalizedCallEvent | null;

  /**
   * Валидация подписи webhook
   */
  validateWebhook(signature: string, payload: unknown, secret: string): boolean;
}

/**
 * Базовый класс адаптера с общей логикой
 */
export abstract class BaseTelephonyAdapter implements ITelephonyAdapter {
  abstract readonly providerCode: TelephonyProviderCode;

  abstract validateCredentials(credentials: ITelephonyCredentials): Promise<CredentialsValidationResult>;
  abstract listNumbers(credentials: ITelephonyCredentials): Promise<ProviderPhoneNumber[]>;
  abstract makeCall(credentials: ITelephonyCredentials, params: MakeCallParams): Promise<MakeCallResult>;
  abstract hangup(credentials: ITelephonyCredentials, callId: string): Promise<{ success: boolean; error?: string }>;
  abstract transfer(credentials: ITelephonyCredentials, params: TransferParams): Promise<{ success: boolean; error?: string }>;
  abstract parseWebhook(payload: unknown): NormalizedCallEvent | null;
  abstract validateWebhook(signature: string, payload: unknown, secret: string): boolean;

  /**
   * Нормализация телефонного номера в E.164 формат
   */
  protected normalizePhoneNumber(phone: string): string {
    // Удаляем все кроме цифр и +
    let normalized = phone.replace(/[^\d+]/g, '');

    // Добавляем + если его нет
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }

    return normalized;
  }
}
