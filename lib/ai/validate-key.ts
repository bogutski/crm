import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { AIProvider } from '@/modules/system-settings/model';
import { generateText } from 'ai';

/**
 * Валидация API ключа провайдера
 * Отправляет тестовый запрос чтобы проверить что ключ работает
 */
export async function validateAPIKey(
  provider: AIProvider,
  apiKey: string,
  model: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    let testModel;

    // Создаем провайдера с указанным ключом
    switch (provider) {
      case 'openai': {
        const openai = createOpenAI({ apiKey });
        testModel = openai(model);
        break;
      }
      case 'anthropic': {
        const anthropic = createAnthropic({ apiKey });
        testModel = anthropic(model);
        break;
      }
      case 'google': {
        const google = createGoogleGenerativeAI({ apiKey });
        testModel = google(model);
        break;
      }
      default:
        return { valid: false, error: 'Unsupported provider' };
    }

    // Отправляем минимальный тестовый запрос
    await generateText({
      model: testModel,
      prompt: 'Hi',
    });

    return { valid: true };
  } catch (error: any) {
    console.error(`API key validation failed for ${provider}:`, error);

    // Определяем тип ошибки
    const errorMessage = error?.message || String(error);

    if (errorMessage.includes('Invalid API Key') || errorMessage.includes('401')) {
      return { valid: false, error: 'Неверный API ключ' };
    }

    if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
      return { valid: false, error: 'Проблема с квотой или биллингом' };
    }

    if (errorMessage.includes('model') || errorMessage.includes('404')) {
      return { valid: false, error: 'Модель не найдена или недоступна' };
    }

    return { valid: false, error: `Ошибка проверки: ${errorMessage}` };
  }
}
