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
 * Адаптер для Telnyx
 * https://developers.telnyx.com/
 */
export class TelnyxAdapter extends BaseTelephonyAdapter {
  readonly providerCode = 'telnyx' as const;

  private readonly baseUrl = 'https://api.telnyx.com/v2';

  private getHeaders(apiKey: string): HeadersInit {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async validateCredentials(credentials: ITelephonyCredentials): Promise<CredentialsValidationResult> {
    if (!credentials.apiKey) {
      return { valid: false, error: 'API Key is required' };
    }

    try {
      // Получаем баланс аккаунта для проверки ключа
      const response = await fetch(`${this.baseUrl}/balance`, {
        method: 'GET',
        headers: this.getHeaders(credentials.apiKey),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          valid: false,
          error: error.errors?.[0]?.detail || `Authentication failed: ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        valid: true,
        accountInfo: {
          balance: parseFloat(data.data?.balance || '0'),
          currency: data.data?.currency || 'USD',
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
    if (!credentials.apiKey) {
      throw new Error('API Key is required');
    }

    const response = await fetch(`${this.baseUrl}/phone_numbers?page[size]=250`, {
      method: 'GET',
      headers: this.getHeaders(credentials.apiKey),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch numbers: ${response.status}`);
    }

    const data = await response.json();

    return (data.data || []).map((num: Record<string, unknown>) => ({
      phoneNumber: num.phone_number as string,
      providerNumberId: num.id as string,
      friendlyName: (num.connection_name as string) || undefined,
      type: this.mapNumberType(num.phone_number_type as string),
      country: (num.address_country_code as string) || 'US',
      capabilities: {
        voice: true,
        sms: (num.messaging_profile_id as string | null) !== null,
        mms: (num.messaging_profile_id as string | null) !== null,
        fax: false,
      },
    }));
  }

  private mapNumberType(type: string): 'local' | 'tollfree' | 'mobile' | 'unknown' {
    switch (type?.toLowerCase()) {
      case 'local':
        return 'local';
      case 'toll_free':
      case 'tollfree':
        return 'tollfree';
      case 'mobile':
        return 'mobile';
      default:
        return 'unknown';
    }
  }

  async makeCall(credentials: ITelephonyCredentials, params: MakeCallParams): Promise<MakeCallResult> {
    if (!credentials.apiKey) {
      return { success: false, error: 'API Key is required' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/calls`, {
        method: 'POST',
        headers: this.getHeaders(credentials.apiKey),
        body: JSON.stringify({
          connection_id: params.callerId, // В Telnyx используется connection_id
          to: this.normalizePhoneNumber(params.to),
          from: this.normalizePhoneNumber(params.from),
          record: params.record ? 'record-from-answer' : undefined,
          webhook_url: params.webhookUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.errors?.[0]?.detail || `Call failed: ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        callId: data.data?.call_control_id,
        providerCallId: data.data?.call_leg_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Call initiation failed',
      };
    }
  }

  async hangup(credentials: ITelephonyCredentials, callId: string): Promise<{ success: boolean; error?: string }> {
    if (!credentials.apiKey) {
      return { success: false, error: 'API Key is required' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}/actions/hangup`, {
        method: 'POST',
        headers: this.getHeaders(credentials.apiKey),
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.errors?.[0]?.detail || `Hangup failed: ${response.status}`,
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
    if (!credentials.apiKey) {
      return { success: false, error: 'API Key is required' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/calls/${params.callId}/actions/transfer`, {
        method: 'POST',
        headers: this.getHeaders(credentials.apiKey),
        body: JSON.stringify({
          to: this.normalizePhoneNumber(params.to),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.errors?.[0]?.detail || `Transfer failed: ${response.status}`,
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
    const eventType = data.event_type as string;
    const dataObj = data.data as Record<string, unknown> | undefined;
    const eventData = dataObj?.payload as Record<string, unknown> | undefined;

    if (!eventData) {
      return null;
    }

    const typeMap: Record<string, NormalizedCallEvent['type']> = {
      'call.initiated': 'initiated',
      'call.answered': 'answered',
      'call.hangup': 'ended',
      'call.recording.saved': 'recording_ready',
    };

    const type = typeMap[eventType];
    if (!type) {
      return null;
    }

    return {
      type,
      callId: eventData.call_control_id as string,
      providerCallId: eventData.call_leg_id as string,
      from: eventData.from as string,
      to: eventData.to as string,
      direction: eventData.direction as 'inbound' | 'outbound',
      timestamp: new Date(eventData.occurred_at as string),
      duration: eventData.duration_secs as number | undefined,
      endReason: eventData.hangup_cause as string | undefined,
      recordingUrl: eventData.recording_url as string | undefined,
      rawPayload: payload,
    };
  }

  validateWebhook(signature: string, payload: unknown, secret: string): boolean {
    // Telnyx использует webhook signing
    // https://developers.telnyx.com/docs/v2/development/webhooks/signature-verification
    // Для упрощения пока возвращаем true
    // В production нужно реализовать проверку подписи
    return !!signature && !!payload && !!secret;
  }
}
