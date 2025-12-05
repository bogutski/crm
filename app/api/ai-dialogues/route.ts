import { NextRequest, NextResponse } from 'next/server';
import { apiAuth } from '@/lib/api-auth';
import { getUserDialogues, getUserDialogueStats, createDialogue } from '@/modules/ai-dialogue';
import { getSystemSettingsInternal } from '@/modules/system-settings';

// GET /api/ai-dialogues - Получить список диалогов пользователя
export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.userId;
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

// POST /api/ai-dialogues - Создать новый диалог
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Получаем настройки AI провайдера
    const settings = await getSystemSettingsInternal();
    const activeProvider = settings.ai?.activeProvider as 'openai' | 'anthropic' | 'google' | undefined;

    if (!activeProvider) {
      return NextResponse.json(
        { error: 'No active AI provider configured' },
        { status: 400 }
      );
    }

    const providerConfig = settings.ai?.providers?.[activeProvider];
    if (!providerConfig?.enabled || !providerConfig?.apiKey) {
      return NextResponse.json(
        { error: 'AI provider is not properly configured' },
        { status: 400 }
      );
    }

    // Создаём диалог с провайдером и моделью
    const dialogue = await createDialogue({
      userId,
      title: 'Новый диалог',
      provider: activeProvider,
      model: providerConfig.model,
    });

    return NextResponse.json({
      dialogue: {
        _id: dialogue._id.toString(),
        title: dialogue.title,
        createdAt: dialogue.createdAt,
        updatedAt: dialogue.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating dialogue:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create dialogue', details: errorMessage },
      { status: 500 }
    );
  }
}
