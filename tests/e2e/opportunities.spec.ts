import { test, expect } from '@playwright/test';
import { generateTestUser } from '../fixtures/test-data';

test.describe.configure({ mode: 'serial' });

test.describe('Opportunities Page', () => {
  let user: ReturnType<typeof generateTestUser>;
  let authCookies: string;

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

    // Save auth cookies for API calls
    const state = await page.context().storageState();
    authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');
  });

  test.describe('Navigation', () => {
    test('should navigate to opportunities page from home', async ({ page }) => {
      await page.getByRole('link', { name: 'Сделки' }).click();
      await expect(page).toHaveURL('/opportunities');
      await expect(page.getByRole('heading', { name: 'Сделки' })).toBeVisible();
    });

    test('should show "Create opportunity" button', async ({ page }) => {
      await page.goto('/opportunities');
      await expect(page.getByRole('button', { name: 'Создать сделку' })).toBeVisible();
    });
  });

  test.describe('Opportunity View Page', () => {
    let opportunityId: string;

    test.beforeEach(async ({ request }) => {
      // Create a test opportunity via API
      const response = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Тестовая сделка',
          amount: 50000,
          description: 'Описание тестовой сделки',
        },
      });
      const opportunity = await response.json();
      opportunityId = opportunity.id;
    });

    test('should display opportunity view page', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await expect(page.getByRole('heading', { name: 'Тестовая сделка' })).toBeVisible();
      await expect(page.getByText(/50[\s\u00a0]000/)).toBeVisible();
    });

    test('should show opportunity details', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await expect(page.getByText('Описание тестовой сделки')).toBeVisible();
    });

    test('should show edit and delete buttons', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await expect(page.getByRole('button', { name: 'Редактировать' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Удалить' })).toBeVisible();
    });

    test('should show timeline panel', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await expect(page.getByText('История и переписка')).toBeVisible();
    });

    test('should navigate to opportunity view from list', async ({ page }) => {
      await page.goto('/opportunities');

      // Click on opportunity name in table (use first matching link)
      await page.getByRole('link', { name: 'Тестовая сделка' }).first().click();

      // Should navigate to some opportunity view page
      await expect(page).toHaveURL(/\/opportunities\/[a-f0-9]+$/);
      await expect(page.getByRole('heading', { name: 'Тестовая сделка' })).toBeVisible();
    });

    test('should show 404 for non-existent opportunity', async ({ page }) => {
      await page.goto('/opportunities/507f1f77bcf86cd799439011');

      await expect(page.getByText('Сделка не найдена')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Вернуться к списку сделок' })).toBeVisible();
    });
  });

  test.describe('Edit Opportunity', () => {
    let opportunityId: string;

    test.beforeEach(async ({ request }) => {
      const response = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Сделка для редактирования',
          amount: 30000,
        },
      });
      const opportunity = await response.json();
      opportunityId = opportunity.id;
    });

    test('should open edit slide-over when clicking edit button', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await page.getByRole('button', { name: 'Редактировать' }).click();

      await expect(page.getByRole('heading', { name: 'Редактирование сделки' })).toBeVisible();
    });

    test('should update opportunity name', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await page.getByRole('button', { name: 'Редактировать' }).click();

      await page.getByLabel('Название').clear();
      await page.getByLabel('Название').fill('Обновлённая сделка');
      await page.getByRole('button', { name: 'Сохранить' }).click();

      // Panel should close
      await expect(page.getByRole('heading', { name: 'Редактирование сделки' })).not.toBeVisible();

      // Updated name should be visible
      await expect(page.getByRole('heading', { name: 'Обновлённая сделка' })).toBeVisible();
    });

    test('should update opportunity amount', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await page.getByRole('button', { name: 'Редактировать' }).click();

      await page.getByLabel('Сумма').clear();
      await page.getByLabel('Сумма').fill('75000');
      await page.getByRole('button', { name: 'Сохранить' }).click();

      await expect(page.getByRole('heading', { name: 'Редактирование сделки' })).not.toBeVisible();
      await expect(page.getByText(/75[\s\u00a0]000/)).toBeVisible();
    });

    test('should close edit slide-over on cancel', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await page.getByRole('button', { name: 'Редактировать' }).click();
      await expect(page.getByRole('heading', { name: 'Редактирование сделки' })).toBeVisible();

      await page.getByRole('button', { name: 'Отмена' }).click();

      await expect(page.getByRole('heading', { name: 'Редактирование сделки' })).not.toBeVisible();
    });

    test('should close edit slide-over on escape', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await page.getByRole('button', { name: 'Редактировать' }).click();
      await expect(page.getByRole('heading', { name: 'Редактирование сделки' })).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.getByRole('heading', { name: 'Редактирование сделки' })).not.toBeVisible();
    });
  });

  test.describe('Delete Opportunity', () => {
    let opportunityId: string;

    test.beforeEach(async ({ request }) => {
      const response = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Сделка для удаления',
          amount: 10000,
        },
      });
      const opportunity = await response.json();
      opportunityId = opportunity.id;
    });

    test('should open delete confirmation dialog', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await page.getByRole('button', { name: 'Удалить' }).click();

      await expect(page.getByRole('heading', { name: 'Удаление сделки' })).toBeVisible();
      await expect(page.getByText('Вы уверены, что хотите удалить сделку')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Подтверждаю' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Отменяю' })).toBeVisible();
    });

    test('should close delete dialog on cancel', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await page.getByRole('button', { name: 'Удалить' }).click();
      await expect(page.getByRole('heading', { name: 'Удаление сделки' })).toBeVisible();

      await page.getByRole('button', { name: 'Отменяю' }).click();

      await expect(page.getByRole('heading', { name: 'Удаление сделки' })).not.toBeVisible();
    });

    test('should close delete dialog on escape', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await page.getByRole('button', { name: 'Удалить' }).click();
      await expect(page.getByRole('heading', { name: 'Удаление сделки' })).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.getByRole('heading', { name: 'Удаление сделки' })).not.toBeVisible();
    });

    test('should delete opportunity and redirect to list', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await page.getByRole('button', { name: 'Удалить' }).click();
      await page.getByRole('button', { name: 'Подтверждаю' }).click();

      // Should redirect to opportunities list
      await expect(page).toHaveURL('/opportunities');

      // Verify redirect happened (deleted opportunity ID no longer accessible)
      const response = await page.request.get(`/api/opportunities/${opportunityId}`);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Opportunity with Contact', () => {
    let opportunityId: string;
    let contactId: string;

    test.beforeEach(async ({ request }) => {
      // Create a contact
      const contactResponse = await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Связанный контакт',
          emails: [{ address: 'contact@example.com' }],
        },
      });
      const contact = await contactResponse.json();
      contactId = contact.id;

      // Create opportunity with contact
      const oppResponse = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Сделка с контактом',
          amount: 25000,
          contactId: contactId,
        },
      });
      const opportunity = await oppResponse.json();
      opportunityId = opportunity.id;
    });

    test('should display linked contact', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await expect(page.getByText('Контакт')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Связанный контакт' })).toBeVisible();
    });

    test('should navigate to contact page when clicking contact link', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await page.getByRole('link', { name: 'Связанный контакт' }).click();

      await expect(page).toHaveURL(`/contacts/${contactId}`);
    });
  });

  test.describe('Opportunity with UTM', () => {
    let opportunityId: string;

    test.beforeEach(async ({ request }) => {
      const response = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Сделка с UTM',
          amount: 15000,
          utm: {
            source: 'google',
            medium: 'cpc',
            campaign: 'summer_sale',
          },
        },
      });
      const opportunity = await response.json();
      opportunityId = opportunity.id;
    });

    test('should display UTM data', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await expect(page.getByText('UTM метки')).toBeVisible();
      await expect(page.getByText('google')).toBeVisible();
      await expect(page.getByText('cpc')).toBeVisible();
      await expect(page.getByText('summer_sale')).toBeVisible();
    });
  });

  test.describe('Archived Opportunity', () => {
    let opportunityId: string;

    test.beforeEach(async ({ request }) => {
      const response = await request.post('/api/opportunities', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Архивная сделка',
          amount: 5000,
          archived: true,
        },
      });
      const opportunity = await response.json();
      opportunityId = opportunity.id;
    });

    test('should show archived badge', async ({ page }) => {
      await page.goto(`/opportunities/${opportunityId}`);

      await expect(page.getByText('Архив', { exact: true })).toBeVisible();
    });
  });
});
