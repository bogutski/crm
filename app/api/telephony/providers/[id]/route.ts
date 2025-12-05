import { NextRequest, NextResponse } from 'next/server';
import { apiAuth } from '@/lib/api-auth';
import { getUserById } from '@/modules/user';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import {
  TelephonyProvider,
  updateTelephonyProviderSchema,
  sanitizeProvider,
} from '@/modules/telephony';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/telephony/providers/[id] - получить провайдера по ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid provider ID' }, { status: 400 });
    }

    await connectToDatabase();

    const provider = await TelephonyProvider.findById(id);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json(sanitizeProvider(provider));
  } catch (error) {
    console.error('Error fetching telephony provider:', error);
    return NextResponse.json(
      { error: 'Failed to fetch telephony provider' },
      { status: 500 }
    );
  }
}

// PATCH /api/telephony/providers/[id] - обновить провайдера
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const data = updateTelephonyProviderSchema.parse(body);

    await connectToDatabase();

    const provider = await TelephonyProvider.findById(id);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Обновляем поля
    if (data.name !== undefined) {
      provider.name = data.name;
    }
    if (data.enabled !== undefined) {
      provider.enabled = data.enabled;
    }
    if (data.webhookSecret !== undefined) {
      provider.webhookSecret = data.webhookSecret;
    }
    if (data.settings) {
      provider.settings = { ...provider.settings, ...data.settings };
    }

    // Обновляем credentials (мержим с существующими)
    if (data.credentials) {
      provider.credentials = {
        ...provider.credentials,
        ...data.credentials,
      };
    }

    provider.updatedBy = authResult.type === 'session'
      ? new mongoose.Types.ObjectId(authResult.userId)
      : undefined;

    await provider.save();

    return NextResponse.json(sanitizeProvider(provider));
  } catch (error) {
    console.error('Error updating telephony provider:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update telephony provider' },
      { status: 500 }
    );
  }
}

// DELETE /api/telephony/providers/[id] - удалить провайдера
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

    // Нельзя удалять активного провайдера
    if (provider.isActive) {
      return NextResponse.json(
        { error: 'Cannot delete active provider. Deactivate it first.' },
        { status: 400 }
      );
    }

    await TelephonyProvider.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting telephony provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete telephony provider' },
      { status: 500 }
    );
  }
}
