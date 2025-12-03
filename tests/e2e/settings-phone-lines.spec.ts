import { test, expect } from '@playwright/test';
import { generateTestUser } from '../fixtures/test-data';

test.describe.configure({ mode: 'serial' });

test.describe('Settings Phone Lines Page', () => {
  let user: ReturnType<typeof generateTestUser>;
  let providerId: string;

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

    // Create a provider for phone lines
    const state = await page.context().storageState();
    const authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const providerRes = await request.post('/api/providers', {
      headers: { Cookie: authCookies },
      data: {
        type: 'twilio',
        name: 'Phone Lines Test Provider',
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
  });

  test.describe('Navigation', () => {
    test('should navigate to phone lines page from settings', async ({ page }) => {
      await page.goto('/settings');
      await page.getByRole('link', { name: 'Телефония' }).click();
      await expect(page).toHaveURL('/settings/phone-lines');
      await expect(page.getByRole('heading', { name: 'Телефонные линии' })).toBeVisible();
    });

    test('should show page description', async ({ page }) => {
      await page.goto('/settings/phone-lines');
      await expect(page.getByText('Управление телефонными номерами и настройками переадресации')).toBeVisible();
    });
  });

  test.describe('Phone lines list', () => {
    test('should show empty state for new users', async ({ page }) => {
      await page.goto('/settings/phone-lines');
      await expect(page.getByText('Телефонные линии не настроены')).toBeVisible();
    });

    test('should show add line button', async ({ page }) => {
      await page.goto('/settings/phone-lines');
      await expect(page.getByTestId('add-phone-line-button')).toBeVisible();
    });
  });

  test.describe('Create phone line', () => {
    test('should open slide-over panel when clicking add button', async ({ page }) => {
      await page.goto('/settings/phone-lines');
      await page.getByTestId('add-phone-line-button').click();

      await expect(page.getByRole('heading', { name: 'Добавить телефонную линию' })).toBeVisible();
      await expect(page.getByTestId('phone-line-form')).toBeVisible();
    });

    test('should show user selection', async ({ page }) => {
      await page.goto('/settings/phone-lines');
      await page.getByTestId('add-phone-line-button').click();

      await expect(page.getByTestId('phone-line-user-select')).toBeVisible();
    });

    test('should show provider selection', async ({ page }) => {
      await page.goto('/settings/phone-lines');
      await page.getByTestId('add-phone-line-button').click();

      await expect(page.getByTestId('phone-line-provider-select')).toBeVisible();
    });

    test('should show phone number input with E.164 hint', async ({ page }) => {
      await page.goto('/settings/phone-lines');
      await page.getByTestId('add-phone-line-button').click();

      await expect(page.getByTestId('phone-line-number-input')).toBeVisible();
      await expect(page.getByText('E.164')).toBeVisible();
    });

    test('should show capabilities selection', async ({ page }) => {
      await page.goto('/settings/phone-lines');
      await page.getByTestId('add-phone-line-button').click();

      await expect(page.getByTestId('phone-line-cap-voice')).toBeVisible();
      await expect(page.getByTestId('phone-line-cap-sms')).toBeVisible();
    });

    test('should show forwarding settings', async ({ page }) => {
      await page.goto('/settings/phone-lines');
      await page.getByTestId('add-phone-line-button').click();

      await expect(page.getByTestId('phone-line-forwarding-checkbox')).toBeVisible();
    });

    test('should expand forwarding options when enabled', async ({ page }) => {
      await page.goto('/settings/phone-lines');
      await page.getByTestId('add-phone-line-button').click();

      // Enable forwarding
      await page.getByTestId('phone-line-forwarding-checkbox').click();

      // Should show forwarding options
      await expect(page.getByTestId('phone-line-forward-to-input')).toBeVisible();
      await expect(page.getByTestId('phone-line-rings-select')).toBeVisible();
    });

    test('should close slide-over panel on cancel', async ({ page }) => {
      await page.goto('/settings/phone-lines');
      await page.getByTestId('add-phone-line-button').click();

      await expect(page.getByRole('heading', { name: 'Добавить телефонную линию' })).toBeVisible();

      await page.getByRole('button', { name: 'Отмена' }).click();

      await expect(page.getByRole('heading', { name: 'Добавить телефонную линию' })).not.toBeVisible();
    });
  });

  test.describe('Phone line with test data', () => {
    let phoneLineId: string;
    const testPhoneNumber = '+79001234567';

    test.beforeEach(async ({ page, request }) => {
      // Get auth cookies and user ID
      const state = await page.context().storageState();
      const authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // Get current user
      const meRes = await request.get('/api/auth/me', {
        headers: { Cookie: authCookies },
      });
      const me = await meRes.json();

      // Create a test phone line via API
      const phoneLineRes = await request.post('/api/phone-lines', {
        headers: { Cookie: authCookies },
        data: {
          userId: me.id,
          providerId: providerId,
          phoneNumber: testPhoneNumber,
          displayName: 'Рабочий телефон',
          capabilities: ['voice', 'sms'],
          isDefault: true,
          isActive: true,
          forwardingEnabled: false,
        },
      });
      const phoneLine = await phoneLineRes.json();
      phoneLineId = phoneLine.id;
    });

    test('should display phone line in list', async ({ page }) => {
      await page.goto('/settings/phone-lines');

      await expect(page.getByTestId('phone-lines-list')).toBeVisible();
      await expect(page.getByText('+7 (900) 123-45-67')).toBeVisible();
      await expect(page.getByText('Рабочий телефон')).toBeVisible();
    });

    test('should show default badge', async ({ page }) => {
      await page.goto('/settings/phone-lines');

      const card = page.getByTestId(`phone-line-card-${phoneLineId}`);
      await expect(card.getByText('По умолчанию')).toBeVisible();
    });

    test('should show capabilities badges', async ({ page }) => {
      await page.goto('/settings/phone-lines');

      const card = page.getByTestId(`phone-line-card-${phoneLineId}`);
      await expect(card.getByText('VOICE')).toBeVisible();
      await expect(card.getByText('SMS')).toBeVisible();
    });

    test('should toggle active status', async ({ page }) => {
      await page.goto('/settings/phone-lines');

      const toggleButton = page.getByTestId(`phone-line-toggle-${phoneLineId}`);
      await expect(toggleButton).toContainText('Активна');

      await toggleButton.click();

      await expect(toggleButton).toContainText('Отключена');
    });

    test('should navigate to routing rules page', async ({ page }) => {
      await page.goto('/settings/phone-lines');

      await page.getByTestId(`phone-line-rules-${phoneLineId}`).click();

      await expect(page).toHaveURL(`/settings/phone-lines/${phoneLineId}`);
      await expect(page.getByText('Правила маршрутизации')).toBeVisible();
    });

    test('should open edit form', async ({ page }) => {
      await page.goto('/settings/phone-lines');

      await page.getByTestId(`phone-line-edit-${phoneLineId}`).click();

      await expect(page.getByRole('heading', { name: 'Редактировать телефонную линию' })).toBeVisible();
      await expect(page.getByTestId('phone-line-name-input')).toHaveValue('Рабочий телефон');
    });

    test('should update phone line name', async ({ page }) => {
      await page.goto('/settings/phone-lines');

      await page.getByTestId(`phone-line-edit-${phoneLineId}`).click();

      await page.getByTestId('phone-line-name-input').clear();
      await page.getByTestId('phone-line-name-input').fill('Обновлённое название');

      await page.getByTestId('phone-line-submit-button').click();

      await expect(page.getByRole('heading', { name: 'Редактировать телефонную линию' })).not.toBeVisible();
      await expect(page.getByText('Обновлённое название')).toBeVisible();
    });

    test('should show delete confirmation dialog', async ({ page }) => {
      await page.goto('/settings/phone-lines');

      await page.getByTestId(`phone-line-delete-${phoneLineId}`).click();

      await expect(page.getByRole('heading', { name: 'Удалить телефонную линию?' })).toBeVisible();
      await expect(page.getByText('Рабочий телефон')).toBeVisible();
    });

    test('should delete phone line when confirming', async ({ page }) => {
      await page.goto('/settings/phone-lines');

      await expect(page.getByText('Рабочий телефон')).toBeVisible();

      await page.getByTestId(`phone-line-delete-${phoneLineId}`).click();
      await expect(page.getByRole('heading', { name: 'Удалить телефонную линию?' })).toBeVisible();

      await page.getByRole('button', { name: 'Удалить' }).last().click();

      await expect(page.getByRole('heading', { name: 'Удалить телефонную линию?' })).not.toBeVisible();
      await expect(page.getByText('Рабочий телефон')).not.toBeVisible();
    });
  });
});
