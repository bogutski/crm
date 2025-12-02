import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import {
  getDictionaries,
  createDictionary,
  createDictionarySchema,
} from '@/modules/dictionary';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getDictionaries();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching dictionaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dictionaries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
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
