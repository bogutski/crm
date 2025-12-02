import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import {
  getDictionaryItemById,
  updateDictionaryItem,
  deleteDictionaryItem,
  updateDictionaryItemSchema,
} from '@/modules/dictionary';

interface RouteParams {
  params: Promise<{ code: string; id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const item = await getDictionaryItemById(id);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching dictionary item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dictionary item' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateDictionaryItemSchema.parse(body);

    const item = await updateDictionaryItem(id, data);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating dictionary item:', error);
    return NextResponse.json(
      { error: 'Failed to update dictionary item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteDictionaryItem(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dictionary item:', error);
    return NextResponse.json(
      { error: 'Failed to delete dictionary item' },
      { status: 500 }
    );
  }
}
