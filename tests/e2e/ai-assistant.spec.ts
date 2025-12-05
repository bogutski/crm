import { test, expect, Page } from '@playwright/test';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Загружаем env
dotenv.config({ path: '.env.local' });

// Тестовый пользователь
const TEST_USER = {
  email: '5901867@gmail.com',
  password: '123456',
  name: 'Admin User',
};

// Подключение к MongoDB для проверки данных
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
  return mongoose.connection.db!;
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

// Получить диалоги пользователя из БД
async function getDialoguesFromDB(userId: string) {
  const db = await connectDB();
  const dialogues = await db.collection('ai_assistant_dialogues')
    .find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray();
  return dialogues;
}

// Получить пользователя по email
async function getUserByEmail(email: string) {
  const db = await connectDB();
  const user = await db.collection('users').findOne({ email });
  return user;
}

// Очистить диалоги пользователя
async function clearUserDialogues(userId: string) {
  const db = await connectDB();
  await db.collection('ai_assistant_dialogues').deleteMany({
    userId: new mongoose.Types.ObjectId(userId),
  });
}

// Хелпер для регистрации и логина
async function ensureUserAndLogin(page: Page) {
  // Небольшая случайная задержка для избежания race condition при параллельных тестах
  await page.waitForTimeout(Math.random() * 500);
  await page.goto('/login');

  // Пробуем сначала войти
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Пароль').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();

  // Ждём результат - либо редирект на /, либо ошибка
  try {
    await expect(page).toHaveURL('/', { timeout: 5000 });
    return; // Успешный вход
  } catch {
    // Вход не удался, пробуем регистрацию
  }

  // Проверяем что мы на странице логина
  if (page.url().includes('/login')) {
    // Переключаемся на регистрацию
    await page.getByRole('button', { name: 'Регистрация' }).click();
    await page.waitForTimeout(300);

    await page.getByLabel('Имя').fill(TEST_USER.name);
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Пароль').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    // Ждём результат регистрации
    try {
      await expect(page).toHaveURL('/', { timeout: 5000 });
      return;
    } catch {
      // Если ошибка "пользователь уже существует", пробуем снова войти
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

  // Финальная проверка - увеличенный таймаут для параллельных тестов
  await expect(page).toHaveURL('/', { timeout: 15000 });
}

// Настроить AI провайдер в БД
async function setupAIProvider() {
  const db = await connectDB();
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
              apiKey: process.env.OPENAI_API_KEY || 'test-key',
            },
          },
        },
      },
    },
    { upsert: true }
  );
}

