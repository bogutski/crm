import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import {
  getDictionaryByCode,
  updateDictionary,
  deleteDictionary,
  updateDictionarySchema,
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
    const dictionary = await getDictionaryByCode(code);

    if (!dictionary) {
      return NextResponse.json({ error: 'Dictionary not found' }, { status: 404 });
    }

    return NextResponse.json(dictionary);
  } catch (error) {
    console.error('Error fetching dictionary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dictionary' },
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

    const { code } = await params;
    const body = await request.json();
    const data = updateDictionarySchema.parse(body);

    const dictionary = await updateDictionary(code, data);

    if (!dictionary) {
      return NextResponse.json({ error: 'Dictionary not found' }, { status: 404 });
    }

    return NextResponse.json(dictionary);
  } catch (error) {
    console.error('Error updating dictionary:', error);
    return NextResponse.json(
      { error: 'Failed to update dictionary' },
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

    const { code } = await params;
    const deleted = await deleteDictionary(code);

    if (!deleted) {
      return NextResponse.json({ error: 'Dictionary not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dictionary:', error);
    return NextResponse.json(
      { error: 'Failed to delete dictionary' },
      { status: 500 }
    );
  }
}
