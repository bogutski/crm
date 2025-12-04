import { test, expect } from '@playwright/test';
import { generateTestUser } from '../fixtures/test-data';

test.describe.configure({ mode: 'serial' });

test.describe('Settings Routing Rules Page', () => {
  let user: ReturnType<typeof generateTestUser>;
  let providerId: string;
  let phoneLineId: string;
  let aiProviderId: string;

  test.beforeEach(async ({ page, request }) => {
    user = generateTestUser();

    // Register and login
    await page.goto('/login');
    await page.getByRole('button', { name: 'Регистрация' }).click();
    await page.getByLabel('Имя').fill(user.name);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Пароль').fill(user.password);
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // Get auth cookies and user ID
    const state = await page.context().storageState();
    const authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const meRes = await request.get('/api/auth/me', {
      headers: { Cookie: authCookies },
    });
    const me = await meRes.json();

    // Create a telephony provider
    const providerRes = await request.post('/api/providers', {
      headers: { Cookie: authCookies },
      data: {
        type: 'twilio',
        name: 'Routing Rules Test Provider',
        config: {
          accountSid: 'ACtest123',
          authToken: 'testtoken123',
        },
        capabilities: ['voice_inbound', 'voice_outbound'],
        isActive: true,
      },
    });
    const provider = await providerRes.json();
    providerId = provider.id;

    // Create an AI provider
    const aiProviderRes = await request.post('/api/providers', {
      headers: { Cookie: authCookies },
      data: {
        type: 'vapi',
        name: 'Test VAPI',
        config: {
          apiKey: 'test-api-key',
        },
        capabilities: ['ai_conversation'],
        isActive: true,
      },
    });
    const aiProvider = await aiProviderRes.json();
    aiProviderId = aiProvider.id;

    // Create a phone line
    const phoneLineRes = await request.post('/api/phone-lines', {
      headers: { Cookie: authCookies },
      data: {
        userId: me.id,
        providerId: providerId,
        phoneNumber: '+79001234567',
        displayName: 'Тест линия',
        capabilities: ['voice'],
        isActive: true,
      },
    });
    const phoneLine = await phoneLineRes.json();
    phoneLineId = phoneLine.id;
  });

  test.describe('Navigation', () => {
    test('should navigate to routing rules from phone line', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      await expect(page.getByText('Правила маршрутизации')).toBeVisible();
      await expect(page.getByText('Настройте обработку входящих звонков')).toBeVisible();
    });

    test('should show back link to phone lines', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      await expect(page.getByRole('link', { name: 'Назад к линиям' })).toBeVisible();
    });

    test('should show phone line info in header', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      await expect(page.getByText('+7 (900) 123-45-67')).toBeVisible();
      await expect(page.getByText('Тест линия')).toBeVisible();
    });
  });

  test.describe('Routing rules list', () => {
    test('should show empty state for new phone line', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      await expect(page.getByText('Правила маршрутизации не настроены')).toBeVisible();
      await expect(page.getByText('Входящие звонки будут переадресованы на владельца линии')).toBeVisible();
    });

    test('should show add rule button', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      await expect(page.getByTestId('add-routing-rule-button')).toBeVisible();
    });
  });

  test.describe('Create routing rule', () => {
    test('should open slide-over panel when clicking add button', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);
      await page.getByTestId('add-routing-rule-button').click();

      await expect(page.getByRole('heading', { name: 'Добавить правило маршрутизации' })).toBeVisible();
      await expect(page.getByTestId('routing-rule-form')).toBeVisible();
    });

    test('should show rule name input', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);
      await page.getByTestId('add-routing-rule-button').click();

      await expect(page.getByTestId('routing-rule-name-input')).toBeVisible();
    });

    test('should show condition selector', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);
      await page.getByTestId('add-routing-rule-button').click();

      await expect(page.getByTestId('routing-rule-condition-select')).toBeVisible();
    });

    test('should show action type buttons', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);
      await page.getByTestId('add-routing-rule-button').click();

      await expect(page.getByTestId('routing-rule-action-forward_manager')).toBeVisible();
      await expect(page.getByTestId('routing-rule-action-forward_number')).toBeVisible();
      await expect(page.getByTestId('routing-rule-action-forward_ai_agent')).toBeVisible();
      await expect(page.getByTestId('routing-rule-action-voicemail')).toBeVisible();
    });

    test('should show AI agent config when selecting AI action', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);
      await page.getByTestId('add-routing-rule-button').click();

      // Select AI agent action
      await page.getByTestId('routing-rule-action-forward_ai_agent').click();

      // Should show AI config section
      await expect(page.getByText('Настройки AI агента')).toBeVisible();
      await expect(page.getByLabel('AI провайдер')).toBeVisible();
    });

    test('should show schedule options for after_hours condition', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);
      await page.getByTestId('add-routing-rule-button').click();

      // Select after_hours condition
      await page.getByTestId('routing-rule-condition-select').selectOption('after_hours');

      // Should show schedule options
      await expect(page.getByText('Расписание')).toBeVisible();
      await expect(page.getByText('Рабочие дни')).toBeVisible();
    });

    test('should close slide-over panel on cancel', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);
      await page.getByTestId('add-routing-rule-button').click();

      await expect(page.getByRole('heading', { name: 'Добавить правило маршрутизации' })).toBeVisible();

      await page.getByRole('button', { name: 'Отмена' }).click();

      await expect(page.getByRole('heading', { name: 'Добавить правило маршрутизации' })).not.toBeVisible();
    });

    test('should create rule with AI agent action', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);
      await page.getByTestId('add-routing-rule-button').click();

      // Fill name
      await page.getByTestId('routing-rule-name-input').fill('Ночной AI');

      // Select condition
      await page.getByTestId('routing-rule-condition-select').selectOption('after_hours');

      // Select AI action
      await page.getByTestId('routing-rule-action-forward_ai_agent').click();

      // Select AI provider
      await page.getByLabel('AI провайдер').selectOption({ label: /Test VAPI/ });

      // Submit
      await page.getByTestId('routing-rule-submit-button').click();

      // Rule should appear in list
      await expect(page.getByText('Ночной AI')).toBeVisible();
    });
  });

  test.describe('Routing rules with test data', () => {
    let ruleId: string;

    test.beforeEach(async ({ page, request }) => {
      const state = await page.context().storageState();
      const authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // Create a test routing rule
      const ruleRes = await request.post('/api/routing-rules', {
        headers: { Cookie: authCookies },
        data: {
          phoneLineId: phoneLineId,
          name: 'Тестовое правило',
          description: 'Описание правила',
          condition: 'no_answer',
          noAnswerRings: 3,
          action: {
            type: 'forward_ai_agent',
            aiProviderId: aiProviderId,
            recordCall: true,
            createTask: true,
          },
          isActive: true,
        },
      });
      const rule = await ruleRes.json();
      ruleId = rule.id;
    });

    test('should display rule in list', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      await expect(page.getByTestId('routing-rules-list')).toBeVisible();
      await expect(page.getByText('Тестовое правило')).toBeVisible();
    });

    test('should show rule condition and action', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      const card = page.getByTestId(`routing-rule-card-${ruleId}`);
      await expect(card.getByText(/Нет ответа/)).toBeVisible();
      await expect(card.getByText('AI агент')).toBeVisible();
    });

    test('should show rule options badges', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      const card = page.getByTestId(`routing-rule-card-${ruleId}`);
      await expect(card.getByText('Запись')).toBeVisible();
      await expect(card.getByText('Задача')).toBeVisible();
    });

    test('should toggle rule active status', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      const toggleButton = page.getByTestId(`routing-rule-toggle-${ruleId}`);
      await expect(toggleButton).toContainText('Вкл');

      await toggleButton.click();

      await expect(toggleButton).toContainText('Выкл');
    });

    test('should open edit form', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      await page.getByTestId(`routing-rule-edit-${ruleId}`).click();

      await expect(page.getByRole('heading', { name: 'Редактировать правило' })).toBeVisible();
      await expect(page.getByTestId('routing-rule-name-input')).toHaveValue('Тестовое правило');
    });

    test('should update rule name', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      await page.getByTestId(`routing-rule-edit-${ruleId}`).click();

      await page.getByTestId('routing-rule-name-input').clear();
      await page.getByTestId('routing-rule-name-input').fill('Обновлённое правило');

      await page.getByTestId('routing-rule-submit-button').click();

      await expect(page.getByRole('heading', { name: 'Редактировать правило' })).not.toBeVisible();
      await expect(page.getByText('Обновлённое правило')).toBeVisible();
    });

    test('should show delete confirmation dialog', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      await page.getByTestId(`routing-rule-delete-${ruleId}`).click();

      await expect(page.getByRole('heading', { name: 'Удалить правило?' })).toBeVisible();
      await expect(page.getByText('Тестовое правило')).toBeVisible();
    });

    test('should delete rule when confirming', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      await expect(page.getByText('Тестовое правило')).toBeVisible();

      await page.getByTestId(`routing-rule-delete-${ruleId}`).click();
      await expect(page.getByRole('heading', { name: 'Удалить правило?' })).toBeVisible();

      await page.getByRole('button', { name: 'Удалить' }).last().click();

      await expect(page.getByRole('heading', { name: 'Удалить правило?' })).not.toBeVisible();
      await expect(page.getByText('Тестовое правило')).not.toBeVisible();
    });
  });

  test.describe('Drag and drop reordering', () => {
    test.beforeEach(async ({ page, request }) => {
      const state = await page.context().storageState();
      const authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // Create multiple rules
      await request.post('/api/routing-rules', {
        headers: { Cookie: authCookies },
        data: {
          phoneLineId: phoneLineId,
          name: 'Правило 1',
          condition: 'always',
          action: { type: 'voicemail' },
          isActive: true,
          priority: 100,
        },
      });

      await request.post('/api/routing-rules', {
        headers: { Cookie: authCookies },
        data: {
          phoneLineId: phoneLineId,
          name: 'Правило 2',
          condition: 'no_answer',
          action: { type: 'hangup' },
          isActive: true,
          priority: 50,
        },
      });
    });

    test('should show reordering hint', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      await expect(page.getByText('Правила применяются сверху вниз')).toBeVisible();
      await expect(page.getByText('Перетащите для изменения порядка')).toBeVisible();
    });

    test('should show priority numbers', async ({ page }) => {
      await page.goto(`/settings/phone-lines/${phoneLineId}`);

      // Rules should have priority numbers
      const rules = page.getByTestId('routing-rules-list');
      await expect(rules.locator('.w-6.h-6').first()).toContainText('1');
    });
  });
});
