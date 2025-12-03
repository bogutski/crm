import { NextRequest, NextResponse } from 'next/server';
import {
  getUserPhoneLines,
  searchUserPhoneLinesSchema,
} from '@/modules/phone-line';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const options = searchUserPhoneLinesSchema.parse(body);

    const result = await getUserPhoneLines(options);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching phone lines:', error);
    return NextResponse.json(
      { error: 'Failed to search phone lines' },
      { status: 500 }
    );
  }
}
