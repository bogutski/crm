import SystemSettings, { ISystemSettings, AIProvider } from './model';
import {
  UpdateSystemSettingsDTO,
  SystemSettingsResponse,
  UpdateAIProviderDTO,
  SetActiveAIProviderDTO,
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
    ai: settings.ai
      ? {
          activeProvider: settings.ai.activeProvider,
          providers: {
            openai: settings.ai.providers.openai
              ? {
                  enabled: settings.ai.providers.openai.enabled,
                  model: settings.ai.providers.openai.model,
                  hasApiKey: !!settings.ai.providers.openai.apiKey,
                }
              : undefined,
            anthropic: settings.ai.providers.anthropic
              ? {
                  enabled: settings.ai.providers.anthropic.enabled,
                  model: settings.ai.providers.anthropic.model,
                  hasApiKey: !!settings.ai.providers.anthropic.apiKey,
                }
              : undefined,
            google: settings.ai.providers.google
              ? {
                  enabled: settings.ai.providers.google.enabled,
                  model: settings.ai.providers.google.model,
                  hasApiKey: !!settings.ai.providers.google.apiKey,
                }
              : undefined,
          },
        }
      : undefined,
    updatedAt: settings.updatedAt,
    updatedBy: settings.updatedBy?.toString(),
  };
}

// Внутренняя функция для получения полных настроек (с API ключами)
export async function getSystemSettingsInternal(): Promise<ISystemSettings> {
  await dbConnect();

  let settings = await SystemSettings.findOne();

  // Если настройки не существуют, создаём с дефолтными значениями
  if (!settings) {
    settings = await SystemSettings.create(DEFAULT_SETTINGS);
  }

  return settings;
}

// Получить системные настройки (создать с дефолтами если не существует)
export async function getSystemSettings(): Promise<SystemSettingsResponse> {
  const settings = await getSystemSettingsInternal();
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

// Настроить AI провайдера
export async function updateAIProvider(
  data: UpdateAIProviderDTO,
  updatedBy?: string
): Promise<SystemSettingsResponse> {
  await dbConnect();

  const { provider, enabled, apiKey, model } = data;

  const updateData: Record<string, unknown> = {
    [`ai.providers.${provider}.enabled`]: enabled,
    [`ai.providers.${provider}.model`]: model,
  };

  if (apiKey) {
    // TODO: В production здесь должно быть шифрование API ключа
    updateData[`ai.providers.${provider}.apiKey`] = apiKey;
  }

  if (updatedBy) {
    updateData.updatedBy = updatedBy;
  }

  const settings = await SystemSettings.findOneAndUpdate(
    {},
    { $set: updateData },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return toSystemSettingsResponse(settings);
}

// Установить активного провайдера
export async function setActiveAIProvider(
  data: SetActiveAIProviderDTO,
  updatedBy?: string
): Promise<SystemSettingsResponse> {
  await dbConnect();

  const settings = await getSystemSettingsInternal();

  // Проверяем, что провайдер настроен и включен
  const providerConfig = settings.ai?.providers?.[data.provider];
  if (!providerConfig || !providerConfig.enabled || !providerConfig.apiKey) {
    throw new Error(
      `Provider "${data.provider}" is not configured or not enabled. Please configure it first.`
    );
  }

  const updateData: Record<string, unknown> = {
    'ai.activeProvider': data.provider,
  };

  if (updatedBy) {
    updateData.updatedBy = updatedBy;
  }

  const updatedSettings = await SystemSettings.findOneAndUpdate(
    {},
    { $set: updateData },
    { new: true, upsert: true }
  );

  return toSystemSettingsResponse(updatedSettings);
}
