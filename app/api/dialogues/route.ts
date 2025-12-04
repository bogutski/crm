import { NextRequest, NextResponse } from 'next/server';
import { apiAuth } from '@/lib/api-auth';
import { getUserDialogues, getUserDialogueStats } from '@/modules/ai-dialogue';

// GET /api/dialogues - Получить список диалогов пользователя
export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.userId || authResult.apiToken?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Получаем параметры из query
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const status = searchParams.get('status') as 'active' | 'completed' | 'error' | undefined;

    // Получаем диалоги
    const { dialogues, total } = await getUserDialogues(userId, {
      limit,
      skip,
      status,
    });

    // Получаем статистику
    const stats = await getUserDialogueStats(userId);

    return NextResponse.json({
      dialogues,
      total,
      stats,
      pagination: {
        limit,
        skip,
        hasMore: skip + dialogues.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching dialogues:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch dialogues', details: errorMessage },
      { status: 500 }
    );
  }
}
