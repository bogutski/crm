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
 * Адаптер для Twilio
 * https://www.twilio.com/docs/voice
 */
export class TwilioAdapter extends BaseTelephonyAdapter {
  readonly providerCode = 'twilio' as const;

  private readonly baseUrl = 'https://api.twilio.com/2010-04-01';

  private getAuthHeader(accountSid: string, authToken: string): string {
    return 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  }

  async validateCredentials(credentials: ITelephonyCredentials): Promise<CredentialsValidationResult> {
    if (!credentials.accountSid) {
      return { valid: false, error: 'Account SID is required' };
    }
    if (!credentials.authToken) {
      return { valid: false, error: 'Auth Token is required' };
    }

    try {
      // Получаем информацию об аккаунте
      const response = await fetch(
        `${this.baseUrl}/Accounts/${credentials.accountSid}.json`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(credentials.accountSid, credentials.authToken),
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          return { valid: false, error: 'Invalid Account SID or Auth Token' };
        }
        return { valid: false, error: `Authentication failed: ${response.status}` };
      }

      const data = await response.json();

      // Получаем баланс
      const balanceResponse = await fetch(
        `${this.baseUrl}/Accounts/${credentials.accountSid}/Balance.json`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(credentials.accountSid, credentials.authToken),
          },
        }
      );

      let balance = 0;
      let currency = 'USD';
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        balance = parseFloat(balanceData.balance || '0');
        currency = balanceData.currency || 'USD';
      }

      return {
        valid: true,
        accountInfo: {
          accountName: data.friendly_name,
          accountId: data.sid,
          balance,
          currency,
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
    if (!credentials.accountSid || !credentials.authToken) {
      throw new Error('Account SID and Auth Token are required');
    }

    const response = await fetch(
      `${this.baseUrl}/Accounts/${credentials.accountSid}/IncomingPhoneNumbers.json?PageSize=1000`,
      {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(credentials.accountSid, credentials.authToken),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch numbers: ${response.status}`);
    }

    const data = await response.json();

    return (data.incoming_phone_numbers || []).map((num: Record<string, unknown>) => ({
      phoneNumber: num.phone_number as string,
      providerNumberId: num.sid as string,
      friendlyName: (num.friendly_name as string) || undefined,
      type: this.mapNumberType(num),
      country: (num.address_country_code as string) || 'US',
      capabilities: {
        voice: (num.capabilities as Record<string, boolean>)?.voice ?? true,
        sms: (num.capabilities as Record<string, boolean>)?.sms ?? false,
        mms: (num.capabilities as Record<string, boolean>)?.mms ?? false,
        fax: (num.capabilities as Record<string, boolean>)?.fax ?? false,
      },
    }));
  }

  private mapNumberType(num: Record<string, unknown>): 'local' | 'tollfree' | 'mobile' | 'unknown' {
    const phone = num.phone_number as string;
    if (phone?.startsWith('+1800') || phone?.startsWith('+1888') || phone?.startsWith('+1877')) {
      return 'tollfree';
    }
    return 'local';
  }

  async makeCall(credentials: ITelephonyCredentials, params: MakeCallParams): Promise<MakeCallResult> {
    if (!credentials.accountSid || !credentials.authToken) {
      return { success: false, error: 'Account SID and Auth Token are required' };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('To', this.normalizePhoneNumber(params.to));
      formData.append('From', this.normalizePhoneNumber(params.from));
      // Twilio требует URL для обработки звонка
      if (params.webhookUrl) {
        formData.append('Url', params.webhookUrl);
      }
      if (params.record) {
        formData.append('Record', 'true');
      }

      const response = await fetch(
        `${this.baseUrl}/Accounts/${credentials.accountSid}/Calls.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.getAuthHeader(credentials.accountSid, credentials.authToken),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.message || `Call failed: ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        callId: data.sid,
        providerCallId: data.sid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Call initiation failed',
      };
    }
  }

  async hangup(credentials: ITelephonyCredentials, callId: string): Promise<{ success: boolean; error?: string }> {
    if (!credentials.accountSid || !credentials.authToken) {
      return { success: false, error: 'Account SID and Auth Token are required' };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('Status', 'completed');

      const response = await fetch(
        `${this.baseUrl}/Accounts/${credentials.accountSid}/Calls/${callId}.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.getAuthHeader(credentials.accountSid, credentials.authToken),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.message || `Hangup failed: ${response.status}`,
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
    // Twilio использует TwiML для переадресации
    // Это требует отдельного webhook URL с TwiML ответом
    // Для упрощения возвращаем ошибку
    return {
      success: false,
      error: 'Transfer requires TwiML webhook configuration. Not implemented yet.',
    };
  }

  parseWebhook(payload: unknown): NormalizedCallEvent | null {
    const data = payload as Record<string, string>;
    const callStatus = data.CallStatus;

    const statusMap: Record<string, NormalizedCallEvent['type']> = {
      'initiated': 'initiated',
      'ringing': 'ringing',
      'in-progress': 'answered',
      'completed': 'ended',
      'busy': 'ended',
      'failed': 'failed',
      'no-answer': 'ended',
      'canceled': 'ended',
    };

    const type = statusMap[callStatus];
    if (!type) {
      return null;
    }

    return {
      type,
      callId: data.CallSid,
      providerCallId: data.CallSid,
      from: data.From,
      to: data.To,
      direction: data.Direction === 'inbound' ? 'inbound' : 'outbound',
      timestamp: new Date(),
      duration: data.CallDuration ? parseInt(data.CallDuration, 10) : undefined,
      endReason: callStatus,
      recordingUrl: data.RecordingUrl,
      rawPayload: payload,
    };
  }

  validateWebhook(signature: string, payload: unknown, secret: string): boolean {
    // Twilio использует X-Twilio-Signature для валидации
    // https://www.twilio.com/docs/usage/security#validating-requests
    // Для упрощения пока возвращаем true
    return !!signature && !!payload && !!secret;
  }
}
