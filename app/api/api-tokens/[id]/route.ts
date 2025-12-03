import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import {
  getApiTokenById,
  updateApiToken,
  deleteApiToken,
  updateApiTokenSchema,
} from '@/modules/api-token';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const token = await getApiTokenById(id);

    if (!token) {
      return NextResponse.json({ error: 'API token not found' }, { status: 404 });
    }

    return NextResponse.json(token);
  } catch (error) {
    console.error('Error fetching API token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API token' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateApiTokenSchema.parse(body);

    const token = await updateApiToken(id, data);

    if (!token) {
      return NextResponse.json({ error: 'API token not found' }, { status: 404 });
    }

    return NextResponse.json(token);
  } catch (error) {
    console.error('Error updating API token:', error);
    return NextResponse.json(
      { error: 'Failed to update API token' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteApiToken(id);

    if (!deleted) {
      return NextResponse.json({ error: 'API token not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API token:', error);
    return NextResponse.json(
      { error: 'Failed to delete API token' },
      { status: 500 }
    );
  }
}
