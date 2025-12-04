import { NextRequest, NextResponse } from 'next/server';
import {
  createUserPhoneLine,
  createUserPhoneLineSchema,
  isPhoneNumberAvailable,
} from '@/modules/phone-line';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createUserPhoneLineSchema.parse(body);

    // Проверяем уникальность номера
    const isAvailable = await isPhoneNumberAvailable(data.phoneNumber);
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Этот номер телефона уже используется' },
        { status: 400 }
      );
    }

    const line = await createUserPhoneLine(data);
    return NextResponse.json(line, { status: 201 });
  } catch (error) {
    console.error('Error creating phone line:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create phone line' },
      { status: 500 }
    );
  }
}
