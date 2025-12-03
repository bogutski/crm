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
        baseURL: 'http://localhost:3001',
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
        baseURL: 'http://localhost:3001',
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
});
