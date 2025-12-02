import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import {
  getDictionaryItems,
  getDictionaryItemsTree,
  createDictionaryItem,
  updateItemsOrder,
  createDictionaryItemSchema,
  updateItemsOrderSchema,
} from '@/modules/dictionary';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const tree = searchParams.get('tree') === 'true';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (tree) {
      const items = await getDictionaryItemsTree(code);
      return NextResponse.json({ items, total: items.length });
    }

    const result = await getDictionaryItems(code, includeInactive);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching dictionary items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dictionary items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await params;
    const body = await request.json();
    const data = createDictionaryItemSchema.parse({
      ...body,
      dictionaryCode: code,
    });

    const item = await createDictionaryItem(data);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating dictionary item:', error);
    return NextResponse.json(
      { error: 'Failed to create dictionary item' },
      { status: 500 }
    );
  }
}

// Обновление порядка элементов (для drag-and-drop)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateItemsOrderSchema.parse(body);

    await updateItemsOrder(data.items);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating items order:', error);
    return NextResponse.json(
      { error: 'Failed to update items order' },
      { status: 500 }
    );
  }
}
