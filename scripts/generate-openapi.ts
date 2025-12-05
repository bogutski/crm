/**
 * Скрипт генерации OpenAPI спецификации.
 *
 * Запуск: npx tsx scripts/generate-openapi.ts
 *
 * Выводит OpenAPI spec в public/openapi.json
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { generateOpenApiDocument, serializeOpenApi, ApiRoute } from '../lib/api-docs';

// Импортируем routes.meta из всех модулей
import contactRoutes from '../modules/contact/routes.meta';
import userRoutes from '../modules/user/routes.meta';
import opportunityRoutes from '../modules/opportunity/routes.meta';
import dictionaryRoutes from '../modules/dictionary/routes.meta';
import interactionRoutes from '../modules/interaction/routes.meta';
import channelRoutes from '../modules/channel/routes.meta';

// Собираем все маршруты
const allRoutes: ApiRoute[] = [
  ...contactRoutes,
  ...userRoutes,
  ...opportunityRoutes,
  ...dictionaryRoutes,
  ...interactionRoutes,
  ...channelRoutes,
];

// Генерируем OpenAPI документ
const openApiDoc = generateOpenApiDocument(
  {
    info: {
      title: 'ClientBase API',
      version: '1.0.0',
      description: `
# ClientBase API

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
      { url: 'http://localhost:3000', description: 'Development' },
    ],
  },
  allRoutes
);

// Записываем в файл
const outputPath = join(process.cwd(), 'public', 'openapi.json');
writeFileSync(outputPath, serializeOpenApi(openApiDoc), 'utf-8');

console.log(`✅ OpenAPI spec generated: ${outputPath}`);
console.log(`   Total routes: ${allRoutes.length}`);
