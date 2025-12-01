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
    test('GET /api/opportunities should redirect to login without auth', async ({ playwright }) => {
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3001',
      });
      const response = await context.get('/api/opportunities', {
        maxRedirects: 0,
      });
      expect(response.status()).toBe(307);
      expect(response.headers()['location']).toContain('/login');
      await context.dispose();
    });

    test('POST /api/opportunities should redirect to login without auth', async ({ playwright }) => {
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3001',
      });
      const response = await context.post('/api/opportunities', {
        data: { title: 'Test', value: 1000 },
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
        title: 'Big Deal',
        description: 'A very important deal',
        value: 50000,
        currency: 'USD',
        stage: 'prospecting',
        priority: 'high',
        probability: 25,
      };

      const response = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: opportunityData,
      });

      expect(response.status()).toBe(201);
      const opportunity = await response.json();

      expect(opportunity.title).toBe(opportunityData.title);
      expect(opportunity.value).toBe(opportunityData.value);
      expect(opportunity.stage).toBe(opportunityData.stage);
      expect(opportunity.priority).toBe(opportunityData.priority);
      expect(opportunity.id).toBeDefined();
    });

    test('GET /api/opportunities should return opportunities list', async ({ request }) => {
      const response = await request.get('/api/opportunities', {
        headers: { Cookie: authCookies },
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
          title: 'Test Opportunity',
          value: 10000,
        },
      });
      const created = await createResponse.json();

      const response = await request.get(`/api/opportunities/${created.id}`, {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const opportunity = await response.json();

      expect(opportunity.id).toBe(created.id);
      expect(opportunity.title).toBe('Test Opportunity');
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
          title: 'Update Test',
          value: 5000,
          stage: 'prospecting',
        },
      });
      const created = await createResponse.json();

      const response = await request.patch(`/api/opportunities/${created.id}`, {
        headers: { Cookie: authCookies },
        data: {
          title: 'Updated Title',
          value: 7500,
          stage: 'qualification',
          probability: 50,
        },
      });

      expect(response.status()).toBe(200);
      const updated = await response.json();

      expect(updated.title).toBe('Updated Title');
      expect(updated.value).toBe(7500);
      expect(updated.stage).toBe('qualification');
      expect(updated.probability).toBe(50);
    });

    test('DELETE /api/opportunities/:id should delete opportunity', async ({ request }) => {
      const createResponse = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          title: 'Delete Me',
          value: 1000,
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

  test.describe('Stages workflow', () => {
    test('should move opportunity through stages', async ({ request }) => {
      const createResponse = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          title: 'Stage Workflow Test',
          value: 20000,
          stage: 'prospecting',
        },
      });
      const created = await createResponse.json();
      expect(created.stage).toBe('prospecting');

      // Move to qualification
      let response = await request.patch(`/api/opportunities/${created.id}`, {
        headers: { Cookie: authCookies },
        data: { stage: 'qualification' },
      });
      let updated = await response.json();
      expect(updated.stage).toBe('qualification');

      // Move to proposal
      response = await request.patch(`/api/opportunities/${created.id}`, {
        headers: { Cookie: authCookies },
        data: { stage: 'proposal' },
      });
      updated = await response.json();
      expect(updated.stage).toBe('proposal');

      // Move to negotiation
      response = await request.patch(`/api/opportunities/${created.id}`, {
        headers: { Cookie: authCookies },
        data: { stage: 'negotiation' },
      });
      updated = await response.json();
      expect(updated.stage).toBe('negotiation');

      // Close as won
      response = await request.patch(`/api/opportunities/${created.id}`, {
        headers: { Cookie: authCookies },
        data: { stage: 'closed_won' },
      });
      updated = await response.json();
      expect(updated.stage).toBe('closed_won');
    });
  });

  test.describe('Statistics', () => {
    test('GET /api/opportunities/stats should return statistics', async ({ request }) => {
      // Создаём несколько opportunities
      await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: { title: 'Stats Test 1', value: 10000, stage: 'prospecting' },
      });
      await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: { title: 'Stats Test 2', value: 20000, stage: 'qualification' },
      });

      const response = await request.get('/api/opportunities/stats', {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const stats = await response.json();

      expect(stats.totalValue).toBeDefined();
      expect(stats.totalCount).toBeDefined();
      expect(stats.byStage).toBeDefined();
      expect(stats.avgProbability).toBeDefined();
    });
  });

  test.describe('Filtering', () => {
    test('GET /api/opportunities should support stage filter', async ({ request }) => {
      await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: { title: 'Filter Test', value: 5000, stage: 'proposal' },
      });

      const response = await request.get('/api/opportunities?stage=proposal', {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      data.opportunities.forEach((opp: { stage: string }) => {
        expect(opp.stage).toBe('proposal');
      });
    });

    test('GET /api/opportunities should support value range filter', async ({ request }) => {
      await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: { title: 'High Value', value: 100000 },
      });

      const response = await request.get('/api/opportunities?minValue=50000', {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      data.opportunities.forEach((opp: { value: number }) => {
        expect(opp.value).toBeGreaterThanOrEqual(50000);
      });
    });

    test('GET /api/opportunities should support priority filter', async ({ request }) => {
      await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: { title: 'High Priority', value: 30000, priority: 'high' },
      });

      const response = await request.get('/api/opportunities?priority=high', {
        headers: { Cookie: authCookies },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      data.opportunities.forEach((opp: { priority: string }) => {
        expect(opp.priority).toBe('high');
      });
    });
  });
});
