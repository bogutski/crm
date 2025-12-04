import { NextRequest, NextResponse } from 'next/server';
import {
  getCallRoutingRuleById,
  updateCallRoutingRule,
  deleteCallRoutingRule,
  updateCallRoutingRuleSchema,
} from '@/modules/routing-rule';
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
    const rule = await getCallRoutingRuleById(id);

    if (!rule) {
      return NextResponse.json({ error: 'Routing rule not found' }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error getting routing rule:', error);
    return NextResponse.json(
      { error: 'Failed to get routing rule' },
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
    const data = updateCallRoutingRuleSchema.parse(body);

    const rule = await updateCallRoutingRule(id, data);

    if (!rule) {
      return NextResponse.json({ error: 'Routing rule not found' }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating routing rule:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update routing rule' },
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
    const deleted = await deleteCallRoutingRule(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Routing rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting routing rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete routing rule' },
      { status: 500 }
    );
  }
}