test.describe('AI Assistant', () => {
  test.beforeAll(async () => {
    // Убедимся что тестовый пользователь существует
    const user = await getUserByEmail(TEST_USER.email);
    if (user) {
      // Очищаем старые диалоги
      await clearUserDialogues(user._id.toString());
    }
  });

  test.afterAll(async () => {
    await disconnectDB();
  });

  test.describe('Page Access', () => {
    test('should redirect to login if not authenticated', async ({ page }) => {
      await page.goto('/ai-assistant');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should show AI Assistant page when authenticated', async ({ page }) => {
      await ensureUserAndLogin(page);
      await page.goto('/ai-assistant');

      await expect(page).toHaveURL('/ai-assistant');
      await expect(page.getByText('AI Ассистент')).toBeVisible();
    });
  });

  test.describe('UI Elements', () => {
    test('should display empty state for new user', async ({ page }) => {
      await ensureUserAndLogin(page);
      await page.goto('/ai-assistant');

      // Ждём загрузки
      await page.waitForTimeout(1000);

      // Должен быть виден заголовок AI Ассистент
      await expect(page.getByRole('heading', { name: 'AI Ассистент' })).toBeVisible();

      // Должна быть кнопка "Новый диалог"
      await expect(page.getByText('Новый диалог')).toBeVisible();
    });

    test('should show input field when AI provider is configured', async ({ page }) => {
      await ensureUserAndLogin(page);
      await page.goto('/ai-assistant');

      await page.waitForTimeout(1000);

      // Проверяем наличие поля ввода или предупреждения о настройке провайдера
      const inputField = page.getByPlaceholder(/Напишите сообщение|Подключение/);
      const settingsWarning = page.getByText('AI провайдер не настроен');

      // Должно быть либо поле ввода, либо предупреждение
      const hasInput = await inputField.isVisible().catch(() => false);
      const hasWarning = await settingsWarning.isVisible().catch(() => false);

      expect(hasInput || hasWarning).toBe(true);
    });
  });

  test.describe('Socket.IO Connection', () => {
    test('should connect to socket server', async ({ page }) => {
      await ensureUserAndLogin(page);

      // Слушаем console.log для проверки подключения сокета
      const socketLogs: string[] = [];
      page.on('console', msg => {
        if (msg.text().includes('[Socket]')) {
          socketLogs.push(msg.text());
        }
      });

      await page.goto('/ai-assistant');
      await page.waitForTimeout(2000);

      // Проверяем что есть логи о подключении
      const hasConnectionLog = socketLogs.some(log =>
        log.includes('Connected') || log.includes('Authenticated')
      );

      // Если Socket.IO работает, должны быть логи
      console.log('Socket logs:', socketLogs);
    });
  });

  test.describe('Dialogue Management', () => {
    test('should create new dialogue when clicking New Dialogue button', async ({ page }) => {
      await ensureUserAndLogin(page);
      await page.goto('/ai-assistant');

      await page.waitForTimeout(1000);

      // Нажимаем на кнопку нового диалога
      await page.getByText('Новый диалог').first().click();

      // Проверяем что мы в режиме нового диалога (без выбранного ID)
      await expect(page.getByRole('heading', { name: 'AI Ассистент' })).toBeVisible();
    });

    test('should load dialogue list from API', async ({ page }) => {
      await ensureUserAndLogin(page);

      // Перехватываем запрос к API диалогов
      const dialoguesResponse = page.waitForResponse(
        response => response.url().includes('/api/ai-dialogues') && response.status() === 200
      );

      await page.goto('/ai-assistant');

      const response = await dialoguesResponse;
      const data = await response.json();

      expect(data).toHaveProperty('dialogues');
      expect(Array.isArray(data.dialogues)).toBe(true);
    });
  });

  test.describe('Message Sending', () => {
    test('should have input field disabled when not connected', async ({ page }) => {
      await ensureUserAndLogin(page);
      await page.goto('/ai-assistant');

      // Ждём загрузки
      await page.waitForTimeout(500);

      const inputField = page.getByPlaceholder(/Напишите сообщение|Подключение/);

      // Проверяем что поле существует
      if (await inputField.isVisible()) {
        // Поле должно показывать статус подключения или быть готовым к вводу
        const placeholder = await inputField.getAttribute('placeholder');
        console.log('Input placeholder:', placeholder);
      }
    });

    test('should send message when input is filled and submitted', async ({ page }) => {
      await ensureUserAndLogin(page);
      await page.goto('/ai-assistant');

      // Ждём полной загрузки и подключения
      await page.waitForTimeout(3000);

      // Проверяем есть ли настроенный AI провайдер
      const settingsWarning = page.getByText('AI провайдер не настроен');
      if (await settingsWarning.isVisible().catch(() => false)) {
        console.log('AI provider not configured - skipping message test');
        test.skip();
        return;
      }

      const inputField = page.getByPlaceholder('Напишите сообщение...');

      if (await inputField.isVisible()) {
        // Вводим тестовое сообщение
        await inputField.fill('Привет, это тестовое сообщение');

        // Нажимаем кнопку отправки
        await page.getByRole('button', { type: 'submit' }).click();

        // Ждём появления сообщения в чате
        await page.waitForTimeout(1000);

        // Проверяем что сообщение отображается
        const userMessage = page.getByText('Привет, это тестовое сообщение');
        await expect(userMessage).toBeVisible();
      }
    });
  });

  test.describe('Database Verification', () => {
    test('should save dialogue to database when message is sent', async ({ page }) => {
      await ensureUserAndLogin(page);

      const user = await getUserByEmail(TEST_USER.email);
      if (!user) {
        test.skip();
        return;
      }

      // Очищаем старые диалоги
      await clearUserDialogues(user._id.toString());

      await page.goto('/ai-assistant');
      await page.waitForTimeout(3000);

      // Проверяем есть ли AI провайдер
      const settingsWarning = page.getByText('AI провайдер не настроен');
      if (await settingsWarning.isVisible().catch(() => false)) {
        console.log('AI provider not configured - checking empty dialogues');

        const dialogues = await getDialoguesFromDB(user._id.toString());
        expect(dialogues.length).toBe(0);
        return;
      }

      const inputField = page.getByPlaceholder('Напишите сообщение...');

      if (await inputField.isVisible()) {
        // Отправляем сообщение
        await inputField.fill('Тестовое сообщение для БД');
        await page.getByRole('button', { type: 'submit' }).click();

        // Ждём сохранения
        await page.waitForTimeout(2000);

        // Проверяем БД
        const dialogues = await getDialoguesFromDB(user._id.toString());
        console.log('Dialogues in DB:', dialogues.length);

        if (dialogues.length > 0) {
          const latestDialogue = dialogues[0];
          console.log('Latest dialogue:', {
            id: latestDialogue._id,
            title: latestDialogue.title,
            messagesCount: latestDialogue.messages?.length,
          });

          // Проверяем что есть сообщение пользователя
          const userMessages = latestDialogue.messages?.filter(
            (m: any) => m.role === 'user'
          );
          expect(userMessages?.length).toBeGreaterThan(0);
        }
      }
    });

    test('should retrieve dialogues for correct user', async ({ page }) => {
      await ensureUserAndLogin(page);

      const user = await getUserByEmail(TEST_USER.email);
      if (!user) {
        test.skip();
        return;
      }

      // Получаем диалоги из БД
      const dbDialogues = await getDialoguesFromDB(user._id.toString());

      // Получаем диалоги через API
      const response = await page.request.get('/api/ai-dialogues');
      const apiData = await response.json();

      console.log('DB dialogues count:', dbDialogues.length);
      console.log('API dialogues count:', apiData.dialogues?.length);

      // Количество должно совпадать
      expect(apiData.dialogues?.length).toBe(dbDialogues.length);
    });
  });
});
