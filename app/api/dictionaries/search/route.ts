import { NextRequest, NextResponse } from 'next/server';
import { getDictionaries } from '@/modules/dictionary';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getDictionaries();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching dictionaries:', error);
    return NextResponse.json(
      { error: 'Failed to search dictionaries' },
      { status: 500 }
    );
  }
}
