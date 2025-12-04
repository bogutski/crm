import { NextRequest, NextResponse } from 'next/server';
import {
  getCallRoutingRules,
  searchCallRoutingRulesSchema,
} from '@/modules/routing-rule';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const options = searchCallRoutingRulesSchema.parse(body);

    const result = await getCallRoutingRules(options);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching routing rules:', error);
    return NextResponse.json(
      { error: 'Failed to search routing rules' },
      { status: 500 }
    );
  }
}
