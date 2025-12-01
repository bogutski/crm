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
    test('GET /api/contacts should redirect to login without auth', async ({ playwright }) => {
      // Создаём новый контекст без cookies (без следования редиректам)
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3001',
      });
      const response = await context.get('/api/contacts', {
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
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Test Company',
        position: 'Manager',
        status: 'lead',
      };

      const response = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: contactData,
      });

      expect(response.status()).toBe(201);
      const contact = await response.json();

      expect(contact.firstName).toBe(contactData.firstName);
      expect(contact.lastName).toBe(contactData.lastName);
      expect(contact.email).toBe(contactData.email);
      expect(contact.fullName).toBe('John Doe');
      expect(contact.id).toBeDefined();

      createdContactId = contact.id;
    });

    test('GET /api/contacts should return contacts list', async ({ request }) => {
      const response = await request.get('/api/contacts', {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.contacts).toBeDefined();
      expect(Array.isArray(data.contacts)).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(0);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(20);
    });

    test('GET /api/contacts/:id should return contact by id', async ({ request }) => {
      // Сначала создадим контакт
      const createResponse = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
        },
      });
      const created = await createResponse.json();

      const response = await request.get(`/api/contacts/${created.id}`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const contact = await response.json();

      expect(contact.id).toBe(created.id);
      expect(contact.firstName).toBe('Jane');
      expect(contact.lastName).toBe('Smith');
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
          firstName: 'Update',
          lastName: 'Test',
        },
      });
      const created = await createResponse.json();

      // Обновляем
      const response = await request.patch(`/api/contacts/${created.id}`, {
        headers: { Cookie: authCookies },
        data: {
          firstName: 'Updated',
          company: 'New Company',
          status: 'customer',
        },
      });

      expect(response.status()).toBe(200);
      const updated = await response.json();

      expect(updated.firstName).toBe('Updated');
      expect(updated.lastName).toBe('Test');
      expect(updated.company).toBe('New Company');
      expect(updated.status).toBe('customer');
    });

    test('DELETE /api/contacts/:id should delete contact', async ({ request }) => {
      // Создаём контакт для удаления
      const createResponse = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          firstName: 'Delete',
          lastName: 'Me',
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

  test.describe('Filtering and pagination', () => {
    test('GET /api/contacts should support search filter', async ({ request }) => {
      // Создаём контакт с уникальным именем
      const uniqueName = `SearchTest${Date.now()}`;
      await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          firstName: uniqueName,
          lastName: 'Contact',
        },
      });

      const response = await request.get(`/api/contacts?search=${uniqueName}`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.contacts.length).toBeGreaterThanOrEqual(1);
      expect(data.contacts[0].firstName).toBe(uniqueName);
    });

    test('GET /api/contacts should support status filter', async ({ request }) => {
      // Создаём контакт со статусом customer
      await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          firstName: 'Customer',
          lastName: 'Test',
          status: 'customer',
        },
      });

      const response = await request.get('/api/contacts?status=customer', {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      data.contacts.forEach((contact: { status: string }) => {
        expect(contact.status).toBe('customer');
      });
    });

    test('GET /api/contacts should support pagination', async ({ request }) => {
      const response = await request.get('/api/contacts?page=1&limit=5', {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.page).toBe(1);
      expect(data.limit).toBe(5);
      expect(data.contacts.length).toBeLessThanOrEqual(5);
    });
  });
});
