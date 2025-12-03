import { NextRequest, NextResponse } from 'next/server';
import {
  getInteractionById,
  updateInteraction,
  deleteInteraction,
  updateInteractionSchema,
} from '@/modules/interaction';
import { apiAuth } from '@/lib/api-auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const interaction = await getInteractionById(id);

    if (!interaction) {
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 });
    }

    return NextResponse.json(interaction);
  } catch (error) {
    console.error('Error fetching interaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interaction' },
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
    const data = updateInteractionSchema.parse(body);

    const interaction = await updateInteraction(id, data);

    if (!interaction) {
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 });
    }

    return NextResponse.json(interaction);
  } catch (error) {
    console.error('Error updating interaction:', error);
    return NextResponse.json(
      { error: 'Failed to update interaction' },
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
    const deleted = await deleteInteraction(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting interaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete interaction' },
      { status: 500 }
    );
  }
}
