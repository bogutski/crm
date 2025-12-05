import { NextRequest, NextResponse } from 'next/server';
import { apiAuth } from '@/lib/api-auth';
import { getUserById } from '@/modules/user';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { TelephonyProvider } from '@/modules/telephony';
import { getAdapter } from '@/lib/telephony';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/telephony/providers/[id]/test - тест подключения к провайдеру
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    //     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    //   }
    // }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid provider ID' }, { status: 400 });
    }

    await connectToDatabase();

    const provider = await TelephonyProvider.findById(id);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Получаем адаптер для провайдера
    const adapter = getAdapter(provider.code);

    // Валидируем credentials
    const result = await adapter.validateCredentials(provider.credentials);

    if (result.valid) {
      return NextResponse.json({
        success: true,
        message: 'Connection successful',
        accountInfo: result.accountInfo,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Connection failed',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error testing telephony provider:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
