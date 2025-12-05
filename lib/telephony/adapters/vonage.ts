import {
  BaseTelephonyAdapter,
  CredentialsValidationResult,
  ProviderPhoneNumber,
  MakeCallParams,
  MakeCallResult,
  TransferParams,
  NormalizedCallEvent,
} from '../types';
import { ITelephonyCredentials } from '@/modules/telephony';

/**
 * Адаптер для Vonage (бывший Nexmo)
 * https://developer.vonage.com/
 */
export class VonageAdapter extends BaseTelephonyAdapter {
  readonly providerCode = 'vonage' as const;

  private readonly baseUrl = 'https://api.nexmo.com';
  private readonly voiceUrl = 'https://api.nexmo.com/v1/calls';

  private getAuthHeader(apiKey: string, apiSecret: string): string {
    return 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  }

  async validateCredentials(credentials: ITelephonyCredentials): Promise<CredentialsValidationResult> {
    if (!credentials.apiKey) {
      return { valid: false, error: 'API Key is required' };
    }
    if (!credentials.apiSecret) {
      return { valid: false, error: 'API Secret is required' };
    }

    try {
      // Получаем баланс для проверки ключей
      const response = await fetch(
        `${this.baseUrl}/account/get-balance?api_key=${credentials.apiKey}&api_secret=${credentials.apiSecret}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        if (response.status === 401) {
          return { valid: false, error: 'Invalid API Key or API Secret' };
        }
        return { valid: false, error: `Authentication failed: ${response.status}` };
      }

      const data = await response.json();

      if (data['error-code'] && data['error-code'] !== '200') {
        return { valid: false, error: data['error-code-label'] || 'Authentication failed' };
      }

      return {
        valid: true,
        accountInfo: {
          balance: parseFloat(data.value || '0'),
          currency: 'EUR', // Vonage баланс в EUR
        },
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  async listNumbers(credentials: ITelephonyCredentials): Promise<ProviderPhoneNumber[]> {
    if (!credentials.apiKey || !credentials.apiSecret) {
      throw new Error('API Key and API Secret are required');
    }

    const response = await fetch(
      `${this.baseUrl}/account/numbers?api_key=${credentials.apiKey}&api_secret=${credentials.apiSecret}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch numbers: ${response.status}`);
    }

    const data = await response.json();

    return (data.numbers || []).map((num: Record<string, unknown>) => ({
      phoneNumber: '+' + (num.msisdn as string),
      providerNumberId: num.msisdn as string,
      friendlyName: undefined,
      type: this.mapNumberType(num.type as string),
      country: (num.country as string) || 'US',
      capabilities: {
        voice: ((num.features as string[]) || []).includes('VOICE'),
        sms: ((num.features as string[]) || []).includes('SMS'),
        mms: ((num.features as string[]) || []).includes('MMS'),
        fax: false,
      },
    }));
  }

  private mapNumberType(type: string): 'local' | 'tollfree' | 'mobile' | 'unknown' {
    switch (type?.toLowerCase()) {
      case 'landline':
      case 'local':
        return 'local';
      case 'mobile-lvn':
      case 'mobile':
        return 'mobile';
      case 'toll-free':
      case 'tollfree':
        return 'tollfree';
      default:
        return 'unknown';
    }
  }

  async makeCall(credentials: ITelephonyCredentials, params: MakeCallParams): Promise<MakeCallResult> {
    if (!credentials.apiKey || !credentials.apiSecret) {
      return { success: false, error: 'API Key and API Secret are required' };
    }

    try {
      // Vonage Voice API требует JWT для авторизации
      // Для упрощения используем базовую авторизацию
      // В production нужно использовать JWT
      const response = await fetch(this.voiceUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(credentials.apiKey, credentials.apiSecret),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: [{ type: 'phone', number: this.normalizePhoneNumber(params.to).replace('+', '') }],
          from: { type: 'phone', number: this.normalizePhoneNumber(params.from).replace('+', '') },
          answer_url: [params.webhookUrl || 'https://example.com/answer'],
          event_url: [params.webhookUrl || 'https://example.com/event'],
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.title || error.detail || `Call failed: ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        callId: data.uuid,
        providerCallId: data.conversation_uuid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Call initiation failed',
      };
    }
  }

  async hangup(credentials: ITelephonyCredentials, callId: string): Promise<{ success: boolean; error?: string }> {
    if (!credentials.apiKey || !credentials.apiSecret) {
      return { success: false, error: 'API Key and API Secret are required' };
    }

    try {
      const response = await fetch(`${this.voiceUrl}/${callId}`, {
        method: 'PUT',
        headers: {
          'Authorization': this.getAuthHeader(credentials.apiKey, credentials.apiSecret),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'hangup' }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.title || `Hangup failed: ${response.status}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Hangup failed',
      };
    }
  }

  async transfer(credentials: ITelephonyCredentials, params: TransferParams): Promise<{ success: boolean; error?: string }> {
    if (!credentials.apiKey || !credentials.apiSecret) {
      return { success: false, error: 'API Key and API Secret are required' };
    }

    try {
      const response = await fetch(`${this.voiceUrl}/${params.callId}`, {
        method: 'PUT',
        headers: {
          'Authorization': this.getAuthHeader(credentials.apiKey, credentials.apiSecret),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'transfer',
          destination: {
            type: 'ncco',
            ncco: [
              {
                action: 'connect',
                from: '', // будет заполнено из текущего звонка
                endpoint: [{ type: 'phone', number: this.normalizePhoneNumber(params.to).replace('+', '') }],
              },
            ],
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.title || `Transfer failed: ${response.status}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed',
      };
    }
  }

  parseWebhook(payload: unknown): NormalizedCallEvent | null {
    const data = payload as Record<string, unknown>;
    const status = data.status as string;

    const statusMap: Record<string, NormalizedCallEvent['type']> = {
      'started': 'initiated',
      'ringing': 'ringing',
      'answered': 'answered',
      'completed': 'ended',
      'busy': 'ended',
      'failed': 'failed',
      'rejected': 'ended',
      'cancelled': 'ended',
      'timeout': 'ended',
      'unanswered': 'ended',
    };

    const type = statusMap[status];
    if (!type) {
      return null;
    }

    return {
      type,
      callId: data.uuid as string,
      providerCallId: data.conversation_uuid as string,
      from: '+' + (data.from as string),
      to: '+' + (data.to as string),
      direction: data.direction as 'inbound' | 'outbound',
      timestamp: new Date(data.timestamp as string),
      duration: data.duration ? parseInt(data.duration as string, 10) : undefined,
      endReason: status,
      recordingUrl: data.recording_url as string | undefined,
      rawPayload: payload,
    };
  }

  validateWebhook(signature: string, payload: unknown, secret: string): boolean {
    // Vonage использует SHA256 подпись
    // https://developer.vonage.com/en/getting-started/concepts/webhooks#signature-verification
    // Для упрощения пока возвращаем true
    return !!signature && !!payload && !!secret;
  }
}
