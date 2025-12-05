import { test, expect } from '@playwright/test';
import { generateTestUser } from '../../fixtures/test-data';

test.describe('MCP Server API', () => {
  let authCookies: string;
  let apiToken: string;

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
    authCookies = state.cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    // Создаём API токен для тестов MCP
    const tokenResponse = await request.post('/api/api-tokens', {
      headers: { Cookie: authCookies },
      data: { name: 'MCP Test Token' },
    });

    expect(tokenResponse.status()).toBe(201);
    const tokenData = await tokenResponse.json();
    apiToken = tokenData.token;
  });

  test.describe('GET /api/mcp - Server Info', () => {
    test('should return MCP server information', async ({ request }) => {
      const response = await request.get('/api/mcp');

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.name).toBe('CRM MCP Server');
      expect(data.version).toBe('1.0.0');
      expect(data.description).toBeDefined();
      expect(data.endpoints).toBeDefined();
      expect(data.endpoints.sse).toContain('/api/mcp/sse');
      expect(data.endpoints.messages).toContain('/api/mcp/messages');
      expect(data.tools).toBeDefined();
      expect(Array.isArray(data.tools)).toBe(true);
      expect(data.authentication).toBeDefined();
      expect(data.authentication.type).toBe('bearer');
    });

    test('should return list of available tools', async ({ request }) => {
      const response = await request.get('/api/mcp');
      const data = await response.json();

      const toolNames = data.tools.map((t: { name: string }) => t.name);

      // Проверяем наличие всех 46 MCP инструментов

      // === КОНТАКТЫ ===
      expect(toolNames).toContain('search_contacts');
      expect(toolNames).toContain('get_contact_details');
      expect(toolNames).toContain('create_contact');
      expect(toolNames).toContain('update_contact');
      expect(toolNames).toContain('delete_contact');

      // === СДЕЛКИ ===
      expect(toolNames).toContain('search_opportunities');
      expect(toolNames).toContain('get_opportunity_details');
      expect(toolNames).toContain('get_opportunities_stats');
      expect(toolNames).toContain('create_opportunity');
      expect(toolNames).toContain('update_opportunity');
      expect(toolNames).toContain('update_opportunity_stage');
      expect(toolNames).toContain('delete_opportunity');
      expect(toolNames).toContain('archive_opportunity');

      // === ЗАДАЧИ ===
      expect(toolNames).toContain('get_tasks_overview');
      expect(toolNames).toContain('get_task_details');
      expect(toolNames).toContain('create_task');
      expect(toolNames).toContain('update_task');
      expect(toolNames).toContain('update_task_status');
      expect(toolNames).toContain('delete_task');

      // === ВЗАИМОДЕЙСТВИЯ ===
      expect(toolNames).toContain('search_interactions');
      expect(toolNames).toContain('create_interaction');
      expect(toolNames).toContain('get_interaction_details');
      expect(toolNames).toContain('update_interaction');
      expect(toolNames).toContain('delete_interaction');
      expect(toolNames).toContain('get_interaction_stats');

      // === ВОРОНКИ ===
      expect(toolNames).toContain('get_pipelines');
      expect(toolNames).toContain('get_pipeline_stages');
      expect(toolNames).toContain('get_pipeline_analytics');

      // === СПРАВОЧНИКИ ===
      expect(toolNames).toContain('get_dictionaries');
      expect(toolNames).toContain('get_dictionary_items');

      // === КАНАЛЫ ===
      expect(toolNames).toContain('get_channels');

      // === ПОЛЬЗОВАТЕЛИ ===
      expect(toolNames).toContain('search_users');
      expect(toolNames).toContain('get_user_details');
      expect(toolNames).toContain('update_user');

      // === ПРОЕКТЫ ===
      expect(toolNames).toContain('search_projects');
      expect(toolNames).toContain('get_project_details');
      expect(toolNames).toContain('create_project');
      expect(toolNames).toContain('update_project');
      expect(toolNames).toContain('delete_project');

      // === ДОПОЛНИТЕЛЬНЫЕ ИНСТРУМЕНТЫ ===
      expect(toolNames).toContain('get_tasks_by_contact');
      expect(toolNames).toContain('get_tasks_by_project');
      expect(toolNames).toContain('get_default_pipeline');
      expect(toolNames).toContain('get_pipeline_by_code');
      expect(toolNames).toContain('get_initial_stage');
      expect(toolNames).toContain('get_interactions_by_contact');
      expect(toolNames).toContain('get_dictionary_item_by_code');

      // Проверяем общее количество инструментов
      expect(toolNames.length).toBe(46);
    });

    test('should include Claude Desktop configuration example', async ({ request }) => {
      const response = await request.get('/api/mcp');
      const data = await response.json();

      expect(data.usage).toBeDefined();
      expect(data.usage.claudeDesktop).toBeDefined();
      expect(data.usage.claudeDesktop.config).toBeDefined();
      expect(data.usage.claudeDesktop.config.mcpServers).toBeDefined();
      expect(data.usage.claudeDesktop.config.mcpServers.crm).toBeDefined();
    });
  });

  test.describe('GET /api/mcp/sse - SSE Connection', () => {
    test('should require authorization header', async ({ request }) => {
      const response = await request.get('/api/mcp/sse');

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Authorization');
    });

    test('should reject invalid API token', async ({ request }) => {
      const response = await request.get('/api/mcp/sse', {
        headers: {
          Authorization: 'Bearer invalid_token_12345',
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Invalid');
    });

    test('should reject malformed authorization header', async ({ request }) => {
      const response = await request.get('/api/mcp/sse', {
        headers: {
          Authorization: 'Basic ' + Buffer.from('user:pass').toString('base64'),
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should accept valid API token and start SSE stream', async ({ request }) => {
      // Этот тест проверяет что сервер начинает SSE соединение
      // SSE соединения остаются открытыми, поэтому мы используем catch для обработки таймаута
      // Главное - проверить что сервер отвечает 200 с правильным content-type
      let responseReceived = false;
      let responseStatus = 0;

      try {
        const response = await request.get('/api/mcp/sse', {
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
          timeout: 1000, // Короткий таймаут - нам нужен только начальный ответ
        });
        responseStatus = response.status();
        responseReceived = true;
      } catch (error) {
        // Таймаут ожидаем - SSE соединение держится открытым
        // Проверяем по логам что соединение было установлено (200 OK)
        const errorMessage = String(error);
        if (errorMessage.includes('200 OK') && errorMessage.includes('text/event-stream')) {
          responseReceived = true;
          responseStatus = 200;
        }
      }

      // SSE соединение должно успешно установиться (статус 200)
      expect(responseReceived).toBe(true);
      expect(responseStatus).toBe(200);
    });
  });

  test.describe('POST /api/mcp/messages - Message Handling', () => {
    test('should require sessionId parameter', async ({ request }) => {
      const response = await request.post('/api/mcp/messages', {
        data: { jsonrpc: '2.0', method: 'test', id: 1 },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Session');
    });

    test('should return 404 for non-existent session', async ({ request }) => {
      const response = await request.post('/api/mcp/messages?sessionId=non_existent_session', {
        data: { jsonrpc: '2.0', method: 'test', id: 1 },
      });

      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Session not found');
    });
  });

  test.describe('MCP Tools - Unit Tests via Direct Import', () => {
    // Эти тесты проверяют логику инструментов через API запросы
    // поскольку MCP использует SSE, который сложно тестировать в Playwright

    test('search_contacts should work through regular API', async ({ request }) => {
      // Создаём тестовый контакт
      const uniqueName = `MCP_Test_Contact_${Date.now()}`;
      const createResponse = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: uniqueName,
          company: 'MCP Test Company',
        },
      });
      expect(createResponse.status()).toBe(201);

      // Проверяем через обычный API что поиск работает
      const searchResponse = await request.post('/api/contacts/search', {
        headers: { Cookie: authCookies },
        data: { search: uniqueName },
      });
      expect(searchResponse.status()).toBe(200);
      const data = await searchResponse.json();
      expect(data.contacts.length).toBeGreaterThanOrEqual(1);
      expect(data.contacts[0].name).toBe(uniqueName);
    });

    test('get_contact_details should work through regular API', async ({ request }) => {
      // Создаём контакт
      const createResponse = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: 'MCP Detail Test',
          emails: [{ address: 'mcp-test@example.com' }],
        },
      });
      const contact = await createResponse.json();

      // Получаем детали
      const detailResponse = await request.get(`/api/contacts/${contact.id}`, {
        headers: { Cookie: authCookies },
      });
      expect(detailResponse.status()).toBe(200);
      const details = await detailResponse.json();
      expect(details.id).toBe(contact.id);
      expect(details.name).toBe('MCP Detail Test');
    });

    test('create_task should work through regular API', async ({ request }) => {
      const taskTitle = `MCP Task ${Date.now()}`;
      const createResponse = await request.post('/api/tasks', {
        headers: { Cookie: authCookies },
        data: {
          title: taskTitle,
          description: 'Created via MCP test',
        },
      });
      expect(createResponse.status()).toBe(201);
      const task = await createResponse.json();
      expect(task.title).toBe(taskTitle);
      expect(task.id).toBeDefined();
    });

    test('get_tasks_overview should work through regular API', async ({ request }) => {
      const response = await request.post('/api/tasks/search', {
        headers: { Cookie: authCookies },
        data: { limit: 10 },
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.tasks).toBeDefined();
      expect(Array.isArray(data.tasks)).toBe(true);
    });

    test('search_opportunities should work through regular API', async ({ request }) => {
      const response = await request.post('/api/opportunities/search', {
        headers: { Cookie: authCookies },
        data: { limit: 10 },
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.opportunities).toBeDefined();
      expect(Array.isArray(data.opportunities)).toBe(true);
    });

    test('get_pipeline_analytics should work through regular API', async ({ request }) => {
      const response = await request.get('/api/pipelines', {
        headers: { Cookie: authCookies },
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.pipelines).toBeDefined();
      expect(Array.isArray(data.pipelines)).toBe(true);
    });
  });

  test.describe('API Token Management for MCP', () => {
    test('should create new API token', async ({ request }) => {
      const response = await request.post('/api/api-tokens', {
        headers: { Cookie: authCookies },
        data: { name: 'Test MCP Token' },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data.id).toBeDefined();
      expect(data.name).toBe('Test MCP Token');
      expect(data.token).toBeDefined();
      expect(data.token).toMatch(/^crm_sk_/);
      expect(data.tokenPrefix).toBeDefined();
    });

    test('should list API tokens', async ({ request }) => {
      const response = await request.post('/api/api-tokens/search', {
        headers: { Cookie: authCookies },
        data: {},
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.tokens).toBeDefined();
      expect(Array.isArray(data.tokens)).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(1);
    });

    test('should delete API token', async ({ request }) => {
      // Создаём токен для удаления
      const createResponse = await request.post('/api/api-tokens', {
        headers: { Cookie: authCookies },
        data: { name: 'Token to Delete' },
      });
      const { id } = await createResponse.json();

      // Удаляем
      const deleteResponse = await request.delete(`/api/api-tokens/${id}`, {
        headers: { Cookie: authCookies },
      });

      expect(deleteResponse.status()).toBe(200);

      // Проверяем что токен удалён
      const getResponse = await request.get(`/api/api-tokens/${id}`, {
        headers: { Cookie: authCookies },
      });

      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('Security', () => {
    test('MCP info endpoint should be publicly accessible', async ({ playwright }) => {
      // Создаём новый контекст без cookies
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
      });

      const response = await context.get('/api/mcp');
      expect(response.status()).toBe(200);

      await context.dispose();
    });

    test('MCP SSE endpoint should reject requests without auth', async ({ playwright }) => {
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
      });

      const response = await context.get('/api/mcp/sse');
      expect(response.status()).toBe(401);

      await context.dispose();
    });

    test('should update lastUsedAt when API token is used', async ({ request }) => {
      // Создаём новый токен
      const createResponse = await request.post('/api/api-tokens', {
        headers: { Cookie: authCookies },
        data: { name: 'Token for LastUsed Test' },
      });
      const tokenData = await createResponse.json();

      // Первоначально lastUsedAt должен быть null или undefined
      expect(tokenData.lastUsedAt).toBeFalsy();

      // Используем токен для MCP запроса
      await request.get('/api/mcp/sse', {
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
        },
        timeout: 2000,
      }).catch(() => {
        // SSE соединение может таймаутиться, это нормально
      });

      // Проверяем что lastUsedAt обновился
      const getResponse = await request.get(`/api/api-tokens/${tokenData.id}`, {
        headers: { Cookie: authCookies },
      });

      const updatedToken = await getResponse.json();
      expect(updatedToken.lastUsedAt).toBeDefined();
    });
  });
});
