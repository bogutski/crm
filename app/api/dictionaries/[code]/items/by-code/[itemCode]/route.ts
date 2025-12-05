import { NextRequest, NextResponse } from 'next/server';
import { getDictionaryItemByCode } from '@/modules/dictionary';
import { apiAuth } from '@/lib/api-auth';

interface RouteParams {
  params: Promise<{ code: string; itemCode: string }>;
}

/**
 * GET /api/dictionaries/:code/items/by-code/:itemCode
 * Get dictionary item by its code within a dictionary
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, itemCode } = await params;
    const item = await getDictionaryItemByCode(code, itemCode);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching dictionary item by code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dictionary item' },
      { status: 500 }
    );
  }
}
