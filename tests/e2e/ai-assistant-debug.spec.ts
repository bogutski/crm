import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TEST_USER = {
  email: '5901867@gmail.com',
  password: '123456',
  name: 'Admin User',
};

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
  return mongoose.connection.db!;
}

// Настроить AI провайдер с фейковым ключом для тестирования UI
async function setupAIProviderWithFakeKey() {
  const db = await connectDB();

  // Используем фейковый ключ для тестирования UI
  // (реальный запрос к AI не будет работать, но UI покажет поле ввода)
  const fakeKey = 'sk-test-fake-key-for-testing-ui';

  await db.collection('system_settings').updateOne(
    {},
    {
      $set: {
        ai: {
          activeProvider: 'openai',
          providers: {
            openai: {
              enabled: true,
              model: 'gpt-4o-mini',
              apiKey: fakeKey,
            },
          },
        },
      },
    },
    { upsert: true }
  );

  console.log('AI settings with fake key saved');
}

async function ensureUserAndLogin(page: any) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Пароль').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();

  try {
    await expect(page).toHaveURL('/', { timeout: 5000 });
    return;
  } catch {
    // Пробуем регистрацию
  }

  if (page.url().includes('/login')) {
    await page.getByRole('button', { name: 'Регистрация' }).click();
    await page.waitForTimeout(300);
    await page.getByLabel('Имя').fill(TEST_USER.name);
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Пароль').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    try {
      await expect(page).toHaveURL('/', { timeout: 5000 });
      return;
    } catch {
      const errorText = await page.getByText('уже существует').isVisible().catch(() => false);
      if (errorText) {
        await page.getByRole('button', { name: 'Вход' }).click();
        await page.waitForTimeout(300);
        await page.getByLabel('Email').fill(TEST_USER.email);
        await page.getByLabel('Пароль').fill(TEST_USER.password);
        await page.getByRole('button', { name: 'Войти', exact: true }).click();
      }
    }
  }

  await expect(page).toHaveURL('/', { timeout: 10000 });
}

test.describe('AI Assistant Debug', () => {
  test.beforeAll(async () => {
    await setupAIProviderWithFakeKey();
  });

  test.afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('should debug message sending flow', async ({ page }) => {
    // Собираем все console.log
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await ensureUserAndLogin(page);
    await page.goto('/ai-assistant');

    // Ждём загрузки
    await page.waitForTimeout(3000);

    console.log('\n=== Browser logs ===');
    logs.forEach(log => console.log(log));
    console.log('===================\n');

    // Проверяем состояние UI
    const settingsWarning = page.getByText('AI провайдер не настроен');
    const isWarningVisible = await settingsWarning.isVisible().catch(() => false);
    console.log('AI provider warning visible:', isWarningVisible);

    const inputField = page.getByPlaceholder('Напишите сообщение...');
    const isInputVisible = await inputField.isVisible().catch(() => false);
    console.log('Input field visible:', isInputVisible);

    const connectingField = page.getByPlaceholder('Подключение...');
    const isConnecting = await connectingField.isVisible().catch(() => false);
    console.log('Connecting placeholder visible:', isConnecting);

    // Проверяем disabled состояние
    if (isInputVisible) {
      const isDisabled = await inputField.isDisabled();
      console.log('Input disabled:', isDisabled);
    }

    // Скриним текущее состояние
    await page.screenshot({ path: 'test-results/ai-debug-state.png' });

    // Пробуем отправить сообщение
    if (isInputVisible) {
      // Ждём полной аутентификации Socket.IO
      await page.waitForTimeout(1000);

      await inputField.fill('Тест');
      await page.waitForTimeout(500);

      // Делаем скриншот перед отправкой
      await page.screenshot({ path: 'test-results/ai-before-send.png' });

      const submitBtn = page.getByRole('button').filter({ has: page.locator('svg') }).last();
      const isBtnDisabled = await submitBtn.isDisabled();
      console.log('Submit button disabled:', isBtnDisabled);

      // Проверяем тип кнопки
      const btnType = await submitBtn.getAttribute('type');
      console.log('Submit button type:', btnType);

      if (!isBtnDisabled) {
        console.log('Clicking submit button...');
        // Пробуем отправить через Enter
        await inputField.press('Enter');

        // Даём время на отправку через Socket.IO
        await page.waitForTimeout(3000);

        // Проверяем появилось ли сообщение пользователя
        const userMessages = page.locator('.bg-blue-600').filter({ hasText: 'Тест' });
        const userMsgCount = await userMessages.count();
        console.log('User messages with "Тест" count:', userMsgCount);

        // Проверяем любое сообщение с текстом "Тест"
        const testMessage = page.getByText('Тест').first();
        const isMsgVisible = await testMessage.isVisible().catch(() => false);
        console.log('Message appeared:', isMsgVisible);

        // Проверяем наличие индикатора загрузки (анимация)
        const loadingIndicator = page.locator('.animate-bounce');
        const isLoading = await loadingIndicator.isVisible().catch(() => false);
        console.log('Loading indicator visible:', isLoading);
      }
    }

    console.log('\n=== Final browser logs ===');
    logs.slice(-20).forEach(log => console.log(log));
    console.log('==========================\n');
  });
});
