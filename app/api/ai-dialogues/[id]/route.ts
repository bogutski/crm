import { NextRequest, NextResponse } from 'next/server';
import { apiAuth } from '@/lib/api-auth';
import { getDialogue, updateDialogueStatus, deleteDialogue } from '@/modules/ai-dialogue';

// GET /api/ai-dialogues/[id] - Получить конкретный диалог
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // В Next.js 15+ params теперь асинхронный
    const { id } = await params;

    // Проверка авторизации
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Получаем диалог
    const dialogue = await getDialogue(id);

    if (!dialogue) {
      return NextResponse.json({ error: 'Dialogue not found' }, { status: 404 });
    }

    // Проверяем, что диалог принадлежит пользователю
    if (dialogue.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ dialogue });
  } catch (error) {
    console.error('Error fetching dialogue:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch dialogue', details: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH /api/ai-dialogues/[id] - Обновить статус диалога
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // В Next.js 15+ params теперь асинхронный
    const { id } = await params;

    // Проверка авторизации
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Проверяем, что диалог принадлежит пользователю
    const dialogue = await getDialogue(id);
    if (!dialogue) {
      return NextResponse.json({ error: 'Dialogue not found' }, { status: 404 });
    }

    if (dialogue.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Получаем данные из тела запроса
    const { status } = await request.json();

    if (!status || !['active', 'completed', 'error'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Обновляем статус
    const updatedDialogue = await updateDialogueStatus(id, status);

    return NextResponse.json({ dialogue: updatedDialogue });
  } catch (error) {
    console.error('Error updating dialogue:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update dialogue', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/ai-dialogues/[id] - Удалить диалог
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // В Next.js 15+ params теперь асинхронный
    const { id } = await params;

    // Проверка авторизации
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Проверяем, что диалог принадлежит пользователю
    const dialogue = await getDialogue(id);
    if (!dialogue) {
      return NextResponse.json({ error: 'Dialogue not found' }, { status: 404 });
    }

    if (dialogue.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Удаляем диалог
    await deleteDialogue(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dialogue:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete dialogue', details: errorMessage },
      { status: 500 }
    );
  }
}
