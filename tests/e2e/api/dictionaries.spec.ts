import { test, expect } from '@playwright/test';
import { generateTestUser } from '../../fixtures/test-data';

test.describe('Dictionaries API', () => {
  let authCookies: string;

  // Запускаем тесты последовательно, т.к. они зависят друг от друга
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    // Регистрируем тестового пользователя
    const user = generateTestUser();

    await request.post('/api/auth/register', {
      data: user,
    });

    // Получаем CSRF токен
    const csrfResponse = await request.get('/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();

    // Логинимся
    await request.post('/api/auth/callback/credentials', {
      form: {
        email: user.email,
        password: user.password,
        csrfToken,
      },
    });

    // Сохраняем cookies для последующих запросов
    const state = await request.storageState();
    authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');
  });

  test.describe('Dictionary CRUD', () => {
    const testDictionaryCode = `contact_types_${Date.now()}`;

    test('POST /api/dictionaries should create contact_types dictionary', async ({ request }) => {
      const dictionaryData = {
        code: testDictionaryCode,
        name: 'Типы контактов',
        description: 'Категоризация контактов по типам',
        allowHierarchy: false,
        maxDepth: 1,
        fields: [
          {
            code: 'color',
            name: 'Цвет',
            type: 'color',
            required: true,
          },
        ],
      };

      const response = await request.post('/api/dictionaries', {
        headers: { Cookie: authCookies },
        data: dictionaryData,
      });

      expect(response.status()).toBe(201);
      const dictionary = await response.json();

      expect(dictionary.code).toBe(testDictionaryCode);
      expect(dictionary.name).toBe('Типы контактов');
      expect(dictionary.fields).toHaveLength(1);
      expect(dictionary.fields[0].code).toBe('color');
      expect(dictionary.id).toBeDefined();
    });

    test('POST /api/dictionaries/search should return dictionaries list', async ({ request }) => {
      const response = await request.post('/api/dictionaries/search', {
        headers: { Cookie: authCookies },
        data: {},
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.dictionaries).toBeDefined();
      expect(Array.isArray(data.dictionaries)).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(1);
    });

    test('GET /api/dictionaries/:code should return dictionary by code', async ({ request }) => {
      const response = await request.get(`/api/dictionaries/${testDictionaryCode}`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const dictionary = await response.json();

      expect(dictionary.code).toBe(testDictionaryCode);
      expect(dictionary.name).toBe('Типы контактов');
    });

    test('POST /api/dictionaries/:code/items should create dictionary items', async ({ request }) => {
      const contactTypes = [
        { name: 'Клиент', color: '#22c55e' },           // Зелёный
        { name: 'Лид', color: '#3b82f6' },              // Синий
        { name: 'Партнёр', color: '#a855f7' },          // Фиолетовый
        { name: 'Поставщик', color: '#f97316' },        // Оранжевый
        { name: 'VIP', color: '#eab308' },              // Жёлтый/Золотой
        { name: 'Потенциальный', color: '#6b7280' },    // Серый
      ];

      for (const type of contactTypes) {
        const response = await request.post(`/api/dictionaries/${testDictionaryCode}/items`, {
          headers: { Cookie: authCookies },
          data: {
            name: type.name,
            properties: { color: type.color },
          },
        });

        expect(response.status()).toBe(201);
        const item = await response.json();

        expect(item.name).toBe(type.name);
        expect(item.properties.color).toBe(type.color);
        expect(item.dictionaryCode).toBe(testDictionaryCode);
        expect(item.isActive).toBe(true);
      }
    });

    test('GET /api/dictionaries/:code/items should return all items', async ({ request }) => {
      const response = await request.get(`/api/dictionaries/${testDictionaryCode}/items`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.items).toHaveLength(6);
      expect(data.items.map((i: { name: string }) => i.name)).toContain('Клиент');
      expect(data.items.map((i: { name: string }) => i.name)).toContain('VIP');
    });

    test('PATCH /api/dictionaries/:code/items/:id should update item', async ({ request }) => {
      // Получаем элементы
      const listResponse = await request.get(`/api/dictionaries/${testDictionaryCode}/items`, {
        headers: { Cookie: authCookies },
      });
      const { items } = await listResponse.json();
      const vipItem = items.find((i: { name: string }) => i.name === 'VIP');

      // Обновляем цвет
      const response = await request.patch(
        `/api/dictionaries/${testDictionaryCode}/items/${vipItem.id}`,
        {
          headers: { Cookie: authCookies },
          data: {
            properties: { color: '#ffd700' }, // Золотой
          },
        }
      );

      expect(response.status()).toBe(200);
      const updated = await response.json();
      expect(updated.properties.color).toBe('#ffd700');
    });

    test('PATCH /api/dictionaries/:code/items should update items order', async ({ request }) => {
      // Получаем текущий порядок
      const listResponse = await request.get(`/api/dictionaries/${testDictionaryCode}/items`, {
        headers: { Cookie: authCookies },
      });
      const { items } = await listResponse.json();

      // Меняем порядок - VIP первым
      const vipItem = items.find((i: { name: string }) => i.name === 'VIP');
      const reordered = [
        { id: vipItem.id, weight: 0 },
        ...items
          .filter((i: { id: string }) => i.id !== vipItem.id)
          .map((i: { id: string }, idx: number) => ({ id: i.id, weight: idx + 1 })),
      ];

      const response = await request.patch(`/api/dictionaries/${testDictionaryCode}/items`, {
        headers: { Cookie: authCookies },
        data: { items: reordered },
      });

      expect(response.status()).toBe(200);

      // Проверяем новый порядок
      const updatedResponse = await request.get(`/api/dictionaries/${testDictionaryCode}/items`, {
        headers: { Cookie: authCookies },
      });
      const updated = await updatedResponse.json();
      expect(updated.items[0].name).toBe('VIP');
    });

    test('DELETE /api/dictionaries/:code/items/:id should delete item', async ({ request }) => {
      // Получаем элементы
      const listResponse = await request.get(`/api/dictionaries/${testDictionaryCode}/items`, {
        headers: { Cookie: authCookies },
      });
      const { items } = await listResponse.json();
      const potentialItem = items.find((i: { name: string }) => i.name === 'Потенциальный');

      // Удаляем
      const response = await request.delete(
        `/api/dictionaries/${testDictionaryCode}/items/${potentialItem.id}`,
        {
          headers: { Cookie: authCookies },
        }
      );

      expect(response.status()).toBe(200);

      // Проверяем что удалён
      const checkResponse = await request.get(`/api/dictionaries/${testDictionaryCode}/items`, {
        headers: { Cookie: authCookies },
      });
      const updated = await checkResponse.json();
      expect(updated.items.map((i: { name: string }) => i.name)).not.toContain('Потенциальный');
    });

    test('DELETE /api/dictionaries/:code should delete dictionary with all items', async ({ request }) => {
      const response = await request.delete(`/api/dictionaries/${testDictionaryCode}`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);

      // Проверяем что словарь удалён
      const checkResponse = await request.get(`/api/dictionaries/${testDictionaryCode}`, {
        headers: { Cookie: authCookies },
      });
      expect(checkResponse.status()).toBe(404);
    });
  });

  test.describe('Hierarchical dictionary', () => {
    const hierarchyDictCode = `industries_${Date.now()}`;

    test('should create hierarchical dictionary with nested items', async ({ request }) => {
      // Создаём словарь с иерархией
      const createDictResponse = await request.post('/api/dictionaries', {
        headers: { Cookie: authCookies },
        data: {
          code: hierarchyDictCode,
          name: 'Отрасли',
          allowHierarchy: true,
          maxDepth: 2,
          fields: [],
        },
      });
      expect(createDictResponse.status()).toBe(201);

      // Создаём корневой элемент
      const parentResponse = await request.post(`/api/dictionaries/${hierarchyDictCode}/items`, {
        headers: { Cookie: authCookies },
        data: { name: 'IT' },
      });
      expect(parentResponse.status()).toBe(201);
      const parent = await parentResponse.json();
      expect(parent.depth).toBe(0);

      // Создаём дочерний элемент
      const childResponse = await request.post(`/api/dictionaries/${hierarchyDictCode}/items`, {
        headers: { Cookie: authCookies },
        data: { name: 'Разработка ПО', parentId: parent.id },
      });
      expect(childResponse.status()).toBe(201);
      const child = await childResponse.json();
      expect(child.depth).toBe(1);
      expect(child.parentId).toBe(parent.id);

      // Cleanup
      await request.delete(`/api/dictionaries/${hierarchyDictCode}`, {
        headers: { Cookie: authCookies },
      });
    });
  });
});
