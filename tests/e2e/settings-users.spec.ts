import { test, expect } from '@playwright/test';
import { generateTestUser } from '../fixtures/test-data';

test.describe.configure({ mode: 'serial' });

test.describe('Settings Users Page', () => {
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
    test('should navigate to users page from settings', async ({ page }) => {
      await page.goto('/settings');
      await page.getByRole('link', { name: 'Пользователи' }).click();
      await expect(page).toHaveURL('/settings/users');
      await expect(page.getByRole('heading', { name: 'Пользователи' })).toBeVisible();
    });

    test('should show users section in settings navigation', async ({ page }) => {
      await page.goto('/settings/users');
      await expect(page.getByRole('link', { name: 'Пользователи' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Словари' })).toBeVisible();
    });

    test('should show page description', async ({ page }) => {
      await page.goto('/settings/users');
      await expect(page.getByText('Управление пользователями системы')).toBeVisible();
    });
  });

  test.describe('Users list', () => {
    test('should display users table with current user', async ({ page }) => {
      await page.goto('/settings/users');

      // Table headers
      await expect(page.getByRole('columnheader', { name: 'Пользователь' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Роли' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Статус' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Последний вход' })).toBeVisible();

      // Current user should be in the table (use unique email to find the row)
      const table = page.getByRole('table');
      await expect(table.getByText(user.email)).toBeVisible();
      // Find row by email and verify name is present
      const userRow = table.locator('tr').filter({ hasText: user.email });
      await expect(userRow.getByText(user.name)).toBeVisible();
    });

    test('should show "Add user" button', async ({ page }) => {
      await page.goto('/settings/users');
      await expect(page.getByRole('button', { name: 'Добавить пользователя' })).toBeVisible();
    });

    test('should display user roles with badges', async ({ page }) => {
      await page.goto('/settings/users');
      // Current registered user should have 'user' role
      await expect(page.getByText('Пользователь').first()).toBeVisible();
    });

    test('should display active status', async ({ page }) => {
      await page.goto('/settings/users');
      await expect(page.getByText('Активен').first()).toBeVisible();
    });
  });

  test.describe('Create user', () => {
    test('should open slide-over panel when clicking add button', async ({ page }) => {
      await page.goto('/settings/users');
      await page.getByRole('button', { name: 'Добавить пользователя' }).click();

      await expect(page.getByRole('heading', { name: 'Добавить пользователя' })).toBeVisible();
      await expect(page.getByLabel('Имя')).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Пароль')).toBeVisible();
    });

    test('should close slide-over panel on cancel', async ({ page }) => {
      await page.goto('/settings/users');
      await page.getByRole('button', { name: 'Добавить пользователя' }).click();

      await expect(page.getByRole('heading', { name: 'Добавить пользователя' })).toBeVisible();

      await page.getByRole('button', { name: 'Отмена' }).click();

      await expect(page.getByRole('heading', { name: 'Добавить пользователя' })).not.toBeVisible();
    });

    test('should close slide-over panel on escape key', async ({ page }) => {
      await page.goto('/settings/users');
      await page.getByRole('button', { name: 'Добавить пользователя' }).click();

      await expect(page.getByRole('heading', { name: 'Добавить пользователя' })).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.getByRole('heading', { name: 'Добавить пользователя' })).not.toBeVisible();
    });

    test('should show role checkboxes', async ({ page }) => {
      await page.goto('/settings/users');
      await page.getByRole('button', { name: 'Добавить пользователя' }).click();

      // Check within the form/slide-over panel
      const form = page.locator('form');
      await expect(form.getByText('Роли')).toBeVisible();
      await expect(form.getByText('Администратор')).toBeVisible();
      await expect(form.getByText('Менеджер')).toBeVisible();
      // 'Пользователь' should also be visible as a role option (exact match to avoid "Активный пользователь")
      await expect(form.locator('label').filter({ hasText: /^Пользователь$/ })).toBeVisible();
    });

    test('should show active checkbox', async ({ page }) => {
      await page.goto('/settings/users');
      await page.getByRole('button', { name: 'Добавить пользователя' }).click();

      await expect(page.getByText('Активный пользователь')).toBeVisible();
      await expect(page.getByText('Неактивные пользователи не могут войти в систему')).toBeVisible();
    });

    test('should create new user with basic info', async ({ page }) => {
      await page.goto('/settings/users');
      await page.getByRole('button', { name: 'Добавить пользователя' }).click();

      const newUserEmail = `new-user-${Date.now()}@example.com`;
      await page.getByLabel('Имя').fill('Новый Пользователь');
      await page.getByLabel('Email').fill(newUserEmail);
      await page.getByLabel('Пароль').fill('Password123');

      await page.getByRole('button', { name: 'Создать' }).click();

      // Panel should close
      await expect(page.getByRole('heading', { name: 'Добавить пользователя' })).not.toBeVisible();

      // New user should appear in table
      await expect(page.getByText('Новый Пользователь')).toBeVisible();
      await expect(page.getByText(newUserEmail)).toBeVisible();
    });

    test('should create user with manager role', async ({ page }) => {
      await page.goto('/settings/users');
      await page.getByRole('button', { name: 'Добавить пользователя' }).click();

      const newUserEmail = `manager-${Date.now()}@example.com`;
      await page.getByLabel('Имя').fill('Менеджер Тест');
      await page.getByLabel('Email').fill(newUserEmail);
      await page.getByLabel('Пароль').fill('Password123');

      // Select manager role
      await page.locator('label').filter({ hasText: 'Менеджер' }).click();

      await page.getByRole('button', { name: 'Создать' }).click();

      // New user should appear with manager badge
      await expect(page.getByText('Менеджер Тест')).toBeVisible();
    });

    test('should show error for duplicate email', async ({ page }) => {
      await page.goto('/settings/users');
      await page.getByRole('button', { name: 'Добавить пользователя' }).click();

      // Try to create user with existing email
      await page.getByLabel('Имя').fill('Дубликат');
      await page.getByLabel('Email').fill(user.email); // Use current user's email
      await page.getByLabel('Пароль').fill('Password123');

      await page.getByRole('button', { name: 'Создать' }).click();

      // Error message should appear
      await expect(page.getByText('already exists')).toBeVisible();
    });

    test('should show validation error for empty name', async ({ page }) => {
      await page.goto('/settings/users');
      await page.getByRole('button', { name: 'Добавить пользователя' }).click();

      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Пароль').fill('Password123');

      await page.getByRole('button', { name: 'Создать' }).click();

      await expect(page.getByText('Введите имя пользователя')).toBeVisible();
    });

    test('should show validation error for empty password on create', async ({ page }) => {
      await page.goto('/settings/users');
      await page.getByRole('button', { name: 'Добавить пользователя' }).click();

      await page.getByLabel('Имя').fill('Тест');
      await page.getByLabel('Email').fill('test@example.com');

      await page.getByRole('button', { name: 'Создать' }).click();

      await expect(page.getByText('Пароль должен быть не менее 6 символов')).toBeVisible();
    });
  });

  test.describe('Edit user', () => {
    let testUserId: string;
    let testUserEmail: string;

    test.beforeEach(async ({ page, request }) => {
      // Get auth cookies
      const state = await page.context().storageState();
      const authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // Create a test user via API with unique email
      testUserEmail = `edit-user-${Date.now()}@example.com`;
      const response = await request.post('/api/users', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Редактируемый Пользователь',
          email: testUserEmail,
          password: 'Password123',
          roles: ['user'],
        },
      });
      const created = await response.json();
      testUserId = created.id;
    });

    test('should show edit button for each user', async ({ page }) => {
      await page.goto('/settings/users');
      const editButtons = page.getByRole('button', { name: 'Редактировать' });
      await expect(editButtons.first()).toBeVisible();
    });

    test('should open edit form when clicking edit button', async ({ page }) => {
      await page.goto('/settings/users');

      // Find the row with the test user by unique email and click edit
      const row = page.locator('tr').filter({ hasText: testUserEmail });
      await row.getByRole('button', { name: 'Редактировать' }).click();

      await expect(page.getByRole('heading', { name: 'Редактировать пользователя' })).toBeVisible();
      await expect(page.getByLabel('Имя')).toHaveValue('Редактируемый Пользователь');
    });

    test('should show password hint for editing', async ({ page }) => {
      await page.goto('/settings/users');

      const row = page.locator('tr').filter({ hasText: testUserEmail });
      await row.getByRole('button', { name: 'Редактировать' }).click();

      await expect(page.getByText('оставьте пустым, чтобы не менять')).toBeVisible();
    });

    test('should update user name', async ({ page }) => {
      await page.goto('/settings/users');

      const row = page.locator('tr').filter({ hasText: testUserEmail });
      await row.getByRole('button', { name: 'Редактировать' }).click();

      await page.getByLabel('Имя').clear();
      await page.getByLabel('Имя').fill('Обновлённое Имя');

      await page.getByRole('button', { name: 'Сохранить' }).click();

      // Panel should close
      await expect(page.getByRole('heading', { name: 'Редактировать пользователя' })).not.toBeVisible();

      // Updated name should appear
      await expect(page.getByText('Обновлённое Имя')).toBeVisible();
    });

    test('should update user roles', async ({ page }) => {
      await page.goto('/settings/users');

      const row = page.locator('tr').filter({ hasText: testUserEmail });
      await row.getByRole('button', { name: 'Редактировать' }).click();

      // Add admin role
      await page.locator('label').filter({ hasText: 'Администратор' }).click();

      await page.getByRole('button', { name: 'Сохранить' }).click();

      // Check that admin badge appears
      await page.goto('/settings/users'); // Refresh to see updated roles
      const updatedRow = page.locator('tr').filter({ hasText: testUserEmail });
      await expect(updatedRow.getByText('Администратор')).toBeVisible();
    });

    test('should deactivate user', async ({ page }) => {
      await page.goto('/settings/users');

      const row = page.locator('tr').filter({ hasText: testUserEmail });
      await row.getByRole('button', { name: 'Редактировать' }).click();

      // Uncheck active checkbox
      await page.getByText('Активный пользователь').click();

      await page.getByRole('button', { name: 'Сохранить' }).click();

      // Status should change to inactive
      await page.goto('/settings/users'); // Refresh
      const updatedRow = page.locator('tr').filter({ hasText: testUserEmail });
      await expect(updatedRow.getByText('Неактивен')).toBeVisible();
    });
  });

  test.describe('Delete user', () => {
    let deleteUserEmail: string;

    test.beforeEach(async ({ page, request }) => {
      // Get auth cookies
      const state = await page.context().storageState();
      const authCookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // Create a test user via API with unique email
      deleteUserEmail = `delete-user-${Date.now()}@example.com`;
      await request.post('/api/users', {
        headers: { Cookie: authCookies },
        data: {
          name: 'Удаляемый Пользователь',
          email: deleteUserEmail,
          password: 'Password123',
          roles: ['user'],
        },
      });
    });

    test('should show delete button for each user', async ({ page }) => {
      await page.goto('/settings/users');
      const deleteButtons = page.getByRole('button', { name: 'Удалить' });
      await expect(deleteButtons.first()).toBeVisible();
    });

    test('should open confirmation dialog when clicking delete button', async ({ page }) => {
      await page.goto('/settings/users');

      const row = page.locator('tr').filter({ hasText: deleteUserEmail });
      await row.getByRole('button', { name: 'Удалить' }).click();

      await expect(page.getByRole('heading', { name: 'Удалить пользователя?' })).toBeVisible();
      // Check the confirmation message contains the user name
      await expect(page.getByText('Вы уверены, что хотите удалить пользователя')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Удалить' }).last()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Отмена' })).toBeVisible();
    });

    test('should close confirmation dialog on cancel', async ({ page }) => {
      await page.goto('/settings/users');

      const row = page.locator('tr').filter({ hasText: deleteUserEmail });
      await row.getByRole('button', { name: 'Удалить' }).click();

      await expect(page.getByRole('heading', { name: 'Удалить пользователя?' })).toBeVisible();

      await page.getByRole('button', { name: 'Отмена' }).click();

      await expect(page.getByRole('heading', { name: 'Удалить пользователя?' })).not.toBeVisible();

      // User should still be visible
      await expect(page.getByText(deleteUserEmail)).toBeVisible();
    });

    test('should delete user when confirming', async ({ page }) => {
      await page.goto('/settings/users');

      // Make sure user is visible by unique email
      await expect(page.getByText(deleteUserEmail)).toBeVisible();

      const row = page.locator('tr').filter({ hasText: deleteUserEmail });
      await row.getByRole('button', { name: 'Удалить' }).click();

      // Wait for dialog to appear
      await expect(page.getByRole('heading', { name: 'Удалить пользователя?' })).toBeVisible();

      // Confirm deletion - click the last delete button (the one in dialog)
      await page.getByRole('button', { name: 'Удалить' }).last().click();

      // Dialog should close
      await expect(page.getByRole('heading', { name: 'Удалить пользователя?' })).not.toBeVisible();

      // User should be removed
      await expect(page.getByText(deleteUserEmail)).not.toBeVisible();
    });
  });
});
