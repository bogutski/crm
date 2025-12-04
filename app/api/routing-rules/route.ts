import { NextRequest, NextResponse } from 'next/server';
import {
  createCallRoutingRule,
  createCallRoutingRuleSchema,
} from '@/modules/routing-rule';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createCallRoutingRuleSchema.parse(body);

    const rule = await createCallRoutingRule(data);
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating routing rule:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create routing rule' },
      { status: 500 }
    );
  }
}
