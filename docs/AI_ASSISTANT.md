# AI Ассистент - Документация

## Описание

Система AI ассистента для CRM с поддержкой нескольких провайдеров:
- **OpenAI** (GPT-4o, GPT-4o-mini)
- **Anthropic** (Claude 3.5 Sonnet, Claude 3 Haiku)
- **Google** (Gemini 1.5 Pro, Gemini Flash)

## Архитектура

### 1. Хранение настроек

Настройки AI хранятся в `SystemSettings`:
- `ai.activeProvider` - активный провайдер (openai/anthropic/google)
- `ai.providers[provider]` - конфигурация каждого провайдера:
  - `enabled` - включен ли провайдер
  - `apiKey` - API ключ провайдера (зашифрован)
  - `model` - название модели

### 2. API Endpoints

#### Управление настройками AI

**PATCH `/api/system-settings/ai/providers`** - настроить провайдера
```json
{
  "provider": "openai",
  "enabled": true,
  "apiKey": "sk-...",
  "model": "gpt-4o-mini"
}
```

**POST `/api/system-settings/ai/active`** - установить активного провайдера
```json
{
  "provider": "openai"
}
```

#### AI Чат

**POST `/api/ai/chat`** - отправить сообщение AI
```json
{
  "messages": [
    { "role": "user", "content": "Привет!" }
  ]
}
```

Возвращает streaming ответ.

### 3. Компоненты

#### AISettingsForm
Страница настроек: `/settings/ai`
- Выбор провайдера
- Ввод API ключа
- Выбор модели
- Активация провайдера

#### AIChat
Компонент чата - кнопка в правом нижнем углу
```tsx
import { AIChat } from '@/app/components/AIChat';

export default function Layout() {
  return (
    <>
      {/* ... */}
      <AIChat />
    </>
  );
}
```

## Настройка провайдеров

### OpenAI

1. Получите API ключ на https://platform.openai.com/api-keys
2. Перейдите в **Настройки → AI Ассистент**
3. Выберите **OpenAI**
4. Вставьте API ключ
5. Выберите модель (рекомендуем `gpt-4o-mini`)
6. Нажмите "Сохранить и активировать"

**Стоимость:**
- GPT-4o Mini: $0.15 / 1M input tokens
- GPT-4o: $2.50 / 1M input tokens

### Anthropic Claude

1. Получите API ключ на https://console.anthropic.com/
2. Перейдите в **Настройки → AI Ассистент**
3. Выберите **Anthropic Claude**
4. Вставьте API ключ
5. Выберите модель (рекомендуем `claude-3-5-sonnet-20241022`)
6. Нажмите "Сохранить и активировать"

**Стоимость:**
- Claude 3.5 Sonnet: $3.00 / 1M input tokens
- Claude 3 Haiku: $0.25 / 1M input tokens

### Google Gemini

1. Получите API ключ на https://aistudio.google.com/
2. Перейдите в **Настройки → AI Ассистент**
3. Выберите **Google Gemini**
4. Вставьте API ключ
5. Выберите модель (рекомендуем `gemini-1.5-flash`)
6. Нажмите "Сохранить и активировать"

**Стоимость:**
- Gemini 1.5 Flash: $0.075 / 1M input tokens (самая дешевая!)
- Gemini 1.5 Pro: $1.25 / 1M input tokens

## Сравнение провайдеров

| Провайдер | Модель | Стоимость | Лучше для |
|-----------|--------|-----------|-----------|
| OpenAI | GPT-4o Mini | $0.15/1M | Универсальное решение |
| Google | Gemini Flash | $0.075/1M | Экономия средств |
| Anthropic | Claude Sonnet | $3.00/1M | Сложная аналитика |

## Рекомендации по выбору

### Для старта: **OpenAI GPT-4o Mini**
- Лучшее соотношение цена/качество
- Отличное качество ответов на русском
- Достаточно для 95% задач

### Для экономии: **Google Gemini Flash**
- В 2 раза дешевле GPT-4o Mini
- Хорошее качество
- Подходит для простых запросов

### Для сложной аналитики: **Anthropic Claude Sonnet**
- Лучше всего справляется с анализом данных
- Большой контекст (200K tokens)
- Дороже других вариантов

## Использование AI чата

1. Убедитесь, что AI провайдер настроен и активен
2. Нажмите на кнопку чата в правом нижнем углу
3. Введите вопрос или команду
4. AI ответит на русском языке

**Примеры запросов:**
- "Покажи статистику продаж за месяц"
- "Кто самый эффективный менеджер?"
- "Сколько открытых задач у каждого сотрудника?"
- "Помоги проанализировать воронку продаж"

## Безопасность

⚠️ **ВАЖНО:** В production API ключи должны быть зашифрованы!

Текущая реализация хранит ключи в MongoDB без шифрования.
Для production добавьте шифрование в `modules/system-settings/controller.ts:113`

```typescript
// TODO: В production здесь должно быть шифрование API ключа
updateData[`ai.providers.${provider}.apiKey`] = encrypt(apiKey);
```

## Расширение функциональности

### Добавление Tools (функций для AI)

Редактируйте `app/api/ai/chat/route.ts`:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const result = streamText({
  model,
  messages,
  tools: {
    getEmployeeStats: tool({
      description: 'Получить статистику сотрудников',
      parameters: z.object({
        period: z.string(),
      }),
      execute: async ({ period }) => {
        // Ваша логика
        return { /* данные */ };
      },
    }),
  },
});
```

### Добавление нового провайдера

1. Добавьте провайдера в `modules/system-settings/model.ts`:
```typescript
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'новый_провайдер';
```

2. Добавьте в `lib/ai/service.ts`:
```typescript
import { новыйпровайдер } from '@ai-sdk/новый-провайдер';

case 'новый_провайдер':
  return новыйпровайдер(model, { apiKey });
```

3. Обновите UI в `app/settings/ai/components/AISettingsForm.tsx`

## Мониторинг и логи

Все ошибки AI логируются в консоль:
```bash
# Логи API чата
grep "AI Chat Error" logs/*.log

# Логи настроек
grep "Error updating AI provider" logs/*.log
```

## FAQ

**Q: Можно ли использовать несколько провайдеров одновременно?**
A: Да, можно настроить все три, но активным будет только один. Переключение - в настройках.

**Q: Где хранятся API ключи?**
A: В MongoDB в коллекции `system_settings`. В production рекомендуем зашифровать.

**Q: Можно ли использовать локальные модели?**
A: Да! Добавьте Ollama как провайдера и используйте локальные модели.

**Q: Сколько стоит 1000 сообщений?**
A: ~500 tokens на сообщение × 1000 = 500K tokens = $0.075 (Gemini) или $0.15 (GPT-4o Mini)

## Поддержка

При проблемах проверьте:
1. API ключ правильный и активный
2. Провайдер активирован в настройках
3. Нет ошибок в консоли браузера
4. MongoDB доступна и настройки сохранены
