import { NextRequest, NextResponse } from 'next/server';
import { updateAIProvider, updateAIProviderSchema } from '@/modules/system-settings';
import { apiAuth } from '@/lib/api-auth';
// import { getUserById } from '@/modules/user'; // Раскомментируйте для production
import { validateAPIKey } from '@/lib/ai/validate-key';

// PATCH /api/system-settings/ai/providers - настроить AI провайдера
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Для production раскомментируйте проверку на администратора:
    // if (authResult.type === 'session' && authResult.userId) {
    //   const user = await getUserById(authResult.userId);
    //   const isAdmin = user?.roles?.includes('admin');
    //   if (!isAdmin) {
    //     return NextResponse.json(
    //       { error: 'Forbidden: Only administrators can configure AI providers' },
    //       { status: 403 }
    //     );
    //   }
    // }

    const body = await request.json();
    const data = updateAIProviderSchema.parse(body);

    // Валидация API ключа только если предоставлен новый ключ
    if (data.apiKey && data.enabled) {
      console.log(`Validating new API key for ${data.provider}...`);

      const validation = await validateAPIKey(data.provider, data.apiKey, data.model);

      if (!validation.valid) {
        return NextResponse.json(
          {
            error: 'Неверный API ключ',
            details: validation.error || 'Проверьте правильность API ключа'
          },
          { status: 400 }
        );
      }

      console.log(`✓ API key validated successfully for ${data.provider}`);
    } else if (!data.apiKey && data.enabled) {
      // Если API ключ не предоставлен, проверим что он уже сохранен
      console.log(`Using existing API key for ${data.provider}, skipping validation`);
    }

    const updatedBy = authResult.type === 'session' ? authResult.userId : undefined;

    const settings = await updateAIProvider(data, updatedBy);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating AI provider:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update AI provider', details: errorMessage },
      { status: 500 }
    );
  }
}
