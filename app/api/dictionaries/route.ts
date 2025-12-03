import { NextRequest, NextResponse } from 'next/server';
import { createDictionary, createDictionarySchema } from '@/modules/dictionary';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createDictionarySchema.parse(body);

    const dictionary = await createDictionary(data);
    return NextResponse.json(dictionary, { status: 201 });
  } catch (error) {
    console.error('Error creating dictionary:', error);
    return NextResponse.json(
      { error: 'Failed to create dictionary' },
      { status: 500 }
    );
  }
}
