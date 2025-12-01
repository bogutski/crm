import { test, expect } from '@playwright/test';
import { generateTestUser } from '../../fixtures/test-data';

test.describe('Users API', () => {
  let authCookies: string;

  test.beforeAll(async ({ request }) => {
    const user = generateTestUser();

    await request.post('/api/auth/register', {
      data: user,
    });

    const csrfResponse = await request.get('/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();

    await request.post('/api/auth/callback/credentials', {
      form: {
        email: user.email,
        password: user.password,
        csrfToken,
      },
    });

    const state = await request.storageState();
    authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');
  });

  test.describe('Unauthorized access', () => {
    test('GET /api/users should redirect to login without auth', async ({ playwright }) => {
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3001',
      });
      const response = await context.get('/api/users', {
        maxRedirects: 0,
      });
      expect(response.status()).toBe(307);
      expect(response.headers()['location']).toContain('/login');
      await context.dispose();
    });

    test('POST /api/users should redirect to login without auth', async ({ playwright }) => {
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3001',
      });
      const response = await context.post('/api/users', {
        data: { email: 'test@example.com', name: 'Test' },
        maxRedirects: 0,
      });
      expect(response.status()).toBe(307);
      expect(response.headers()['location']).toContain('/login');
      await context.dispose();
    });

    test('GET /api/users/:id should redirect to login without auth', async ({ playwright }) => {
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3001',
      });
      const response = await context.get('/api/users/507f1f77bcf86cd799439011', {
        maxRedirects: 0,
      });
      expect(response.status()).toBe(307);
      expect(response.headers()['location']).toContain('/login');
      await context.dispose();
    });
  });

  test.describe('List users', () => {
    test('GET /api/users should return users list', async ({ request }) => {
      const response = await request.get('/api/users', {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(1);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(20);
    });

    test('GET /api/users should support search filter', async ({ request }) => {
      // Текущий пользователь должен найтись по имени
      const response = await request.get('/api/users?search=Test', {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.users.length).toBeGreaterThanOrEqual(1);
    });

    test('GET /api/users should support pagination', async ({ request }) => {
      const response = await request.get('/api/users?page=1&limit=5', {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.page).toBe(1);
      expect(data.limit).toBe(5);
      expect(data.users.length).toBeLessThanOrEqual(5);
    });

    test('GET /api/users should support role filter', async ({ request }) => {
      const response = await request.get('/api/users?role=user', {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      data.users.forEach((user: { roles: string[] }) => {
        expect(user.roles).toContain('user');
      });
    });
  });

  test.describe('Create user', () => {
    test('POST /api/users should create a new user', async ({ request }) => {
      const userData = {
        email: `new-user-${Date.now()}@example.com`,
        name: 'New User',
        password: 'Password123',
        roles: ['user'],
      };

      const response = await request.post('/api/users', {
        headers: { Cookie: authCookies },
        data: userData,
      });

      expect(response.status()).toBe(201);
      const user = await response.json();

      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.roles).toContain('user');
      expect(user.isActive).toBe(true);
      expect(user.id).toBeDefined();
    });

    test('POST /api/users should return 409 for duplicate email', async ({ request }) => {
      const email = `duplicate-${Date.now()}@example.com`;

      // Создаём первого пользователя
      await request.post('/api/users', {
        headers: { Cookie: authCookies },
        data: {
          email,
          name: 'First User',
          password: 'Password123',
        },
      });

      // Пытаемся создать с тем же email
      const response = await request.post('/api/users', {
        headers: { Cookie: authCookies },
        data: {
          email,
          name: 'Second User',
          password: 'Password123',
        },
      });

      expect(response.status()).toBe(409);
    });
  });

  test.describe('Get user by ID', () => {
    test('GET /api/users/:id should return user', async ({ request }) => {
      // Создаём пользователя
      const createResponse = await request.post('/api/users', {
        headers: { Cookie: authCookies },
        data: {
          email: `get-by-id-${Date.now()}@example.com`,
          name: 'Get By ID User',
          password: 'Password123',
        },
      });
      const created = await createResponse.json();

      const response = await request.get(`/api/users/${created.id}`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const user = await response.json();

      expect(user.id).toBe(created.id);
      expect(user.name).toBe('Get By ID User');
    });

    test('GET /api/users/:id should return 404 for non-existent user', async ({ request }) => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request.get(`/api/users/${fakeId}`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(404);
    });
  });

  test.describe('Update user', () => {
    test('PATCH /api/users/:id should update user', async ({ request }) => {
      // Создаём пользователя
      const createResponse = await request.post('/api/users', {
        headers: { Cookie: authCookies },
        data: {
          email: `update-${Date.now()}@example.com`,
          name: 'Update Test',
          password: 'Password123',
        },
      });
      const created = await createResponse.json();

      // Обновляем
      const response = await request.patch(`/api/users/${created.id}`, {
        headers: { Cookie: authCookies },
        data: {
          name: 'Updated Name',
          roles: ['manager'],
        },
      });

      expect(response.status()).toBe(200);
      const updated = await response.json();

      expect(updated.name).toBe('Updated Name');
      expect(updated.roles).toContain('manager');
    });

    test('PATCH /api/users/:id should return 404 for non-existent user', async ({ request }) => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request.patch(`/api/users/${fakeId}`, {
        headers: { Cookie: authCookies },
        data: { name: 'Test' },
      });

      expect(response.status()).toBe(404);
    });

    test('PATCH /api/users/:id should deactivate user', async ({ request }) => {
      const createResponse = await request.post('/api/users', {
        headers: { Cookie: authCookies },
        data: {
          email: `deactivate-${Date.now()}@example.com`,
          name: 'Deactivate Test',
          password: 'Password123',
        },
      });
      const created = await createResponse.json();

      const response = await request.patch(`/api/users/${created.id}`, {
        headers: { Cookie: authCookies },
        data: { isActive: false },
      });

      expect(response.status()).toBe(200);
      const updated = await response.json();

      expect(updated.isActive).toBe(false);
    });
  });

  test.describe('Delete user', () => {
    test('DELETE /api/users/:id should delete user', async ({ request }) => {
      // Создаём пользователя
      const createResponse = await request.post('/api/users', {
        headers: { Cookie: authCookies },
        data: {
          email: `delete-${Date.now()}@example.com`,
          name: 'Delete Test',
          password: 'Password123',
        },
      });
      const created = await createResponse.json();

      // Удаляем
      const deleteResponse = await request.delete(`/api/users/${created.id}`, {
        headers: { Cookie: authCookies },
      });

      expect(deleteResponse.status()).toBe(200);

      // Проверяем что пользователь удалён
      const getResponse = await request.get(`/api/users/${created.id}`, {
        headers: { Cookie: authCookies },
      });

      expect(getResponse.status()).toBe(404);
    });

    test('DELETE /api/users/:id should return 404 for non-existent user', async ({ request }) => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request.delete(`/api/users/${fakeId}`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(404);
    });
  });
});
