import { NextResponse } from 'next/server';
import { generateOpenApiDocument, ApiRoute } from '@/lib/api-docs';

import contactRoutes from '@/modules/contact/routes.meta';
import userRoutes from '@/modules/user/routes.meta';
import opportunityRoutes from '@/modules/opportunity/routes.meta';
import dictionaryRoutes from '@/modules/dictionary/routes.meta';

// Собираем все маршруты
const allRoutes: ApiRoute[] = [
  ...contactRoutes,
  ...userRoutes,
  ...opportunityRoutes,
  ...dictionaryRoutes,
];

// Кешируем сгенерированный документ
let cachedDoc: ReturnType<typeof generateOpenApiDocument> | null = null;

function getOpenApiDoc() {
  if (!cachedDoc) {
    cachedDoc = generateOpenApiDocument(
      {
        info: {
          title: 'CRM Proto API',
          version: '1.0.0',
          description: `
# CRM Proto API

REST API для CRM системы.

## Аутентификация

API использует cookie-based аутентификацию через NextAuth.js.
Для доступа к защищённым эндпоинтам необходимо авторизоваться через \`/login\`.

## Ошибки

Все ошибки возвращаются в формате:

\`\`\`json
{
  "error": "Описание ошибки"
}
\`\`\`

Стандартные коды ответов:
- \`200\` - Успешный запрос
- \`201\` - Ресурс создан
- \`400\` - Неверный запрос (ошибка валидации)
- \`401\` - Не авторизован
- \`403\` - Доступ запрещён
- \`404\` - Ресурс не найден
- \`500\` - Внутренняя ошибка сервера
          `.trim(),
        },
        servers: [
          { url: '/', description: 'Current server' },
        ],
      },
      allRoutes
    );
  }
  return cachedDoc;
}

export async function GET() {
  const doc = getOpenApiDoc();

  return NextResponse.json(doc, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
