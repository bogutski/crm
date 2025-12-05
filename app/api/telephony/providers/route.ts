import { NextRequest, NextResponse } from 'next/server';
import { apiAuth } from '@/lib/api-auth';
import { getUserById } from '@/modules/user';
import { connectToDatabase } from '@/lib/mongodb';
import {
  TelephonyProvider,
  createTelephonyProviderSchema,
  sanitizeProvider,
  TELEPHONY_PROVIDERS,
} from '@/modules/telephony';

// GET /api/telephony/providers - получить список провайдеров
export async function GET(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const providers = await TelephonyProvider.find().sort({ code: 1 });

    // Возвращаем список с санитизированными данными
    const sanitizedProviders = providers.map(sanitizeProvider);

    // Добавляем информацию о доступных провайдерах (которые ещё не настроены)
    const configuredCodes = providers.map((p) => p.code);
    const availableProviders = Object.values(TELEPHONY_PROVIDERS).filter(
      (p) => !configuredCodes.includes(p.code)
    );

    return NextResponse.json({
      providers: sanitizedProviders,
      available: availableProviders,
    });
  } catch (error) {
    console.error('Error fetching telephony providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch telephony providers' },
      { status: 500 }
    );
  }
}

// POST /api/telephony/providers - создать нового провайдера
export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Только администраторы могут добавлять провайдеров
    if (authResult.type === 'session' && authResult.userId) {
      const user = await getUserById(authResult.userId);
      const isAdmin = user?.roles?.includes('admin');
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const data = createTelephonyProviderSchema.parse(body);

    await connectToDatabase();

    // Проверяем, что провайдер с таким кодом ещё не существует
    const existing = await TelephonyProvider.findOne({ code: data.code });
    if (existing) {
      return NextResponse.json(
        { error: `Provider ${data.code} already exists` },
        { status: 400 }
      );
    }

    // Получаем информацию о провайдере
    const providerInfo = TELEPHONY_PROVIDERS[data.code];
    if (!providerInfo) {
      return NextResponse.json(
        { error: `Unknown provider code: ${data.code}` },
        { status: 400 }
      );
    }

    const provider = new TelephonyProvider({
      code: data.code,
      name: data.name || providerInfo.name,
      enabled: data.enabled ?? false,
      credentials: data.credentials || {},
      settings: data.settings || {},
      createdBy: authResult.type === 'session' ? authResult.userId : undefined,
      updatedBy: authResult.type === 'session' ? authResult.userId : undefined,
    });

    await provider.save();

    return NextResponse.json(sanitizeProvider(provider), { status: 201 });
  } catch (error) {
    console.error('Error creating telephony provider:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create telephony provider' },
      { status: 500 }
    );
  }
}
