import { NextRequest, NextResponse } from 'next/server';
import { createContact, createContactSchema } from '@/modules/contact';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createContactSchema.parse(body);

    // При API токене ownerId не задаётся (глобальный доступ)
    const ownerId = authResult.type === 'session' ? authResult.userId : undefined;

    const contact = await createContact({
      ...data,
      ownerId,
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
