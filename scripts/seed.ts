/**
 * Seed script - populates database via REST API
 *
 * Usage:
 *   1. Start the dev server: npm run dev
 *   2. Run: npm run seed
 *
 * ALWAYS clears the database and inserts fresh data.
 *
 * Creates:
 * - Admin user (5901867@gmail.com / 123456)
 * - Dictionaries (contact types, sources, industries, opportunity priorities)
 * - 1000 contacts
 * - 2000-3000 opportunities
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { faker } from '@faker-js/faker/locale/ru';

// Load .env.local
config({ path: '.env.local' });

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const MONGODB_URI = process.env.MONGODB_URI as string;

// Collections to clear on reset
const COLLECTIONS_TO_CLEAR = [
  'users',
  'accounts',
  'sessions',
  'contacts',
  'dictionaries',
  'dictionaryitems',
  'opportunities',
  'pipelines',
  'pipelinestages',
  'channels',
  'interactions',
];

async function resetDatabase(): Promise<void> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not found in .env.local');
  }

  console.log('   Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to get database instance');
  }

  const existingCollections = await db.listCollections().toArray();
  const existingNames = existingCollections.map(c => c.name);

  let deleted = 0;
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    if (existingNames.includes(collectionName)) {
      const result = await db.collection(collectionName).deleteMany({});
      deleted += result.deletedCount;
    }
  }

  console.log(`   Deleted ${deleted} documents`);
  await mongoose.disconnect();
}

// ==================== CONFIG ====================

const INITIAL_USER = {
  email: '5901867@gmail.com',
  password: '123456',
  name: 'Admin User',
};

// ==================== API CLIENT ====================

class ApiClient {
  private cookies: string[] = [];
  private csrfToken: string = '';

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    expectStatus: number = 200
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.cookies.length > 0) {
      headers['Cookie'] = this.cookies.join('; ');
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });

    // Collect cookies from response
    const setCookies = response.headers.getSetCookie();
    if (setCookies.length > 0) {
      for (const cookie of setCookies) {
        const cookieName = cookie.split('=')[0];
        // Remove old cookie with same name
        this.cookies = this.cookies.filter(c => !c.startsWith(cookieName + '='));
        // Add new cookie (only the name=value part)
        this.cookies.push(cookie.split(';')[0]);
      }
    }

    // For redirects, throw error with details
    if (response.status === 302 || response.status === 303 || response.status === 307) {
      const location = response.headers.get('location');
      throw new Error(`Redirect ${response.status} to ${location} - likely auth issue`);
    }

    const text = await response.text();
    let data: T;
    try {
      data = JSON.parse(text);
    } catch {
      data = text as unknown as T;
    }

    if (response.status !== expectStatus && response.status !== 201) {
      throw new Error(`API Error ${response.status}: ${path} - ${text}`);
    }

    return data;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body: unknown, expectStatus: number = 200): Promise<T> {
    return this.request<T>('POST', path, body, expectStatus);
  }

  // Get CSRF token for NextAuth
  async getCsrfToken(): Promise<string> {
    const response = await fetch(`${BASE_URL}/api/auth/csrf`, {
      headers: this.cookies.length > 0 ? { Cookie: this.cookies.join('; ') } : {},
    });
    const data = await response.json();
    this.csrfToken = data.csrfToken;

    // Collect cookies
    const setCookies = response.headers.getSetCookie();
    for (const cookie of setCookies) {
      const cookieName = cookie.split('=')[0];
      this.cookies = this.cookies.filter(c => !c.startsWith(cookieName + '='));
      this.cookies.push(cookie.split(';')[0]);
    }

    return this.csrfToken;
  }

  // Login via NextAuth credentials provider
  async login(email: string, password: string): Promise<boolean> {
    await this.getCsrfToken();

    const formData = new URLSearchParams();
    formData.append('csrfToken', this.csrfToken);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('json', 'true');

    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: this.cookies.join('; '),
      },
      body: formData.toString(),
      redirect: 'manual',
    });

    // Collect session cookies
    const setCookies = response.headers.getSetCookie();
    for (const cookie of setCookies) {
      const cookieName = cookie.split('=')[0];
      this.cookies = this.cookies.filter(c => !c.startsWith(cookieName + '='));
      this.cookies.push(cookie.split(';')[0]);
    }

    // Check if we got a session
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Cookie: this.cookies.join('; ') },
    });
    const session = await sessionResponse.json();

    return !!session?.user;
  }

  hasCookies(): boolean {
    return this.cookies.some(c => c.includes('authjs.session-token') || c.includes('next-auth.session-token'));
  }
}

// ==================== SEED DATA ====================

const DICTIONARIES = [
  {
    code: 'contact_types',
    name: 'Типы контактов',
    description: 'Категоризация контактов по типам',
    allowHierarchy: false,
    fields: [{ code: 'color', name: 'Цвет', type: 'color' as const, required: true }],
    items: [
      { code: 'client', name: 'Клиент', properties: { color: '#22c55e' } },
      { code: 'lead', name: 'Лид', properties: { color: '#3b82f6' } },
      { code: 'partner', name: 'Партнёр', properties: { color: '#a855f7' } },
      { code: 'supplier', name: 'Поставщик', properties: { color: '#f97316' } },
      { code: 'vip', name: 'VIP', properties: { color: '#ffd700' } },
      { code: 'potential', name: 'Потенциальный', properties: { color: '#6b7280' } },
    ],
  },
  {
    code: 'opportunity_priority',
    name: 'Приоритет сделки',
    description: 'Приоритеты для сделок',
    allowHierarchy: false,
    fields: [{ code: 'color', name: 'Цвет', type: 'color' as const, required: true }],
    items: [
      { code: 'low', name: 'Низкий', properties: { color: '#6b7280' } },
      { code: 'medium', name: 'Средний', properties: { color: '#eab308' } },
      { code: 'high', name: 'Высокий', properties: { color: '#f97316' } },
      { code: 'critical', name: 'Критический', properties: { color: '#ef4444' } },
    ],
  },
  {
    code: 'sources',
    name: 'Источники',
    description: 'Откуда пришёл контакт',
    allowHierarchy: false,
    fields: [{ code: 'color', name: 'Цвет', type: 'color' as const, required: false }],
    items: [
      { code: 'website', name: 'Сайт', properties: { color: '#3b82f6' } },
      { code: 'ads', name: 'Реклама', properties: { color: '#f97316' } },
      { code: 'referral', name: 'Рекомендация', properties: { color: '#22c55e' } },
      { code: 'cold_call', name: 'Холодный звонок', properties: { color: '#6b7280' } },
      { code: 'exhibition', name: 'Выставка', properties: { color: '#a855f7' } },
      { code: 'social', name: 'Социальные сети', properties: { color: '#ec4899' } },
    ],
  },
  {
    code: 'industries',
    name: 'Отрасли',
    description: 'Отрасли деятельности компаний',
    allowHierarchy: true,
    maxDepth: 2,
    fields: [],
    items: [
      { name: 'IT', children: ['Разработка ПО', 'Интеграция', 'Консалтинг', 'Хостинг'] },
      { name: 'Розничная торговля', children: ['Продукты', 'Одежда', 'Электроника'] },
      { name: 'Финансы' },
      { name: 'Производство' },
    ],
  },
  {
    code: 'channels',
    name: 'Channels',
    description: 'Communication channels for messages',
    allowHierarchy: false,
    fields: [
      { code: 'color', name: 'Color', type: 'color' as const, required: true },
      { code: 'icon', name: 'Icon', type: 'icon' as const, required: false },
    ],
    items: [
      { code: 'sms', name: 'SMS', properties: { color: '#22c55e', icon: 'message' } },
      { code: 'email', name: 'Email', properties: { color: '#3b82f6', icon: 'mail' } },
      { code: 'imessage', name: 'iMessage', properties: { color: '#34c759', icon: 'message-circle' } },
      { code: 'whatsapp', name: 'WhatsApp', properties: { color: '#25d366', icon: 'message-circle' } },
      { code: 'facebook', name: 'Facebook Messenger', properties: { color: '#0084ff', icon: 'message-square' } },
      { code: 'instagram', name: 'Instagram DM', properties: { color: '#e4405f', icon: 'camera' } },
      { code: 'twitter', name: 'X (Twitter) DM', properties: { color: '#000000', icon: 'at-sign' } },
      { code: 'linkedin', name: 'LinkedIn', properties: { color: '#0a66c2', icon: 'briefcase' } },
      { code: 'slack', name: 'Slack', properties: { color: '#4a154b', icon: 'hash' } },
      { code: 'webchat', name: 'Live Chat', properties: { color: '#6366f1', icon: 'message-circle' } },
      { code: 'phone', name: 'Phone Call', properties: { color: '#f97316', icon: 'phone-call' } },
      { code: 'callback', name: 'Callback Request', properties: { color: '#eab308', icon: 'phone-incoming' } },
    ],
  },
];

// Helper function
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Contact generation using Faker
function generateContact() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const hasEmail = faker.datatype.boolean({ probability: 0.9 });
  const hasPhone = faker.datatype.boolean({ probability: 0.85 });
  const hasCompany = faker.datatype.boolean({ probability: 0.7 });
  const hasPosition = faker.datatype.boolean({ probability: 0.6 });

  return {
    name: `${firstName} ${lastName}`,
    emails: hasEmail ? [{
      address: faker.internet.email({ firstName, lastName }).toLowerCase(),
      isVerified: faker.datatype.boolean({ probability: 0.3 }),
      isSubscribed: true,
    }] : [],
    phones: hasPhone ? [{
      e164: faker.phone.number({ style: 'international' }),
      international: faker.phone.number({ style: 'international' }),
      country: 'RU',
      type: 'MOBILE' as const,
      isPrimary: true,
    }] : [],
    company: hasCompany ? faker.company.name() : undefined,
    position: hasPosition ? faker.person.jobTitle() : undefined,
  };
}

// Opportunity generation - product/service types for realistic deal names
const opportunityTypes = [
  'Внедрение CRM', 'Разработка сайта', 'Техподдержка', 'Консалтинг', 'Интеграция 1С',
  'Автоматизация склада', 'Мобильное приложение', 'SEO продвижение', 'Контекстная реклама',
  'Обучение персонала', 'Аудит безопасности', 'Миграция данных', 'Облачная инфраструктура',
  'ERP система', 'Чат-бот', 'Маркетплейс', 'CRM система', 'Интернет-магазин', 'Лендинг',
  'Корпоративный портал', 'Телефония', 'Видеонаблюдение', 'СКУД', 'Бухгалтерия', 'Склад',
  'Логистика', 'Биллинг', 'Личный кабинет', 'API интеграция', 'Документооборот',
];

const utmSources = ['google', 'yandex', 'facebook', 'instagram', 'linkedin', 'vk', 'tiktok', null];
const utmMediums = ['cpc', 'organic', 'email', 'social', 'referral', 'banner', null];
const utmCampaigns = ['spring_sale', 'black_friday', 'new_year', 'summer_promo', 'autumn_deal', null];

// Channels data
const CHANNELS = [
  { code: 'sms', name: 'SMS', icon: 'smartphone', color: '#22c55e' },
  { code: 'email', name: 'Email', icon: 'mail', color: '#3b82f6' },
  { code: 'telegram', name: 'Telegram', icon: 'send', color: '#0088cc' },
  { code: 'whatsapp', name: 'WhatsApp', icon: 'message-circle', color: '#25d366' },
  { code: 'facebook', name: 'Facebook Messenger', icon: 'message-square', color: '#0084ff' },
  { code: 'instagram', name: 'Instagram', icon: 'camera', color: '#e4405f' },
  { code: 'webchat', name: 'Онлайн-чат', icon: 'globe', color: '#6366f1' },
  { code: 'phone', name: 'Телефон', icon: 'phone-call', color: '#f97316' },
  { code: 'zoom', name: 'Zoom', icon: 'video', color: '#2d8cff' },
  { code: 'meet', name: 'Google Meet', icon: 'video', color: '#00897b' },
];

// Pipelines data
const PIPELINES = [
  {
    name: 'B2B Продажи',
    code: 'b2b_sales',
    description: 'Воронка для корпоративных продаж',
    isDefault: true,
    stages: [
      { code: 'lead', name: 'Лид', color: '#6b7280', probability: 10, isInitial: true },
      { code: 'qualification', name: 'Квалификация', color: '#3b82f6', probability: 20 },
      { code: 'proposal', name: 'Предложение', color: '#8b5cf6', probability: 50 },
      { code: 'negotiation', name: 'Переговоры', color: '#f97316', probability: 75 },
      { code: 'won', name: 'Успешно', color: '#22c55e', probability: 100, isFinal: true, isWon: true },
      { code: 'lost', name: 'Потеряно', color: '#ef4444', probability: 0, isFinal: true },
    ],
  },
  {
    name: 'B2C Продажи',
    code: 'b2c_sales',
    description: 'Воронка для розничных клиентов',
    isDefault: false,
    stages: [
      { code: 'inquiry', name: 'Заявка', color: '#6b7280', probability: 20, isInitial: true },
      { code: 'demo', name: 'Демо', color: '#3b82f6', probability: 40 },
      { code: 'offer', name: 'Оффер', color: '#8b5cf6', probability: 60 },
      { code: 'payment', name: 'Оплата', color: '#f97316', probability: 80 },
      { code: 'closed', name: 'Закрыто', color: '#22c55e', probability: 100, isFinal: true, isWon: true },
      { code: 'rejected', name: 'Отказ', color: '#ef4444', probability: 0, isFinal: true },
    ],
  },
];

interface StageData {
  id: string;
  pipelineId: string;
}

function generateOpportunity(
  contactId: string,
  priorityIds: string[],
  stages: StageData[]
) {
  // Generate realistic opportunity name
  const type = randomElement(opportunityTypes);
  const hasCompanyPrefix = faker.datatype.boolean({ probability: 0.4 });
  const name = hasCompanyPrefix
    ? `${type} - ${faker.company.name()}`
    : type;

  // Amount from 10k to 10M with realistic distribution
  const amount = faker.number.int({ min: 10000, max: 10000000 });

  // Closing date: -60 days to +180 days from now
  const closingDate = faker.date.between({
    from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    to: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  });

  const utmSource = randomElement(utmSources);
  const utm = utmSource ? {
    source: utmSource,
    medium: randomElement(utmMediums) || undefined,
    campaign: randomElement(utmCampaigns) || undefined,
  } : undefined;

  const stage = randomElement(stages);
  const hasDescription = faker.datatype.boolean({ probability: 0.6 });

  return {
    name,
    amount,
    closingDate: closingDate.toISOString(),
    contactId,
    priorityId: randomElement(priorityIds),
    pipelineId: stage.pipelineId,
    stageId: stage.id,
    description: hasDescription ? faker.lorem.sentence({ min: 5, max: 15 }) : undefined,
    utm,
  };
}

// ==================== MAIN ====================

async function checkServer(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('  SEED VIA API');
  console.log('='.repeat(60));
  console.log(`\nTarget: ${BASE_URL}\n`);

  // Always reset database first
  console.log('0. Resetting database...');
  try {
    await resetDatabase();
    console.log('   Database cleared\n');
  } catch (error) {
    console.error('   Failed to reset database:', error);
    process.exit(1);
  }

  // Check server
  console.log('1. Checking server...');
  const serverOk = await checkServer();
  if (!serverOk) {
    console.error('   Server is not running!');
    console.error('   Start it with: npm run dev');
    process.exit(1);
  }
  console.log('   Server is running');

  const api = new ApiClient();

  // Register user
  console.log('\n2. Registering user...');
  try {
    const registerResult = await api.post<{ success?: boolean; error?: string }>(
      '/api/auth/register',
      INITIAL_USER,
      200
    );
    if (registerResult.success) {
      console.log(`   Created: ${INITIAL_USER.email}`);
    } else if (registerResult.error?.includes('уже существует')) {
      console.log(`   User ${INITIAL_USER.email} already exists`);
    } else {
      console.log(`   Response: ${JSON.stringify(registerResult)}`);
    }
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('уже существует') || err.message.includes('400')) {
      console.log(`   User ${INITIAL_USER.email} already exists`);
    } else {
      throw error;
    }
  }

  // Login
  console.log('\n3. Logging in...');
  const loggedIn = await api.login(INITIAL_USER.email, INITIAL_USER.password);
  if (!loggedIn) {
    console.error('   Failed to login!');
    process.exit(1);
  }
  console.log('   Logged in successfully');

  // Create dictionaries
  console.log('\n4. Creating dictionaries...');
  for (const dict of DICTIONARIES) {
    const { items, ...dictionaryData } = dict;

    let dictionaryExists = false;
    try {
      // Create dictionary
      await api.post('/api/dictionaries', dictionaryData, 201);
      console.log(`   Created dictionary: ${dict.name}`);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('duplicate') || err.message.includes('500')) {
        console.log(`   Dictionary ${dict.code} already exists`);
        dictionaryExists = true;
      } else {
        throw error;
      }
    }

    // Create items (even if dictionary existed - items might be missing)
    let itemsCreated = 0;
    let itemsSkipped = 0;

    for (const item of items) {
      if ('children' in item && item.children) {
        // Hierarchical item
        try {
          const parent = await api.post<{ id: string }>(`/api/dictionaries/${dict.code}/items`, {
            name: item.name,
          }, 201);
          itemsCreated++;
          if (!dictionaryExists) console.log(`     + ${item.name}`);

          for (const childName of item.children) {
            try {
              await api.post(`/api/dictionaries/${dict.code}/items`, {
                name: childName,
                parentId: parent.id,
              }, 201);
              itemsCreated++;
              if (!dictionaryExists) console.log(`       - ${childName}`);
            } catch {
              itemsSkipped++;
            }
          }
        } catch {
          itemsSkipped++;
        }
      } else {
        // Simple item
        try {
          await api.post(`/api/dictionaries/${dict.code}/items`, item, 201);
          itemsCreated++;
          if (!dictionaryExists) console.log(`     + ${item.name}`);
        } catch {
          itemsSkipped++;
        }
      }
    }

    if (dictionaryExists && itemsCreated > 0) {
      console.log(`     Added ${itemsCreated} new items`);
    } else if (dictionaryExists && itemsSkipped > 0) {
      console.log(`     All ${itemsSkipped} items already exist`);
    }
  }

  // Create channels
  console.log('\n5. Creating channels...');
  let channelsCreated = 0;

  for (const channel of CHANNELS) {
    try {
      await api.post('/api/channels', channel, 201);
      console.log(`   + ${channel.name}`);
      channelsCreated++;
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('duplicate') || err.message.includes('500')) {
        console.log(`   Channel ${channel.code} already exists`);
      } else {
        console.log(`   ! Failed to create channel: ${channel.name}`);
      }
    }
  }
  console.log(`   Created ${channelsCreated} channels`);

  // Create contacts - 1000 for realistic data
  const CONTACT_COUNT = 1000;
  const BATCH_SIZE = 50; // Process in batches for performance
  console.log(`\n6. Creating ${CONTACT_COUNT} contacts...`);

  const createdContacts: { id: string; name: string }[] = [];
  let contactErrors = 0;

  for (let batchStart = 0; batchStart < CONTACT_COUNT; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, CONTACT_COUNT);
    const batchPromises = [];

    for (let i = batchStart; i < batchEnd; i++) {
      const contact = generateContact();
      batchPromises.push(
        api.post<{ id: string; name: string }>('/api/contacts', contact, 201)
          .then(result => {
            createdContacts.push({ id: result.id, name: result.name });
          })
          .catch(() => {
            contactErrors++;
          })
      );
    }

    await Promise.all(batchPromises);
    process.stdout.write(`\r   Progress: ${createdContacts.length}/${CONTACT_COUNT}`);
  }
  console.log(`\n   Created ${createdContacts.length} contacts${contactErrors > 0 ? ` (${contactErrors} errors)` : ''}`);

  // Get priority IDs from dictionaries
  console.log('\n7. Getting priorities for opportunities...');
  let priorityIds: string[] = [];
  try {
    const prioritiesResponse = await api.get<{ items: { id: string }[] }>('/api/dictionaries/opportunity_priority/items');
    priorityIds = prioritiesResponse.items.map(p => p.id);
    console.log(`   Found ${priorityIds.length} priorities`);
  } catch (error) {
    console.log('   Could not fetch priorities');
  }

  // Create pipelines
  console.log('\n8. Creating pipelines...');
  const allStages: StageData[] = [];

  for (const pipelineData of PIPELINES) {
    const { stages, ...pipelineInfo } = pipelineData;
    try {
      const pipeline = await api.post<{ id: string }>('/api/pipelines', pipelineInfo, 201);
      console.log(`   Created pipeline: ${pipelineData.name}`);

      // Create stages for this pipeline
      for (let i = 0; i < stages.length; i++) {
        const stageData = {
          ...stages[i],
          order: i,
          isFinal: stages[i].isFinal || false,
          isWon: stages[i].isWon || false,
          isInitial: stages[i].isInitial || false,
        };
        try {
          const stage = await api.post<{ id: string }>(`/api/pipelines/${pipeline.id}/stages`, stageData, 201);
          allStages.push({ id: stage.id, pipelineId: pipeline.id });
          console.log(`     + ${stageData.name}`);
        } catch (error) {
          console.log(`     ! Failed to create stage: ${stageData.name}`);
        }
      }
    } catch (error) {
      console.log(`   Failed to create pipeline: ${pipelineData.name} - ${error instanceof Error ? error.message : error}`);
    }
  }
  console.log(`   Created ${allStages.length} stages total`);

  // Create opportunities - aim for ~2000-3000 opportunities across all stages
  console.log('\n9. Creating opportunities...');

  let opportunitiesCreated = 0;
  let opportunityErrors = 0;

  if (priorityIds.length === 0 || allStages.length === 0) {
    console.log('   Skipping - no priorities or stages found');
  } else {
    // Build list of all opportunities to create
    const opportunitiesToCreate: ReturnType<typeof generateOpportunity>[] = [];

    // Distribution: ~5% contacts get 0 opportunities, ~30% get 1, ~35% get 2, ~20% get 3, ~10% get 4-5
    for (const contact of createdContacts) {
      const rand = Math.random();
      let opportunityCount = 0;

      if (rand < 0.05) {
        opportunityCount = 0; // 5% - no opportunities
      } else if (rand < 0.35) {
        opportunityCount = 1; // 30% - 1 opportunity
      } else if (rand < 0.70) {
        opportunityCount = 2; // 35% - 2 opportunities
      } else if (rand < 0.90) {
        opportunityCount = 3; // 20% - 3 opportunities
      } else {
        opportunityCount = 4 + Math.floor(Math.random() * 2); // 10% - 4-5 opportunities
      }

      for (let i = 0; i < opportunityCount; i++) {
        opportunitiesToCreate.push(generateOpportunity(contact.id, priorityIds, allStages));
      }
    }

    console.log(`   Preparing ${opportunitiesToCreate.length} opportunities...`);

    // Create in batches for performance
    const OPP_BATCH_SIZE = 50;
    for (let batchStart = 0; batchStart < opportunitiesToCreate.length; batchStart += OPP_BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + OPP_BATCH_SIZE, opportunitiesToCreate.length);
      const batchPromises = [];

      for (let i = batchStart; i < batchEnd; i++) {
        batchPromises.push(
          api.post('/api/opportunities', opportunitiesToCreate[i], 201)
            .then(() => {
              opportunitiesCreated++;
            })
            .catch(() => {
              opportunityErrors++;
            })
        );
      }

      await Promise.all(batchPromises);
      process.stdout.write(`\r   Progress: ${opportunitiesCreated}/${opportunitiesToCreate.length}`);
    }
    console.log(`\n   Created ${opportunitiesCreated} opportunities${opportunityErrors > 0 ? ` (${opportunityErrors} errors)` : ''}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  SEED COMPLETED');
  console.log('='.repeat(60));
  console.log(`\n  Created:`);
  console.log(`    - ${channelsCreated} channels`);
  console.log(`    - ${createdContacts.length} contacts`);
  console.log(`    - ${opportunitiesCreated} opportunities`);
  console.log(`\n  Login credentials:`);
  console.log(`    Email: ${INITIAL_USER.email}`);
  console.log(`    Password: ${INITIAL_USER.password}`);
  console.log();
}

main().catch((error) => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
