import { NextRequest, NextResponse } from 'next/server';
import { getUserPhoneLineByNumber } from '@/modules/phone-line';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log('Recording webhook from Twilio:', data);

    const recordingUrl = data.RecordingUrl;
    const transcriptionText = data.TranscriptionText;
    const callSid = data.CallSid;
    const from = data.From;
    const to = data.To;

    // Find phone line and owner
    const phoneLine = await getUserPhoneLineByNumber(to);

    if (phoneLine) {
      // TODO: Create interaction record in CRM
      // TODO: Send notification to manager
      // TODO: Create task if configured

      console.log('Recording saved:', {
        phoneLineId: phoneLine.id,
        userId: phoneLine.userId,
        from,
        recordingUrl,
        transcription: transcriptionText,
        callSid,
      });

      // Here you would:
      // 1. Create an Interaction record
      // 2. Send push/email notification to the manager
      // 3. Create a follow-up task if the rule says so
    }

    // Twilio expects empty response or simple acknowledgment
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="ru-RU">Сообщение записано. До свидания.</Say>
  <Hangup/>
</Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  } catch (error) {
    console.error('Error handling recording webhook:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
