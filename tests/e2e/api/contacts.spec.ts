import { test, expect } from '@playwright/test';
import { generateTestUser } from '../../fixtures/test-data';

test.describe('Contacts API', () => {
  let authCookies: string;

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

  test.describe('Unauthorized access', () => {
    test('POST /api/contacts/search should redirect to login without auth', async ({ playwright }) => {
      // Создаём новый контекст без cookies (без следования редиректам)
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
      });
      const response = await context.post('/api/contacts/search', {
        data: {},
        maxRedirects: 0,
      });
      // Middleware редиректит на /login
      expect(response.status()).toBe(307);
      expect(response.headers()['location']).toContain('/login');
      await context.dispose();
    });

    test('POST /api/contacts should redirect to login without auth', async ({ playwright }) => {
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
      });
      const response = await context.post('/api/contacts', {
        data: { firstName: 'Test', lastName: 'Contact' },
        maxRedirects: 0,
      });
      expect(response.status()).toBe(307);
      expect(response.headers()['location']).toContain('/login');
      await context.dispose();
    });
  });

  test.describe('CRUD operations', () => {
    let createdContactId: string;

    test('POST /api/contacts should create a new contact', async ({ request }) => {
      const contactData = {
        name: 'John Doe',
        emails: [{ address: 'john.doe@example.com' }],
        phones: [
          {
            e164: '+1234567890',
            international: '+1 234 567 890',
            country: 'US',
            type: 'MOBILE',
            isPrimary: true,
          },
        ],
        company: 'Test Company',
        position: 'Manager',
      };

      const response = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: contactData,
      });

      expect(response.status()).toBe(201);
      const contact = await response.json();

      expect(contact.name).toBe(contactData.name);
      expect(contact.emails).toHaveLength(1);
      expect(contact.emails[0].address).toBe('john.doe@example.com');
      expect(contact.phones).toHaveLength(1);
      expect(contact.phones[0].e164).toBe('+1234567890');
      expect(contact.id).toBeDefined();

      createdContactId = contact.id;
    });

    test('POST /api/contacts/search should return contacts list', async ({ request }) => {
      const response = await request.post('/api/contacts/search', {
        headers: { Cookie: authCookies },
        data: {},
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.contacts).toBeDefined();
      expect(Array.isArray(data.contacts)).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(0);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(30);
    });

    test('GET /api/contacts/:id should return contact by id', async ({ request }) => {
      // Сначала создадим контакт
      const createResponse = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Jane Smith',
          emails: [{ address: 'jane.smith@example.com' }],
        },
      });
      const created = await createResponse.json();

      const response = await request.get(`/api/contacts/${created.id}`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const contact = await response.json();

      expect(contact.id).toBe(created.id);
      expect(contact.name).toBe('Jane Smith');
      expect(contact.emails[0].address).toBe('jane.smith@example.com');
    });

    test('GET /api/contacts/:id should return 404 for non-existent contact', async ({ request }) => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request.get(`/api/contacts/${fakeId}`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(404);
    });

    test('PATCH /api/contacts/:id should update contact', async ({ request }) => {
      // Создаём контакт
      const createResponse = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Update Test',
        },
      });
      const created = await createResponse.json();

      // Обновляем
      const response = await request.patch(`/api/contacts/${created.id}`, {
        headers: { Cookie: authCookies },
        data: {
          name: 'Updated Name',
          company: 'New Company',
        },
      });

      expect(response.status()).toBe(200);
      const updated = await response.json();

      expect(updated.name).toBe('Updated Name');
      expect(updated.company).toBe('New Company');
    });

    test('DELETE /api/contacts/:id should delete contact', async ({ request }) => {
      // Создаём контакт для удаления
      const createResponse = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Delete Me',
        },
      });
      const created = await createResponse.json();

      // Удаляем
      const deleteResponse = await request.delete(`/api/contacts/${created.id}`, {
        headers: { Cookie: authCookies },
      });

      expect(deleteResponse.status()).toBe(200);

      // Проверяем что контакт удалён
      const getResponse = await request.get(`/api/contacts/${created.id}`, {
        headers: { Cookie: authCookies },
      });

      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('Contact Type with Dictionary', () => {
    let contactTypeId: string;

    test.beforeAll(async ({ request }) => {
      // Создаём словарь contact_types если его нет
      const dictionaryResponse = await request.get('/api/dictionaries/contact_types', {
        headers: { Cookie: authCookies },
      });

      if (dictionaryResponse.status() === 404) {
        // Создаём словарь
        await request.post('/api/dictionaries', {
          headers: { Cookie: authCookies },
          data: {
            code: 'contact_types',
            name: 'Типы контактов',
            fields: [
              { code: 'color', name: 'Цвет', type: 'color', required: false }
            ]
          },
        });
      }

      // Создаём элемент словаря с цветом
      const itemResponse = await request.post('/api/dictionaries/contact_types/items', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Клиент',
          code: 'client',
          properties: { color: '#22c55e' }
        },
      });

      if (itemResponse.ok()) {
        const item = await itemResponse.json();
        contactTypeId = item.id;
      } else {
        // Если элемент уже существует, получим его
        const listResponse = await request.get('/api/dictionaries/contact_types/items', {
          headers: { Cookie: authCookies },
        });
        const data = await listResponse.json();
        const existingItem = data.items?.find((i: { code: string }) => i.code === 'client');
        if (existingItem) {
          contactTypeId = existingItem.id;
        }
      }
    });

    test('POST /api/contacts with contactType should link to dictionary item', async ({ request }) => {
      const response = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Contact With Type',
          contactType: contactTypeId,
        },
      });

      expect(response.status()).toBe(201);
      const contact = await response.json();

      expect(contact.contactType).toBeDefined();
      expect(contact.contactType.id).toBe(contactTypeId);
      expect(contact.contactType.name).toBe('Клиент');
      expect(contact.contactType.color).toBe('#22c55e');
    });

    test('POST /api/contacts/search should return contactType with color', async ({ request }) => {
      // Создаём контакт с типом
      await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Contact For List Test',
          contactType: contactTypeId,
        },
      });

      const response = await request.post('/api/contacts/search', {
        headers: { Cookie: authCookies },
        data: { search: 'Contact For List Test' },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      const contact = data.contacts.find((c: { name: string }) => c.name === 'Contact For List Test');
      expect(contact).toBeDefined();
      expect(contact.contactType).toBeDefined();
      expect(contact.contactType.name).toBe('Клиент');
      expect(contact.contactType.color).toBe('#22c55e');
    });

    test('PATCH /api/contacts/:id should update contactType', async ({ request }) => {
      // Создаём контакт без типа
      const createResponse = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Contact Without Type',
        },
      });
      const created = await createResponse.json();
      expect(created.contactType).toBeNull();

      // Добавляем тип
      const updateResponse = await request.patch(`/api/contacts/${created.id}`, {
        headers: { Cookie: authCookies },
        data: {
          contactType: contactTypeId,
        },
      });

      expect(updateResponse.status()).toBe(200);
      const updated = await updateResponse.json();

      expect(updated.contactType).toBeDefined();
      expect(updated.contactType.id).toBe(contactTypeId);
      expect(updated.contactType.name).toBe('Клиент');
    });

    test('PATCH /api/contacts/:id should remove contactType when set to null', async ({ request }) => {
      // Создаём контакт с типом
      const createResponse = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Contact To Remove Type',
          contactType: contactTypeId,
        },
      });
      const created = await createResponse.json();
      expect(created.contactType).toBeDefined();

      // Удаляем тип
      const updateResponse = await request.patch(`/api/contacts/${created.id}`, {
        headers: { Cookie: authCookies },
        data: {
          contactType: null,
        },
      });

      expect(updateResponse.status()).toBe(200);
      const updated = await updateResponse.json();

      expect(updated.contactType).toBeNull();
    });
  });

  test.describe('Filtering and pagination', () => {
    test('POST /api/contacts/search should support search filter', async ({ request }) => {
      // Создаём контакт с уникальным именем
      const uniqueName = `SearchTest${Date.now()}`;
      await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: uniqueName,
        },
      });

      const response = await request.post('/api/contacts/search', {
        headers: { Cookie: authCookies },
        data: { search: uniqueName },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.contacts.length).toBeGreaterThanOrEqual(1);
      expect(data.contacts[0].name).toBe(uniqueName);
    });

    test('POST /api/contacts/search should support pagination', async ({ request }) => {
      const response = await request.post('/api/contacts/search', {
        headers: { Cookie: authCookies },
        data: { page: 1, limit: 5 },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.page).toBe(1);
      expect(data.limit).toBe(5);
      expect(data.contacts.length).toBeLessThanOrEqual(5);
    });
  });

  test.describe('Advanced Filtering (contactType, source, ownerId)', () => {
    let contactTypeId: string;
    let sourceId: string;
    let contactWithType: string;
    let contactWithoutType: string;
    let contactWithSource: string;
    let contactWithoutSource: string;

    test.beforeAll(async ({ request }) => {
      // Создаём словари и элементы для тестирования фильтров

      // Создаём словарь contact_types если его нет
      const contactTypesResponse = await request.get('/api/dictionaries/contact_types', {
        headers: { Cookie: authCookies },
      });

      if (contactTypesResponse.status() === 404) {
        await request.post('/api/dictionaries', {
          headers: { Cookie: authCookies },
          data: {
            code: 'contact_types',
            name: 'Типы контактов',
            fields: [{ code: 'color', name: 'Цвет', type: 'color', required: false }]
          },
        });
      }

      // Создаём тип контакта "Партнёр"
      const typeResponse = await request.post('/api/dictionaries/contact_types/items', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Партнёр',
          code: 'partner_filter_test',
          properties: { color: '#3b82f6' }
        },
      });

      if (typeResponse.ok()) {
        const type = await typeResponse.json();
        contactTypeId = type.id;
      } else {
        // Получаем существующий
        const listResponse = await request.get('/api/dictionaries/contact_types/items', {
          headers: { Cookie: authCookies },
        });
        const data = await listResponse.json();
        const existing = data.items?.find((i: { code: string }) => i.code === 'partner_filter_test');
        if (existing) {
          contactTypeId = existing.id;
        }
      }

      // Создаём словарь sources если его нет
      const sourcesResponse = await request.get('/api/dictionaries/sources', {
        headers: { Cookie: authCookies },
      });

      if (sourcesResponse.status() === 404) {
        await request.post('/api/dictionaries', {
          headers: { Cookie: authCookies },
          data: {
            code: 'sources',
            name: 'Источники',
            fields: [{ code: 'color', name: 'Цвет', type: 'color', required: false }]
          },
        });
      }

      // Создаём источник "Реклама"
      const sourceResponse = await request.post('/api/dictionaries/sources/items', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Реклама',
          code: 'ads_filter_test',
          properties: { color: '#f59e0b' }
        },
      });

      if (sourceResponse.ok()) {
        const source = await sourceResponse.json();
        sourceId = source.id;
      } else {
        // Получаем существующий
        const listResponse = await request.get('/api/dictionaries/sources/items', {
          headers: { Cookie: authCookies },
        });
        const data = await listResponse.json();
        const existing = data.items?.find((i: { code: string }) => i.code === 'ads_filter_test');
        if (existing) {
          sourceId = existing.id;
        }
      }

      // Создаём тестовые контакты
      const timestamp = Date.now();

      // Контакт с типом
      const c1 = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: `FilterTest_WithType_${timestamp}`,
          contactType: contactTypeId,
        },
      });
      const contact1 = await c1.json();
      contactWithType = contact1.id;

      // Контакт без типа
      const c2 = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: `FilterTest_WithoutType_${timestamp}`,
        },
      });
      const contact2 = await c2.json();
      contactWithoutType = contact2.id;

      // Контакт с источником
      const c3 = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: `FilterTest_WithSource_${timestamp}`,
          source: sourceId,
        },
      });
      const contact3 = await c3.json();
      contactWithSource = contact3.id;

      // Контакт без источника
      const c4 = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: `FilterTest_WithoutSource_${timestamp}`,
        },
      });
      const contact4 = await c4.json();
      contactWithoutSource = contact4.id;
    });

    test('should filter contacts by contactType', async ({ request }) => {
      const response = await request.post('/api/contacts/search', {
        headers: { Cookie: authCookies },
        data: { contactType: contactTypeId },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Проверяем что все контакты имеют указанный тип
      const hasCorrectType = data.contacts.every((c: { contactType: { id: string } | null }) =>
        c.contactType?.id === contactTypeId
      );
      expect(hasCorrectType).toBe(true);

      // Проверяем что наш тестовый контакт присутствует
      const found = data.contacts.find((c: { id: string }) => c.id === contactWithType);
      expect(found).toBeDefined();
    });

    test('should filter contacts by contactType = "_null_" (without type)', async ({ request }) => {
      const response = await request.post('/api/contacts/search', {
        headers: { Cookie: authCookies },
        data: { contactType: '_null_' },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Проверяем что все контакты не имеют типа
      const allHaveNoType = data.contacts.every((c: { contactType: { id: string } | null }) =>
        c.contactType === null
      );
      expect(allHaveNoType).toBe(true);

      // Проверяем что наш тестовый контакт без типа присутствует
      const found = data.contacts.find((c: { id: string }) => c.id === contactWithoutType);
      expect(found).toBeDefined();

      // Проверяем что контакт с типом отсутствует
      const shouldNotBeFound = data.contacts.find((c: { id: string }) => c.id === contactWithType);
      expect(shouldNotBeFound).toBeUndefined();
    });

    test('should filter contacts by source', async ({ request }) => {
      const response = await request.post('/api/contacts/search', {
        headers: { Cookie: authCookies },
        data: { source: sourceId },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Проверяем что все контакты имеют указанный источник
      const hasCorrectSource = data.contacts.every((c: { source: string | undefined }) =>
        c.source === sourceId
      );
      expect(hasCorrectSource).toBe(true);

      // Проверяем что наш тестовый контакт присутствует
      const found = data.contacts.find((c: { id: string }) => c.id === contactWithSource);
      expect(found).toBeDefined();
    });

    test('should filter contacts by source = "_null_" (without source)', async ({ request }) => {
      const response = await request.post('/api/contacts/search', {
        headers: { Cookie: authCookies },
        data: { source: '_null_' },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Проверяем что все контакты не имеют источника
      const allHaveNoSource = data.contacts.every((c: { source: string | undefined }) =>
        !c.source
      );
      expect(allHaveNoSource).toBe(true);

      // Проверяем что наш тестовый контакт без источника присутствует
      const found = data.contacts.find((c: { id: string }) => c.id === contactWithoutSource);
      expect(found).toBeDefined();

      // Проверяем что контакт с источником отсутствует
      const shouldNotBeFound = data.contacts.find((c: { id: string }) => c.id === contactWithSource);
      expect(shouldNotBeFound).toBeUndefined();
    });

    test('should combine multiple filters (contactType + source)', async ({ request }) => {
      // Создаём контакт с обоими полями
      const timestamp = Date.now();
      const response = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: `FilterTest_Both_${timestamp}`,
          contactType: contactTypeId,
          source: sourceId,
        },
      });
      const contact = await response.json();

      // Ищем по обоим фильтрам
      const searchResponse = await request.post('/api/contacts/search', {
        headers: { Cookie: authCookies },
        data: {
          contactType: contactTypeId,
          source: sourceId,
        },
      });

      expect(searchResponse.status()).toBe(200);
      const data = await searchResponse.json();

      // Проверяем что все контакты имеют оба поля
      const allMatch = data.contacts.every((c: { contactType: { id: string } | null; source: string | undefined }) =>
        c.contactType?.id === contactTypeId && c.source === sourceId
      );
      expect(allMatch).toBe(true);

      // Проверяем что наш контакт присутствует
      const found = data.contacts.find((c: { id: string }) => c.id === contact.id);
      expect(found).toBeDefined();
    });

    test('should accept ownerId filter parameter', async ({ request }) => {
      // Получаем список пользователей
      const usersResponse = await request.post('/api/users/search', {
        headers: { Cookie: authCookies },
        data: { limit: 10 },
      });
      const usersData = await usersResponse.json();

      expect(usersData.users.length).toBeGreaterThan(0);
      const testUserId = usersData.users[0].id;

      // Фильтруем по ownerId
      const response = await request.post('/api/contacts/search', {
        headers: { Cookie: authCookies },
        data: { ownerId: testUserId },
      });

      // Проверяем что запрос выполнился успешно (фильтр принят)
      expect(response.status()).toBe(200);
      const data = await response.json();

      // Проверяем структуру ответа
      expect(data.contacts).toBeDefined();
      expect(Array.isArray(data.contacts)).toBe(true);
      expect(data.total).toBeDefined();
      expect(typeof data.total).toBe('number');
      expect(data.page).toBe(1);
      expect(data.limit).toBeDefined();

      // Тест проходит, если API принимает параметр и возвращает корректную структуру
      // (не проверяем содержимое, так как ownerId не возвращается в response)
    });
  });
});
