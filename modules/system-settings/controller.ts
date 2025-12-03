import SystemSettings, { ISystemSettings } from './model';
import {
  UpdateSystemSettingsDTO,
  SystemSettingsResponse,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';

// Значения по умолчанию
const DEFAULT_SETTINGS = {
  currency: 'RUB',
  currencySymbol: '₽',
  currencyPosition: 'after' as const,
};

function toSystemSettingsResponse(settings: ISystemSettings): SystemSettingsResponse {
  return {
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    currencyPosition: settings.currencyPosition,
    updatedAt: settings.updatedAt,
    updatedBy: settings.updatedBy?.toString(),
  };
}

// Получить системные настройки (создать с дефолтами если не существует)
export async function getSystemSettings(): Promise<SystemSettingsResponse> {
  await dbConnect();

  let settings = await SystemSettings.findOne();

  // Если настройки не существуют, создаём с дефолтными значениями
  if (!settings) {
    settings = await SystemSettings.create(DEFAULT_SETTINGS);
  }

  return toSystemSettingsResponse(settings);
}

// Обновить системные настройки
export async function updateSystemSettings(
  data: UpdateSystemSettingsDTO,
  updatedBy?: string
): Promise<SystemSettingsResponse> {
  await dbConnect();

  const updateData: Record<string, unknown> = { ...data };
  if (updatedBy) {
    updateData.updatedBy = updatedBy;
  }

  // Используем upsert для создания или обновления единственного документа
  const settings = await SystemSettings.findOneAndUpdate(
    {},
    { $set: updateData },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return toSystemSettingsResponse(settings);
}
