// Twilio Adapter
// Документация: https://www.twilio.com/docs

import {
  ITelephonyAdapter,
  SendCallResult,
  SendMessageResult,
  TransferCallResult,
  HealthCheckResult,
  InboundCallEvent,
  InboundMessageEvent,
} from './types';
import { TwilioConfig } from '../types';

export class TwilioAdapter implements ITelephonyAdapter {
  readonly type = 'twilio';
  readonly name = 'Twilio';

  private config: TwilioConfig | null = null;
  private baseUrl = 'https://api.twilio.com/2010-04-01';

  async initialize(config: Record<string, unknown>): Promise<void> {
    this.config = config as unknown as TwilioConfig;
  }

  private getAuthHeader(): string {
    if (!this.config) throw new Error('Adapter not initialized');
    const credentials = Buffer.from(
      `${this.config.accountSid}:${this.config.authToken}`
    ).toString('base64');
    return `Basic ${credentials}`;
  }

  private async request(
    method: string,
    endpoint: string,
    body?: Record<string, string>
  ): Promise<Response> {
    if (!this.config) throw new Error('Adapter not initialized');

    const url = `${this.baseUrl}/Accounts/${this.config.accountSid}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    if (body) {
      options.body = new URLSearchParams(body).toString();
    }

    return fetch(url, options);
  }

  async checkHealth(): Promise<HealthCheckResult> {
    try {
      const start = Date.now();
      const response = await this.request('GET', '.json');
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
      const body: Record<string, string> = {
        From: params.from,
        To: params.to,
        Url: params.webhookUrl,
        Method: 'POST',
      };

      if (params.timeout) {
        body.Timeout = params.timeout.toString();
      }

      if (params.machineDetection) {
        body.MachineDetection = 'Enable';
      }

      const response = await this.request('POST', '/Calls.json', body);
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          callId: data.sid,
          providerResponse: data,
        };
      }

      return {
        success: false,
        error: data.message || 'Failed to make call',
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
    await this.request('POST', `/Calls/${callId}.json`, {
      Status: 'in-progress',
    });
  }

  async hangupCall(callId: string): Promise<void> {
    await this.request('POST', `/Calls/${callId}.json`, {
      Status: 'completed',
    });
  }

  async holdCall(callId: string): Promise<void> {
    // Twilio uses conference for hold functionality
    // This is a simplified implementation
    await this.request('POST', `/Calls/${callId}.json`, {
      Twiml: '<Response><Play loop="0">http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-B4.mp3</Play></Response>',
    });
  }

  async unholdCall(callId: string): Promise<void> {
    // Resume call - implementation depends on conference setup
    console.log('Unhold call:', callId);
  }

  async transferCall(params: {
    callId: string;
    to: string;
    type: 'blind' | 'warm';
    announcementUrl?: string;
  }): Promise<TransferCallResult> {
    try {
      if (params.type === 'blind') {
        // Blind transfer using TwiML
        const twiml = `<Response><Dial>${params.to}</Dial></Response>`;
        const response = await this.request('POST', `/Calls/${params.callId}.json`, {
          Twiml: twiml,
        });

        if (response.ok) {
          return { success: true };
        }

        const data = await response.json();
        return { success: false, error: data.message };
      }

      // Warm transfer - more complex, requires conference
      // This is a simplified implementation
      const twiml = params.announcementUrl
        ? `<Response><Play>${params.announcementUrl}</Play><Dial>${params.to}</Dial></Response>`
        : `<Response><Dial>${params.to}</Dial></Response>`;

      const response = await this.request('POST', `/Calls/${params.callId}.json`, {
        Twiml: twiml,
      });

      if (response.ok) {
        return { success: true };
      }

      const data = await response.json();
      return { success: false, error: data.message };
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
      const twiml = `<Response><Dial><Sip>${params.sipUri}</Sip></Dial></Response>`;
      const response = await this.request('POST', `/Calls/${params.callId}.json`, {
        Twiml: twiml,
      });

      if (response.ok) {
        return { success: true };
      }

      const data = await response.json();
      return { success: false, error: data.message };
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
      const body: Record<string, string> = {
        From: params.from,
        To: params.to,
        Body: params.body,
      };

      if (params.mediaUrls?.length) {
        params.mediaUrls.forEach((url, i) => {
          body[`MediaUrl${i}`] = url;
        });
      }

      const response = await this.request('POST', '/Messages.json', body);
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          externalId: data.sid,
          providerResponse: data,
        };
      }

      return {
        success: false,
        error: data.message || 'Failed to send SMS',
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
    const response = await this.request('POST', `/Calls/${callId}/Recordings.json`);
    const data = await response.json();
    return { recordingId: data.sid };
  }

  async stopRecording(callId: string): Promise<{ recordingUrl?: string }> {
    // Get recordings for the call
    const response = await this.request('GET', `/Calls/${callId}/Recordings.json`);
    const data = await response.json();

    if (data.recordings?.length > 0) {
      const recording = data.recordings[0];
      // Stop the recording
      await this.request('POST', `/Recordings/${recording.sid}.json`, {
        Status: 'stopped',
      });

      return {
        recordingUrl: `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`,
      };
    }

    return {};
  }

  async playText(callId: string, text: string, voice?: string): Promise<void> {
    const voiceAttr = voice || 'alice';
    const twiml = `<Response><Say voice="${voiceAttr}" language="ru-RU">${text}</Say></Response>`;
    await this.request('POST', `/Calls/${callId}.json`, { Twiml: twiml });
  }

  async playAudio(callId: string, audioUrl: string): Promise<void> {
    const twiml = `<Response><Play>${audioUrl}</Play></Response>`;
    await this.request('POST', `/Calls/${callId}.json`, { Twiml: twiml });
  }

  async parseWebhook(request: Request): Promise<InboundCallEvent | InboundMessageEvent | null> {
    const formData = await request.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Check if it's a call event
    if (data.CallSid) {
      return {
        callId: data.CallSid,
        from: data.From,
        to: data.To,
        direction: 'inbound',
        status: this.mapCallStatus(data.CallStatus),
        timestamp: new Date(),
        duration: data.CallDuration ? parseInt(data.CallDuration, 10) : undefined,
        recordingUrl: data.RecordingUrl,
        metadata: data,
      };
    }

    // Check if it's a message event
    if (data.MessageSid) {
      const mediaUrls: string[] = [];
      const numMedia = parseInt(data.NumMedia || '0', 10);
      for (let i = 0; i < numMedia; i++) {
        if (data[`MediaUrl${i}`]) {
          mediaUrls.push(data[`MediaUrl${i}`]);
        }
      }

      return {
        messageId: data.MessageSid,
        from: data.From,
        to: data.To,
        body: data.Body || '',
        mediaUrls,
        timestamp: new Date(),
        metadata: data,
      };
    }

    return null;
  }

  async validateWebhook(request: Request): Promise<boolean> {
    // Twilio webhook validation using X-Twilio-Signature
    // Full implementation requires the Twilio library or manual HMAC validation
    const signature = request.headers.get('X-Twilio-Signature');
    if (!signature) return false;

    // For production, implement proper signature validation
    // https://www.twilio.com/docs/usage/security#validating-requests
    return true;
  }

  private mapCallStatus(
    status: string
  ): 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'no-answer' {
    const statusMap: Record<string, 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'no-answer'> = {
      'queued': 'ringing',
      'ringing': 'ringing',
      'in-progress': 'answered',
      'completed': 'completed',
      'failed': 'failed',
      'busy': 'busy',
      'no-answer': 'no-answer',
      'canceled': 'failed',
    };
    return statusMap[status] || 'failed';
  }

  generateRingingResponse(params: {
    timeout?: number;
    webhookUrl: string;
  }): string {
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
    const transcribe = params.transcribe !== false;

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="ru-RU">${greeting}</Say>
  <Record maxLength="${maxLength}" ${transcribe ? 'transcribe="true"' : ''} action="${params.webhookUrl}" method="POST" />
</Response>`;
  }
}

export default TwilioAdapter;
