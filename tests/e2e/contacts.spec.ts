import { test, expect } from '@playwright/test';
import { generateTestUser } from '../fixtures/test-data';

test.describe.configure({ mode: 'serial' });

test.describe('Contacts Page', () => {
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
    test('should navigate to contacts page from home', async ({ page }) => {
      await page.getByRole('link', { name: 'Контакты' }).click();
      await expect(page).toHaveURL('/contacts');
      await expect(page.getByRole('heading', { name: 'Контакты' })).toBeVisible();
    });

    test('should show "Create contact" button', async ({ page }) => {
      await page.goto('/contacts');
      await expect(page.getByRole('button', { name: 'Создать контакт' })).toBeVisible();
    });
  });

  test.describe('Empty state', () => {
    test('should show empty state when searching for non-existent contact', async ({ page }) => {
      await page.goto('/contacts');
      // Use search to find non-existent contact
      await page.getByPlaceholder('Поиск по имени, email, телефону...').fill('несуществующий_контакт_xyz');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Контакты не найдены')).toBeVisible();
    });
  });

  test.describe('Create contact', () => {
    test('should open slide-over panel when clicking create button', async ({ page }) => {
      await page.goto('/contacts');
      await page.getByRole('button', { name: 'Создать контакт' }).click();

      await expect(page.getByRole('heading', { name: 'Новый контакт' })).toBeVisible();
      await expect(page.getByLabel('Имя *')).toBeVisible();
    });

    test('should close slide-over panel on cancel', async ({ page }) => {
      await page.goto('/contacts');
      await page.getByRole('button', { name: 'Создать контакт' }).click();

      await expect(page.getByRole('heading', { name: 'Новый контакт' })).toBeVisible();

      await page.getByRole('button', { name: 'Отмена' }).click();

      await expect(page.getByRole('heading', { name: 'Новый контакт' })).not.toBeVisible();
    });

    test('should close slide-over panel on escape key', async ({ page }) => {
      await page.goto('/contacts');
      await page.getByRole('button', { name: 'Создать контакт' }).click();

      await expect(page.getByRole('heading', { name: 'Новый контакт' })).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.getByRole('heading', { name: 'Новый контакт' })).not.toBeVisible();
    });

    test('should create contact with basic info', async ({ page }) => {
      await page.goto('/contacts');
      await page.getByRole('button', { name: 'Создать контакт' }).click();

      await page.getByLabel('Имя *').fill('Иван Петров');
      await page.locator('form').getByRole('button', { name: 'Создать контакт' }).click();

      // Panel should close
      await expect(page.getByRole('heading', { name: 'Новый контакт' })).not.toBeVisible();

      // Contact should appear in table
      await expect(page.getByText('Иван Петров')).toBeVisible();
    });

    test('should create contact with email', async ({ page }) => {
      await page.goto('/contacts');
      await page.getByRole('button', { name: 'Создать контакт' }).first().click();

      await page.getByLabel('Имя *').fill('Анна Сидорова');
      await page.getByPlaceholder('email@example.com').fill('anna@example.com');
      await page.locator('form').getByRole('button', { name: 'Создать контакт' }).click();

      await expect(page.getByText('Анна Сидорова')).toBeVisible();
      await expect(page.getByText('anna@example.com')).toBeVisible();
    });

    test('should create contact with phone', async ({ page }) => {
      await page.goto('/contacts');
      await page.getByRole('button', { name: 'Создать контакт' }).first().click();

      await page.getByLabel('Имя *').fill('Петр Иванов');
      await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 111-22-33');
      await page.locator('form').getByRole('button', { name: 'Создать контакт' }).click();

      await expect(page.getByText('Петр Иванов')).toBeVisible();
      await expect(page.getByText('+7 999 111-22-33')).toBeVisible();
    });

    test('should add multiple emails', async ({ page }) => {
      await page.goto('/contacts');
      await page.getByRole('button', { name: 'Создать контакт' }).first().click();

      await page.getByLabel('Имя *').fill('Мария Козлова');

      // Fill first email
      await page.getByPlaceholder('email@example.com').first().fill('maria.work@example.com');

      // Add second email
      await page.getByRole('button', { name: '+ Добавить' }).first().click();
      await page.getByPlaceholder('email@example.com').nth(1).fill('maria.personal@example.com');

      await page.locator('form').getByRole('button', { name: 'Создать контакт' }).click();

      await expect(page.getByText('Мария Козлова')).toBeVisible();
      await expect(page.getByText('maria.work@example.com')).toBeVisible();
      await expect(page.getByText('maria.personal@example.com')).toBeVisible();
    });

    test('should add multiple phones', async ({ page }) => {
      await page.goto('/contacts');
      await page.getByRole('button', { name: 'Создать контакт' }).first().click();

      await page.getByLabel('Имя *').fill('Алексей Смирнов');

      // Fill first phone
      await page.getByPlaceholder('+7 999 123-45-67').first().fill('+7 999 111-11-11');

      // Add second phone
      await page.getByRole('button', { name: '+ Добавить' }).nth(1).click();
      await page.getByPlaceholder('+7 999 123-45-67').nth(1).fill('+7 999 222-22-22');

      await page.locator('form').getByRole('button', { name: 'Создать контакт' }).click();

      await expect(page.getByText('Алексей Смирнов')).toBeVisible();
      await expect(page.getByText('+7 999 111-11-11')).toBeVisible();
      await expect(page.getByText('+7 999 222-22-22')).toBeVisible();
    });

    test('should create contact with all fields', async ({ page }) => {
      await page.goto('/contacts');
      await page.getByRole('button', { name: 'Создать контакт' }).first().click();

      await page.getByLabel('Имя *').fill('Елена Васильева');
      await page.getByPlaceholder('email@example.com').fill('elena@company.com');
      await page.getByPlaceholder('+7 999 123-45-67').fill('+7 999 333-33-33');
      await page.getByLabel('Компания').fill('ООО Тест');
      await page.getByLabel('Должность').fill('Менеджер');
      await page.getByLabel('Заметки').fill('Важный клиент');

      await page.locator('form').getByRole('button', { name: 'Создать контакт' }).click();

      await expect(page.getByText('Елена Васильева')).toBeVisible();
      await expect(page.getByText('elena@company.com')).toBeVisible();
      await expect(page.getByText('ООО Тест')).toBeVisible();
    });

    test('should require name', async ({ page }) => {
      await page.goto('/contacts');
      await page.getByRole('button', { name: 'Создать контакт' }).click();

      // Check that name is required
      const nameInput = page.getByLabel('Имя *');
      await expect(nameInput).toHaveAttribute('required', '');
    });
  });

  test.describe('Contacts table', () => {
    test.beforeEach(async ({ page, request }) => {
      // Get auth cookies
      const state = await page.context().storageState();
      const authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // Create some test contacts via API
      await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Тест Контакт1',
          emails: [{ address: 'test1@example.com' }],
        },
      });

      await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Тест Контакт2',
          emails: [{ address: 'test2@example.com' }],
          company: 'Компания',
        },
      });
    });

    test('should display contacts in table', async ({ page }) => {
      await page.goto('/contacts');

      await expect(page.getByText('Тест Контакт1')).toBeVisible();
      await expect(page.getByText('Тест Контакт2')).toBeVisible();
      await expect(page.getByText('test1@example.com')).toBeVisible();
      await expect(page.getByText('test2@example.com')).toBeVisible();
    });

    test('should display company info', async ({ page }) => {
      await page.goto('/contacts');

      // Check column header and at least one cell with company data
      await expect(page.getByRole('columnheader', { name: 'Компания' })).toBeVisible();
      await expect(page.locator('td').getByText('Компания').first()).toBeVisible();
    });

    test('should show edit button for each contact', async ({ page }) => {
      await page.goto('/contacts');

      // Check that edit buttons are visible
      const editButtons = page.getByRole('button', { name: 'Редактировать' });
      await expect(editButtons.first()).toBeVisible();
    });

    test('should open edit form when clicking edit button', async ({ page }) => {
      await page.goto('/contacts');

      // Click on the first edit button
      await page.getByRole('button', { name: 'Редактировать' }).first().click();

      // Check that edit slide-over is open
      await expect(page.getByRole('heading', { name: 'Редактирование контакта' })).toBeVisible();
      await expect(page.getByLabel('Имя *')).toBeVisible();
    });

    test('should edit contact name', async ({ page }) => {
      await page.goto('/contacts');

      // Click on the first edit button
      await page.getByRole('button', { name: 'Редактировать' }).first().click();

      // Clear and fill new name
      await page.getByLabel('Имя *').clear();
      await page.getByLabel('Имя *').fill('Обновлённый Контакт');

      // Submit form
      await page.getByRole('button', { name: 'Сохранить' }).click();

      // Panel should close
      await expect(page.getByRole('heading', { name: 'Редактирование контакта' })).not.toBeVisible();

      // Updated contact should appear in table
      await expect(page.getByText('Обновлённый Контакт')).toBeVisible();
    });
  });

  test.describe('Delete contact', () => {
    test.beforeEach(async ({ page, request }) => {
      // Get auth cookies
      const state = await page.context().storageState();
      const authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // Create a test contact via API
      await request.post('/api/contacts', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Контакт для удаления',
          emails: [{ address: 'delete@example.com' }],
          company: 'Удаляемая компания',
        },
      });
    });

    test('should show delete button for each contact', async ({ page }) => {
      await page.goto('/contacts');

      // Check that delete buttons are visible
      const deleteButtons = page.getByRole('button', { name: 'Удалить' });
      await expect(deleteButtons.first()).toBeVisible();
    });

    test('should open confirmation dialog when clicking delete button', async ({ page }) => {
      await page.goto('/contacts');

      // Click on delete button
      await page.getByRole('button', { name: 'Удалить' }).first().click();

      // Check that confirmation dialog is open
      await expect(page.getByRole('heading', { name: 'Удаление контакта' })).toBeVisible();
      await expect(page.getByText('Вы уверены, что хотите удалить контакт')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Подтверждаю' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Отменяю' })).toBeVisible();
    });

    test('should close confirmation dialog on cancel', async ({ page }) => {
      await page.goto('/contacts');

      // Click on delete button
      await page.getByRole('button', { name: 'Удалить' }).first().click();

      // Check that confirmation dialog is open
      await expect(page.getByRole('heading', { name: 'Удаление контакта' })).toBeVisible();

      // Click cancel
      await page.getByRole('button', { name: 'Отменяю' }).click();

      // Dialog should close
      await expect(page.getByRole('heading', { name: 'Удаление контакта' })).not.toBeVisible();

      // Contact should still be visible
      await expect(page.getByText('Контакт для удаления').first()).toBeVisible();
    });

    test('should close confirmation dialog on escape key', async ({ page }) => {
      await page.goto('/contacts');

      // Click on delete button
      await page.getByRole('button', { name: 'Удалить' }).first().click();

      // Check that confirmation dialog is open
      await expect(page.getByRole('heading', { name: 'Удаление контакта' })).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Dialog should close
      await expect(page.getByRole('heading', { name: 'Удаление контакта' })).not.toBeVisible();

      // Contact should still be visible
      await expect(page.getByText('Контакт для удаления').first()).toBeVisible();
    });

    test('should delete contact when confirming', async ({ page }) => {
      await page.goto('/contacts');

      // Make sure contact is visible
      await expect(page.getByText('Контакт для удаления').first()).toBeVisible();

      // Count contacts before deletion
      const countBefore = await page.getByText('Контакт для удаления').count();

      // Click on delete button
      await page.getByRole('button', { name: 'Удалить' }).first().click();

      // Confirm deletion
      await page.getByRole('button', { name: 'Подтверждаю' }).click();

      // Dialog should close
      await expect(page.getByRole('heading', { name: 'Удаление контакта' })).not.toBeVisible();

      // One less contact should be visible
      await expect(page.getByText('Контакт для удаления')).toHaveCount(countBefore - 1);
    });

    test('should show contact name in confirmation message', async ({ page }) => {
      await page.goto('/contacts');

      // Click on delete button for specific contact
      await page.getByRole('button', { name: 'Удалить' }).first().click();

      // Check that the dialog message contains the contact name
      await expect(page.getByText('Вы уверены, что хотите удалить контакт')).toBeVisible();
      await expect(page.locator('p').filter({ hasText: 'Контакт для удаления' })).toBeVisible();
    });
  });
});
