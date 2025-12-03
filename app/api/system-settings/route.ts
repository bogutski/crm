import { NextRequest, NextResponse } from 'next/server';
import {
  getSystemSettings,
  updateSystemSettings,
  updateSystemSettingsSchema,
} from '@/modules/system-settings';
import { apiAuth } from '@/lib/api-auth';
import { getUserById } from '@/modules/user';

// GET /api/system-settings - получить системные настройки
export async function GET(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getSystemSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/system-settings - обновить системные настройки
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Только администраторы могут изменять системные настройки
    if (authResult.type === 'session' && authResult.userId) {
      const user = await getUserById(authResult.userId);
      const isAdmin = user?.roles?.includes('admin');
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const data = updateSystemSettingsSchema.parse(body);

    const updatedBy = authResult.type === 'session'
      ? authResult.userId
      : undefined;

    const settings = await updateSystemSettings(data, updatedBy);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}
