import { NextRequest, NextResponse } from 'next/server';
import {
  getUserPhoneLineById,
  updateUserPhoneLine,
  deleteUserPhoneLine,
  updateUserPhoneLineSchema,
} from '@/modules/phone-line';
import { apiAuth } from '@/lib/api-auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const line = await getUserPhoneLineById(id);

    if (!line) {
      return NextResponse.json({ error: 'Phone line not found' }, { status: 404 });
    }

    return NextResponse.json(line);
  } catch (error) {
    console.error('Error getting phone line:', error);
    return NextResponse.json(
      { error: 'Failed to get phone line' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateUserPhoneLineSchema.parse(body);

    const line = await updateUserPhoneLine(id, data);

    if (!line) {
      return NextResponse.json({ error: 'Phone line not found' }, { status: 404 });
    }

    return NextResponse.json(line);
  } catch (error) {
    console.error('Error updating phone line:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update phone line' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteUserPhoneLine(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Phone line not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting phone line:', error);
    return NextResponse.json(
      { error: 'Failed to delete phone line' },
      { status: 500 }
    );
  }
}
