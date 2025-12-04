// Telnyx Adapter
// Документация: https://developers.telnyx.com/docs

import {
  ITelephonyAdapter,
  SendCallResult,
  SendMessageResult,
  TransferCallResult,
  HealthCheckResult,
  InboundCallEvent,
  InboundMessageEvent,
} from './types';
import { TelnyxConfig } from '../types';

export class TelnyxAdapter implements ITelephonyAdapter {
  readonly type = 'telnyx';
  readonly name = 'Telnyx';

  private config: TelnyxConfig | null = null;
  private baseUrl = 'https://api.telnyx.com/v2';

  async initialize(config: Record<string, unknown>): Promise<void> {
    this.config = config as unknown as TelnyxConfig;
  }

  private getHeaders(): Record<string, string> {
    if (!this.config) throw new Error('Adapter not initialized');
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private async request(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return fetch(url, options);
  }

  async checkHealth(): Promise<HealthCheckResult> {
    try {
      const start = Date.now();
      const response = await this.request('GET', '/balance');
      const latency = Date.now() - start;

      if (response.ok) {
        return { healthy: true, latency };
      }

      return {
        healthy: false,
        latency,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async makeCall(params: {
    from: string;
    to: string;
    webhookUrl: string;
    timeout?: number;
    machineDetection?: boolean;
  }): Promise<SendCallResult> {
    try {
      const body: Record<string, unknown> = {
        connection_id: this.config?.connectionId,
        from: params.from,
        to: params.to,
        webhook_url: params.webhookUrl,
        webhook_url_method: 'POST',
        timeout_secs: params.timeout || 30,
      };

      if (params.machineDetection) {
        body.answering_machine_detection = 'detect';
      }

      const response = await this.request('POST', '/calls', body);
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          callId: data.data?.call_control_id,
          providerResponse: data,
        };
      }

      return {
        success: false,
        error: data.errors?.[0]?.detail || 'Failed to make call',
        providerResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async answerCall(callId: string): Promise<void> {
    await this.request('POST', `/calls/${callId}/actions/answer`);
  }

  async hangupCall(callId: string): Promise<void> {
    await this.request('POST', `/calls/${callId}/actions/hangup`);
  }

  async holdCall(callId: string): Promise<void> {
    await this.request('POST', `/calls/${callId}/actions/hold`, {
      audio_url: 'https://api.telnyx.com/v2/media/hold_music.mp3',
    });
  }

  async unholdCall(callId: string): Promise<void> {
    await this.request('POST', `/calls/${callId}/actions/unhold`);
  }

  async transferCall(params: {
    callId: string;
    to: string;
    type: 'blind' | 'warm';
    announcementUrl?: string;
  }): Promise<TransferCallResult> {
    try {
      const body: Record<string, unknown> = {
        to: params.to,
      };

      if (params.announcementUrl) {
        body.audio_url = params.announcementUrl;
      }

      // Telnyx uses different endpoints for blind vs attended transfer
      const endpoint = params.type === 'blind'
        ? `/calls/${params.callId}/actions/transfer`
        : `/calls/${params.callId}/actions/bridge`;

      const response = await this.request('POST', endpoint, body);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          newCallId: data.data?.call_control_id,
          providerResponse: data,
        };
      }

      const data = await response.json();
      return {
        success: false,
        error: data.errors?.[0]?.detail || 'Transfer failed',
        providerResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async transferToSip(params: {
    callId: string;
    sipUri: string;
  }): Promise<TransferCallResult> {
    try {
      const response = await this.request(
        'POST',
        `/calls/${params.callId}/actions/transfer`,
        {
          to: params.sipUri,
          sip_transport_protocol: 'UDP',
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          newCallId: data.data?.call_control_id,
          providerResponse: data,
        };
      }

      const data = await response.json();
      return {
        success: false,
        error: data.errors?.[0]?.detail || 'SIP transfer failed',
        providerResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendSms(params: {
    from: string;
    to: string;
    body: string;
    mediaUrls?: string[];
  }): Promise<SendMessageResult> {
    try {
      const body: Record<string, unknown> = {
        from: params.from,
        to: params.to,
        text: params.body,
        type: params.mediaUrls?.length ? 'MMS' : 'SMS',
      };

      if (params.mediaUrls?.length) {
        body.media_urls = params.mediaUrls;
      }

      const response = await this.request('POST', '/messages', body);
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          externalId: data.data?.id,
          providerResponse: data,
        };
      }

      return {
        success: false,
        error: data.errors?.[0]?.detail || 'Failed to send SMS',
        providerResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async startRecording(callId: string): Promise<{ recordingId: string }> {
    const response = await this.request(
      'POST',
      `/calls/${callId}/actions/record_start`,
      {
        format: 'mp3',
        channels: 'dual',
      }
    );
    const data = await response.json();
    return { recordingId: data.data?.recording_id || callId };
  }

  async stopRecording(callId: string): Promise<{ recordingUrl?: string }> {
    const response = await this.request(
      'POST',
      `/calls/${callId}/actions/record_stop`
    );
    const data = await response.json();
    return {
      recordingUrl: data.data?.recording_url,
    };
  }

  async playText(callId: string, text: string, voice?: string): Promise<void> {
    await this.request('POST', `/calls/${callId}/actions/speak`, {
      payload: text,
      voice: voice || 'female',
      language: 'ru-RU',
    });
  }

  async playAudio(callId: string, audioUrl: string): Promise<void> {
    await this.request('POST', `/calls/${callId}/actions/playback_start`, {
      audio_url: audioUrl,
    });
  }

  async parseWebhook(request: Request): Promise<InboundCallEvent | InboundMessageEvent | null> {
    const data = await request.json();
    const eventType = data.data?.event_type;
    const payload = data.data?.payload;

    // Call events
    if (eventType?.startsWith('call.')) {
      return {
        callId: payload?.call_control_id || payload?.call_session_id,
        from: payload?.from,
        to: payload?.to,
        direction: 'inbound',
        status: this.mapCallStatus(eventType),
        timestamp: new Date(data.data?.occurred_at || Date.now()),
        duration: payload?.duration_secs,
        recordingUrl: payload?.recording_url,
        metadata: payload,
      };
    }

    // Message events
    if (eventType === 'message.received') {
      return {
        messageId: payload?.id,
        from: payload?.from?.phone_number,
        to: payload?.to?.[0]?.phone_number,
        body: payload?.text || '',
        mediaUrls: payload?.media?.map((m: { url: string }) => m.url) || [],
        timestamp: new Date(data.data?.occurred_at || Date.now()),
        metadata: payload,
      };
    }

    return null;
  }

  async validateWebhook(request: Request): Promise<boolean> {
    // Telnyx webhook validation using signature
    const signature = request.headers.get('telnyx-signature-ed25519');
    const timestamp = request.headers.get('telnyx-timestamp');

    if (!signature || !timestamp) return false;

    // For production, implement proper signature validation
    // https://developers.telnyx.com/docs/v2/call-control/webhttp-hooks#signature-validation
    return true;
  }

  private mapCallStatus(
    eventType: string
  ): 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'no-answer' {
    const statusMap: Record<string, 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'no-answer'> = {
      'call.initiated': 'ringing',
      'call.ringing': 'ringing',
      'call.answered': 'answered',
      'call.hangup': 'completed',
      'call.machine.detection.ended': 'answered',
      'call.bridged': 'answered',
    };
    return statusMap[eventType] || 'failed';
  }

  generateRingingResponse(params: {
    timeout?: number;
    webhookUrl: string;
  }): string {
    // Telnyx uses TeXML
    const timeout = params.timeout || 30;
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="${timeout}" action="${params.webhookUrl}" method="POST">
  </Dial>
</Response>`;
  }

  generateForwardResponse(params: {
    to: string;
    callerId?: string;
    timeout?: number;
  }): string {
    const timeout = params.timeout || 30;
    const callerId = params.callerId ? `callerId="${params.callerId}"` : '';
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="${timeout}" ${callerId}>
    <Number>${params.to}</Number>
  </Dial>
</Response>`;
  }

  generateVoicemailResponse(params: {
    greeting?: string;
    maxLength?: number;
    transcribe?: boolean;
    webhookUrl: string;
  }): string {
    const greeting = params.greeting || 'Оставьте сообщение после сигнала.';
    const maxLength = params.maxLength || 120;

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="female" language="ru-RU">${greeting}</Say>
  <Record maxLength="${maxLength}" action="${params.webhookUrl}" method="POST" />
</Response>`;
  }
}

export default TelnyxAdapter;
