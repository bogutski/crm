import { RouteDefinition, ApiRoute, HttpMethod } from './types';

type RouteKey = `${HttpMethod} ${string}`;

/**
 * Определяет маршруты API для модуля.
 *
 * @example
 * ```ts
 * export default defineRoutes({
 *   'GET /api/contacts': {
 *     summary: 'Получить список контактов',
 *     tags: ['Contacts'],
 *     query: contactFiltersSchema,
 *     response: contactsListResponseSchema,
 *   },
 *   'POST /api/contacts': {
 *     summary: 'Создать контакт',
 *     tags: ['Contacts'],
 *     body: createContactSchema,
 *     response: contactResponseSchema,
 *   },
 * });
 * ```
 */
export function defineRoutes(routes: Record<RouteKey, RouteDefinition>): ApiRoute[] {
  return Object.entries(routes).map(([key, definition]) => {
    const [method, path] = key.split(' ') as [HttpMethod, string];
    return {
      method,
      path,
      definition: {
        auth: true, // По умолчанию требуется авторизация
        ...definition,
      },
    };
  });
}

/**
 * Определяет path параметры из строки пути.
 *
 * @example
 * ```ts
 * pathParams('/api/contacts/:id') // { id: 'string' }
 * pathParams('/api/dictionaries/:code/items/:id') // { code: 'string', id: 'string' }
 * ```
 */
export function extractPathParams(path: string): string[] {
  const matches = path.match(/:([a-zA-Z_]+)/g);
  return matches ? matches.map(m => m.slice(1)) : [];
}
