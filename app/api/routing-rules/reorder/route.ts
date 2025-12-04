import { NextRequest, NextResponse } from 'next/server';
import { reorderRules } from '@/modules/routing-rule';
import { apiAuth } from '@/lib/api-auth';
import { z } from 'zod';

const reorderSchema = z.object({
  phoneLineId: z.string().min(1, 'ID линии обязателен'),
  ruleIds: z.array(z.string()).min(1, 'Требуется хотя бы один ID правила'),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneLineId, ruleIds } = reorderSchema.parse(body);

    await reorderRules(phoneLineId, ruleIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering rules:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reorder rules' },
      { status: 500 }
    );
  }
}
