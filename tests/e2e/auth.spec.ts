import { test, expect } from '@playwright/test';
import { generateTestUser } from '../fixtures/test-data';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form by default', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: 'ClientBase' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Вход' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Регистрация' })).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Пароль')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Войти через Google' })).toBeVisible();
    });

    test('should switch to registration form', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('button', { name: 'Регистрация' }).click();

      await expect(page.getByLabel('Имя')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Зарегистрироваться' })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel('Email').fill('nonexistent@example.com');
      await page.getByLabel('Пароль').fill('wrongpassword');
      await page.getByRole('button', { name: 'Войти', exact: true }).click();

      await expect(page.getByText('Неверный email или пароль')).toBeVisible();
    });
  });

  test.describe('Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      const user = generateTestUser();

      await page.goto('/login');
      await page.getByRole('button', { name: 'Регистрация' }).click();

      await page.getByLabel('Имя').fill(user.name);
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Пароль').fill(user.password);
      await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

      // After successful registration, user should be redirected to home
      await expect(page).toHaveURL('/');
    });

    test('should register 5901867@gmail.com with password 123456', async ({ page }) => {
      const testUser = {
        email: '5901867@gmail.com',
        password: '123456',
        name: 'Admin User',
      };

      await page.goto('/login');
      await page.getByRole('button', { name: 'Регистрация' }).click();

      await page.getByLabel('Имя').fill(testUser.name);
      await page.getByLabel('Email').fill(testUser.email);
      await page.getByLabel('Пароль').fill(testUser.password);
      await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

      await expect(page).toHaveURL('/');

      // Verify user can login
      await page.context().clearCookies();
      await page.goto('/login');
      await page.getByLabel('Email').fill(testUser.email);
      await page.getByLabel('Пароль').fill(testUser.password);
      await page.getByRole('button', { name: 'Войти', exact: true }).click();

      await expect(page).toHaveURL('/');
      await expect(page.getByText(testUser.name)).toBeVisible();
    });

    test('should show error for duplicate email', async ({ page }) => {
      const user = generateTestUser();

      // Register first time
      await page.goto('/login');
      await page.getByRole('button', { name: 'Регистрация' }).click();
      await page.getByLabel('Имя').fill(user.name);
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Пароль').fill(user.password);
      await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
      await expect(page).toHaveURL('/');

      // Logout and try to register with same email
      await page.goto('/login');
      await page.getByRole('button', { name: 'Регистрация' }).click();
      await page.getByLabel('Имя').fill(user.name);
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Пароль').fill(user.password);
      await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

      await expect(page.getByText('Пользователь с таким email уже существует')).toBeVisible();
    });

    test('should validate password length', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: 'Регистрация' }).click();

      await page.getByLabel('Имя').fill('Test');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Пароль').fill('123'); // Too short

      await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

      // Zod validation should show error
      await expect(page.getByText('Минимум 6 символов')).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      const user = generateTestUser();

      // First register
      await page.goto('/login');
      await page.getByRole('button', { name: 'Регистрация' }).click();
      await page.getByLabel('Имя').fill(user.name);
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Пароль').fill(user.password);
      await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
      await expect(page).toHaveURL('/');

      // Clear cookies to logout
      await page.context().clearCookies();

      // Now login
      await page.goto('/login');
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Пароль').fill(user.password);
      await page.getByRole('button', { name: 'Войти', exact: true }).click();

      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/');

      await expect(page).toHaveURL(/\/login/);
    });

    test('should preserve callback URL after login', async ({ page }) => {
      const user = generateTestUser();

      // Register user first
      await page.goto('/login');
      await page.getByRole('button', { name: 'Регистрация' }).click();
      await page.getByLabel('Имя').fill(user.name);
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Пароль').fill(user.password);
      await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
      await expect(page).toHaveURL('/');

      // Clear cookies
      await page.context().clearCookies();

      // Try to access a protected route
      await page.goto('/dashboard');

      // Should be redirected to login with callback
      await expect(page).toHaveURL(/\/login\?callbackUrl=/);
    });
  });

  test.describe('Logout', () => {
    test('should logout and redirect to login page', async ({ page }) => {
      const user = generateTestUser();

      // Register and login
      await page.goto('/login');
      await page.getByRole('button', { name: 'Регистрация' }).click();
      await page.getByLabel('Имя').fill(user.name);
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Пароль').fill(user.password);
      await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
      await expect(page).toHaveURL('/');

      // Verify user name is displayed
      await expect(page.getByText(user.name)).toBeVisible();

      // Click logout button
      await page.getByRole('button', { name: 'Выйти' }).click();

      // Should be redirected to login
      await expect(page).toHaveURL('/login');

      // Try to access protected page - should redirect to login
      await page.goto('/');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
