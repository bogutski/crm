import { NextRequest, NextResponse } from 'next/server';
import { setActiveAIProvider, setActiveAIProviderSchema } from '@/modules/system-settings';
import { apiAuth } from '@/lib/api-auth';
// import { getUserById } from '@/modules/user'; // Раскомментируйте для production

// POST /api/system-settings/ai/active - установить активного AI провайдера
export async function POST(request: NextRequest) {
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
    //       { error: 'Forbidden: Only administrators can set active AI provider' },
    //       { status: 403 }
    //     );
    //   }
    // }

    const body = await request.json();
    const data = setActiveAIProviderSchema.parse(body);

    const updatedBy = authResult.type === 'session' ? authResult.userId : undefined;

    const settings = await setActiveAIProvider(data, updatedBy);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error setting active AI provider:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to set active AI provider', details: errorMessage },
      { status: 500 }
    );
  }
}
