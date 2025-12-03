import { test, expect } from '@playwright/test';
import { generateTestUser } from '../fixtures/test-data';

test.describe.configure({ mode: 'serial' });

test.describe('Settings Providers Page', () => {
  let user: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    user = generateTestUser();

    // Register and login
    await page.goto('/login');
    await page.getByRole('button', { name: 'Регистрация' }).click();
    await page.getByLabel('Имя').fill(user.name);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Пароль').fill(user.password);
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });

  test.describe('Navigation', () => {
    test('should navigate to providers page from settings', async ({ page }) => {
      await page.goto('/settings');
      await page.getByRole('link', { name: 'Провайдеры' }).click();
      await expect(page).toHaveURL('/settings/providers');
      await expect(page.getByRole('heading', { name: 'Провайдеры' })).toBeVisible();
    });

    test('should show providers section in settings navigation', async ({ page }) => {
      await page.goto('/settings/providers');
      await expect(page.getByRole('link', { name: 'Провайдеры' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Телефония' })).toBeVisible();
    });

    test('should show page description', async ({ page }) => {
      await page.goto('/settings/providers');
      await expect(page.getByText('Управление провайдерами телефонии и AI агентами')).toBeVisible();
    });
  });

  test.describe('Providers tabs', () => {
    test('should display tabs for telephony and AI agents', async ({ page }) => {
      await page.goto('/settings/providers');

      await expect(page.getByRole('button', { name: /Телефония/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /AI Агенты/ })).toBeVisible();
    });

    test('should switch between tabs', async ({ page }) => {
      await page.goto('/settings/providers');

      // Click AI Agents tab
      await page.getByRole('button', { name: /AI Агенты/ }).click();

      // Add button should still be visible
      await expect(page.getByTestId('add-provider-button')).toBeVisible();
    });

    test('should show empty state for new users', async ({ page }) => {
      await page.goto('/settings/providers');

      // Should show empty state message
      await expect(page.getByText('Провайдеры телефонии не настроены')).toBeVisible();
    });
  });

  test.describe('Create provider', () => {
    test('should open slide-over panel when clicking add button', async ({ page }) => {
      await page.goto('/settings/providers');
      await page.getByTestId('add-provider-button').click();

      await expect(page.getByRole('heading', { name: 'Добавить провайдера' })).toBeVisible();
      await expect(page.getByTestId('provider-form')).toBeVisible();
    });

    test('should show provider type selection', async ({ page }) => {
      await page.goto('/settings/providers');
      await page.getByTestId('add-provider-button').click();

      // Should show available provider types
      await expect(page.getByTestId('provider-type-twilio')).toBeVisible();
      await expect(page.getByTestId('provider-type-telnyx')).toBeVisible();
    });

    test('should show provider config fields after selecting type', async ({ page }) => {
      await page.goto('/settings/providers');
      await page.getByTestId('add-provider-button').click();

      // Select Twilio
      await page.getByTestId('provider-type-twilio').click();

      // Should show Twilio config fields
      await expect(page.getByTestId('provider-config-accountSid')).toBeVisible();
      await expect(page.getByTestId('provider-config-authToken')).toBeVisible();
    });

    test('should auto-fill name when selecting provider type', async ({ page }) => {
      await page.goto('/settings/providers');
      await page.getByTestId('add-provider-button').click();

      // Select Twilio
      await page.getByTestId('provider-type-twilio').click();

      // Name should be auto-filled
      await expect(page.getByTestId('provider-name-input')).toHaveValue('Twilio');
    });

    test('should close slide-over panel on cancel', async ({ page }) => {
      await page.goto('/settings/providers');
      await page.getByTestId('add-provider-button').click();

      await expect(page.getByRole('heading', { name: 'Добавить провайдера' })).toBeVisible();

      await page.getByRole('button', { name: 'Отмена' }).click();

      await expect(page.getByRole('heading', { name: 'Добавить провайдера' })).not.toBeVisible();
    });

    test('should show AI agent provider types in AI tab', async ({ page }) => {
      await page.goto('/settings/providers');

      // Switch to AI tab
      await page.getByRole('button', { name: /AI Агенты/ }).click();
      await page.getByTestId('add-provider-button').click();

      // Should show AI agent provider types
      await expect(page.getByTestId('provider-type-vapi')).toBeVisible();
      await expect(page.getByTestId('provider-type-elevenlabs')).toBeVisible();
    });

    test('should show VAPI config fields', async ({ page }) => {
      await page.goto('/settings/providers');

      // Switch to AI tab
      await page.getByRole('button', { name: /AI Агенты/ }).click();
      await page.getByTestId('add-provider-button').click();

      // Select VAPI
      await page.getByTestId('provider-type-vapi').click();

      // Should show VAPI config fields
      await expect(page.getByTestId('provider-config-apiKey')).toBeVisible();
    });

    test('should show documentation link for provider', async ({ page }) => {
      await page.goto('/settings/providers');
      await page.getByTestId('add-provider-button').click();

      // Select Twilio
      await page.getByTestId('provider-type-twilio').click();

      // Should show documentation link
      await expect(page.getByRole('link', { name: 'Документация' })).toBeVisible();
    });
  });

  test.describe('Provider with test data', () => {
    test.beforeEach(async ({ page, request }) => {
      // Get auth cookies
      const state = await page.context().storageState();
      const authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // Create a test provider via API
      await request.post('/api/providers', {
        headers: { Cookie: authCookies },
        data: {
          type: 'twilio',
          name: 'Test Twilio Provider',
          description: 'Test description',
          config: {
            accountSid: 'ACtest123',
            authToken: 'testtoken123',
          },
          capabilities: ['voice_inbound', 'voice_outbound'],
          isActive: true,
        },
      });
    });

    test('should display provider in table', async ({ page }) => {
      await page.goto('/settings/providers');

      await expect(page.getByTestId('providers-table')).toBeVisible();
      await expect(page.getByText('Test Twilio Provider')).toBeVisible();
    });

    test('should show provider capabilities', async ({ page }) => {
      await page.goto('/settings/providers');

      // Provider capabilities should be shown
      await expect(page.getByText('Входящие')).toBeVisible();
      await expect(page.getByText('Исходящие')).toBeVisible();
    });

    test('should toggle provider active status', async ({ page }) => {
      await page.goto('/settings/providers');

      // Find the toggle button for the provider
      const row = page.locator('tr').filter({ hasText: 'Test Twilio Provider' });
      const toggleButton = row.getByRole('button', { name: /Активен/ });

      await expect(toggleButton).toBeVisible();
      await toggleButton.click();

      // Status should change
      await expect(row.getByRole('button', { name: /Отключён/ })).toBeVisible();
    });

    test('should open edit form when clicking edit button', async ({ page }) => {
      await page.goto('/settings/providers');

      const row = page.locator('tr').filter({ hasText: 'Test Twilio Provider' });
      await row.getByRole('button', { name: 'Редактировать' }).click();

      await expect(page.getByRole('heading', { name: 'Редактировать провайдера' })).toBeVisible();
      await expect(page.getByTestId('provider-name-input')).toHaveValue('Test Twilio Provider');
    });

    test('should show delete confirmation dialog', async ({ page }) => {
      await page.goto('/settings/providers');

      const row = page.locator('tr').filter({ hasText: 'Test Twilio Provider' });
      await row.getByRole('button', { name: 'Удалить' }).click();

      await expect(page.getByRole('heading', { name: 'Удалить провайдера?' })).toBeVisible();
      await expect(page.getByText('Test Twilio Provider')).toBeVisible();
    });

    test('should delete provider when confirming', async ({ page }) => {
      await page.goto('/settings/providers');

      await expect(page.getByText('Test Twilio Provider')).toBeVisible();

      const row = page.locator('tr').filter({ hasText: 'Test Twilio Provider' });
      await row.getByRole('button', { name: 'Удалить' }).click();

      await expect(page.getByRole('heading', { name: 'Удалить провайдера?' })).toBeVisible();
      await page.getByRole('button', { name: 'Удалить' }).last().click();

      await expect(page.getByRole('heading', { name: 'Удалить провайдера?' })).not.toBeVisible();
      await expect(page.getByText('Test Twilio Provider')).not.toBeVisible();
    });
  });
});
