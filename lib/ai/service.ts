import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { AIProvider } from '@/modules/system-settings/model';
import { getSystemSettingsInternal } from '@/modules/system-settings/controller';

/**
 * Получить модель AI на основе настроек системы
 * Использует активного провайдера из системных настроек
 */
export async function getAIModel() {
  const settings = await getSystemSettingsInternal();

  if (!settings.ai?.activeProvider) {
    throw new Error('AI provider not configured. Please configure AI settings in system settings.');
  }

  const activeProvider = settings.ai.activeProvider;
  const providerConfig = settings.ai.providers[activeProvider];

  if (!providerConfig || !providerConfig.enabled) {
    throw new Error(`AI provider "${activeProvider}" is not enabled.`);
  }

  if (!providerConfig.apiKey) {
    throw new Error(`API key for "${activeProvider}" is not configured.`);
  }

  return createModel(activeProvider, providerConfig.model, providerConfig.apiKey);
}

/**
 * Создать модель для конкретного провайдера
 */
export function createModel(provider: AIProvider, model: string, apiKey: string) {
  switch (provider) {
    case 'openai': {
      const openai = createOpenAI({ apiKey });
      return openai(model);
    }

    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(model);
    }

    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(model);
    }

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

/**
 * Получить информацию о доступных моделях для каждого провайдера
 */
export const AVAILABLE_MODELS = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o (мощная)', description: 'Лучшая модель для сложных задач' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (экономичная)', description: 'Оптимальная для большинства задач' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Быстрая версия GPT-4' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', description: 'Лучшая модель для аналитики' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', description: 'Быстрая и экономичная' },
  ],
  google: [
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Мощная модель Google' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Самая экономичная модель' },
  ],
} as const;

/**
 * Получить дефолтную модель для провайдера
 */
export function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o-mini';
    case 'anthropic':
      return 'claude-3-5-sonnet-20241022';
    case 'google':
      return 'gemini-1.5-flash';
    default:
      return 'gpt-4o-mini';
  }
}
