import { NextRequest, NextResponse } from 'next/server';
import { apiAuth } from '@/lib/api-auth';
import { getUserById } from '@/modules/user';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import {
  TelephonyProvider,
  sanitizeProvider,
  TELEPHONY_PROVIDERS,
  TelephonyProviderCode,
} from '@/modules/telephony';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/telephony/providers/[id]/activate - активировать провайдера
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

    // Проверяем, что провайдер включен
    if (!provider.enabled) {
      return NextResponse.json(
        { error: 'Provider must be enabled before activation' },
        { status: 400 }
      );
    }

    // Проверяем, что есть необходимые credentials
    const providerInfo = TELEPHONY_PROVIDERS[provider.code as TelephonyProviderCode];
    const missingCredentials: string[] = [];

    for (const cred of providerInfo.requiredCredentials) {
      const value = provider.credentials?.[cred.field];
      if (!value) {
        missingCredentials.push(cred.label);
      }
    }

    if (missingCredentials.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required credentials',
          missing: missingCredentials,
        },
        { status: 400 }
      );
    }

    // Деактивируем все остальные провайдеры
    await TelephonyProvider.updateMany(
      { _id: { $ne: provider._id } },
      { $set: { isActive: false } }
    );

    // Активируем текущего провайдера
    provider.isActive = true;
    provider.updatedBy = authResult.type === 'session'
      ? new mongoose.Types.ObjectId(authResult.userId)
      : undefined;

    await provider.save();

    return NextResponse.json(sanitizeProvider(provider));
  } catch (error) {
    console.error('Error activating telephony provider:', error);
    return NextResponse.json(
      { error: 'Failed to activate telephony provider' },
      { status: 500 }
    );
  }
}

// DELETE /api/telephony/providers/[id]/activate - деактивировать провайдера
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    provider.isActive = false;
    provider.updatedBy = authResult.type === 'session'
      ? new mongoose.Types.ObjectId(authResult.userId)
      : undefined;

    await provider.save();

    return NextResponse.json(sanitizeProvider(provider));
  } catch (error) {
    console.error('Error deactivating telephony provider:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate telephony provider' },
      { status: 500 }
    );
  }
}
