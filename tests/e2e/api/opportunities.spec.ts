import { test, expect } from '@playwright/test';
import { generateTestUser } from '../../fixtures/test-data';

test.describe('Opportunities API', () => {
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
    test('POST /api/opportunities/search should redirect to login without auth', async ({ playwright }) => {
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
      });
      const response = await context.post('/api/opportunities/search', {
        data: {},
        maxRedirects: 0,
      });
      expect(response.status()).toBe(307);
      expect(response.headers()['location']).toContain('/login');
      await context.dispose();
    });

    test('POST /api/opportunities should redirect to login without auth', async ({ playwright }) => {
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
      });
      const response = await context.post('/api/opportunities', {
        data: { name: 'Test', amount: 1000 },
        maxRedirects: 0,
      });
      expect(response.status()).toBe(307);
      expect(response.headers()['location']).toContain('/login');
      await context.dispose();
    });
  });

  test.describe('CRUD operations', () => {
    test('POST /api/opportunities should create a new opportunity', async ({ request }) => {
      const opportunityData = {
        name: 'Big Deal',
        description: 'A very important deal',
        amount: 50000,
      };

      const response = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: opportunityData,
      });

      expect(response.status()).toBe(201);
      const opportunity = await response.json();

      expect(opportunity.name).toBe(opportunityData.name);
      expect(opportunity.amount).toBe(opportunityData.amount);
      expect(opportunity.description).toBe(opportunityData.description);
      expect(opportunity.id).toBeDefined();
      expect(opportunity.archived).toBe(false);
    });

    test('POST /api/opportunities/search should return opportunities list', async ({ request }) => {
      const response = await request.post('/api/opportunities/search', {
        headers: { Cookie: authCookies },
        data: {},
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.opportunities).toBeDefined();
      expect(Array.isArray(data.opportunities)).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(0);
      expect(data.page).toBe(1);
    });

    test('GET /api/opportunities/:id should return opportunity by id', async ({ request }) => {
      const createResponse = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Test Opportunity',
          amount: 10000,
        },
      });
      const created = await createResponse.json();

      const response = await request.get(`/api/opportunities/${created.id}`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const opportunity = await response.json();

      expect(opportunity.id).toBe(created.id);
      expect(opportunity.name).toBe('Test Opportunity');
    });

    test('GET /api/opportunities/:id should return 404 for non-existent opportunity', async ({ request }) => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request.get(`/api/opportunities/${fakeId}`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(404);
    });

    test('PATCH /api/opportunities/:id should update opportunity', async ({ request }) => {
      const createResponse = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Update Test',
          amount: 5000,
        },
      });
      const created = await createResponse.json();

      const response = await request.patch(`/api/opportunities/${created.id}`, {
        headers: { Cookie: authCookies },
        data: {
          name: 'Updated Title',
          amount: 7500,
          description: 'Updated description',
        },
      });

      expect(response.status()).toBe(200);
      const updated = await response.json();

      expect(updated.name).toBe('Updated Title');
      expect(updated.amount).toBe(7500);
      expect(updated.description).toBe('Updated description');
    });

    test('DELETE /api/opportunities/:id should delete opportunity', async ({ request }) => {
      const createResponse = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Delete Me',
          amount: 1000,
        },
      });
      const created = await createResponse.json();

      const deleteResponse = await request.delete(`/api/opportunities/${created.id}`, {
        headers: { Cookie: authCookies },
      });

      expect(deleteResponse.status()).toBe(200);

      const getResponse = await request.get(`/api/opportunities/${created.id}`, {
        headers: { Cookie: authCookies },
      });

      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('Archive functionality', () => {
    test('should archive and unarchive opportunity', async ({ request }) => {
      const createResponse = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Archive Test',
          amount: 20000,
        },
      });
      const created = await createResponse.json();
      expect(created.archived).toBe(false);

      // Archive the opportunity
      let response = await request.patch(`/api/opportunities/${created.id}`, {
        headers: { Cookie: authCookies },
        data: { archived: true },
      });
      let updated = await response.json();
      expect(updated.archived).toBe(true);

      // Unarchive
      response = await request.patch(`/api/opportunities/${created.id}`, {
        headers: { Cookie: authCookies },
        data: { archived: false },
      });
      updated = await response.json();
      expect(updated.archived).toBe(false);
    });
  });

  test.describe('Filtering', () => {
    test('POST /api/opportunities/search should support search filter', async ({ request }) => {
      // Create unique opportunity
      const uniqueName = `Unique Search Test ${Date.now()}`;
      await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: { name: uniqueName, amount: 5000 },
      });

      const response = await request.post('/api/opportunities/search', {
        headers: { Cookie: authCookies },
        data: { search: 'Unique Search Test' },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.opportunities.length).toBeGreaterThan(0);
      data.opportunities.forEach((opp: { name: string }) => {
        expect(opp.name?.toLowerCase()).toContain('unique search test');
      });
    });

    test('POST /api/opportunities/search should support amount range filter', async ({ request }) => {
      await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: { name: 'High Value', amount: 100000 },
      });

      const response = await request.post('/api/opportunities/search', {
        headers: { Cookie: authCookies },
        data: { minAmount: 50000 },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      data.opportunities.forEach((opp: { amount: number }) => {
        expect(opp.amount).toBeGreaterThanOrEqual(50000);
      });
    });

    test('POST /api/opportunities/search should support archived filter', async ({ request }) => {
      // Create and archive an opportunity
      const createResponse = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: { name: 'Archived Opp', amount: 1000, archived: true },
      });
      expect(createResponse.status()).toBe(201);

      const response = await request.post('/api/opportunities/search', {
        headers: { Cookie: authCookies },
        data: { archived: true },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      data.opportunities.forEach((opp: { archived: boolean }) => {
        expect(opp.archived).toBe(true);
      });
    });

    test('POST /api/opportunities/search should support pagination', async ({ request }) => {
      const response = await request.post('/api/opportunities/search', {
        headers: { Cookie: authCookies },
        data: { page: 1, limit: 5 },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.opportunities.length).toBeLessThanOrEqual(5);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(5);
    });
  });

  test.describe('UTM fields', () => {
    test('should create opportunity with UTM data', async ({ request }) => {
      const opportunityData = {
        name: 'UTM Test Deal',
        amount: 15000,
        utm: {
          source: 'google',
          medium: 'cpc',
          campaign: 'summer_sale',
          term: 'crm software',
          content: 'banner_v1',
        },
      };

      const response = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: opportunityData,
      });

      expect(response.status()).toBe(201);
      const opportunity = await response.json();

      expect(opportunity.utm).toBeDefined();
      expect(opportunity.utm.source).toBe('google');
      expect(opportunity.utm.medium).toBe('cpc');
      expect(opportunity.utm.campaign).toBe('summer_sale');
    });
  });

  test.describe('Closing date', () => {
    test('should create opportunity with closing date', async ({ request }) => {
      const closingDate = '2025-06-30';
      const response = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Dated Deal',
          amount: 25000,
          closingDate,
        },
      });

      expect(response.status()).toBe(201);
      const opportunity = await response.json();

      expect(opportunity.closingDate).toBeDefined();
      expect(opportunity.closingDate).toContain('2025-06-30');
    });

    test('POST /api/opportunities/search should filter by closing date range', async ({ request }) => {
      await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Q3 Deal',
          amount: 30000,
          closingDate: '2025-08-15',
        },
      });

      const response = await request.post('/api/opportunities/search', {
        headers: { Cookie: authCookies },
        data: {
          closingDateFrom: '2025-07-01',
          closingDateTo: '2025-09-30',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      data.opportunities.forEach((opp: { closingDate: string }) => {
        if (opp.closingDate) {
          const date = new Date(opp.closingDate);
          expect(date >= new Date('2025-07-01')).toBe(true);
          expect(date <= new Date('2025-09-30')).toBe(true);
        }
      });
    });
  });
});
