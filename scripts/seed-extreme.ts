/**
 * Extreme Seed Script - Direct MongoDB bulk insert for load testing
 *
 * Usage:
 *   npm run seed:extreme
 *   npm run seed:extreme -- --count=1000  # Custom count
 *
 * Creates 100,000 records of each entity type (by default):
 * - 100,000 contacts
 * - 100,000 opportunities
 * - 100,000 interactions
 *
 * Uses direct MongoDB insertMany for maximum performance.
 * Expected time: 2-5 minutes depending on hardware.
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { faker } from '@faker-js/faker/locale/ru';

// Load .env.local
config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI as string;

// ==================== CONFIG ====================

// Parse command line args for custom counts
const args = process.argv.slice(2);
const countArg = args.find(a => a.startsWith('--count='));
const customCount = countArg ? parseInt(countArg.split('=')[1], 10) : null;

const COUNTS = {
  contacts: customCount || 100_000,
  opportunities: customCount || 100_000,
  interactions: customCount || 100_000,
};

const BATCH_SIZE = 5000; // Documents per insertMany call

// ==================== IMPORT EXISTING MODELS ====================

// Import existing models from the project
import User from '../modules/user/model';
import Contact from '../modules/contact/model';
import { Pipeline, PipelineStage } from '../modules/pipeline/model';
import Opportunity from '../modules/opportunity/model';
import { Channel } from '../modules/channel/model';
import { Interaction } from '../modules/interaction/model';
import { Dictionary, DictionaryItem } from '../modules/dictionary/model';

// ==================== DATA GENERATORS ====================

const contactTypes = ['client', 'lead', 'partner', 'supplier', 'vip', 'potential'];
const sources = ['website', 'ads', 'referral', 'cold_call', 'exhibition', 'social'];
const industries = ['IT', 'Retail', 'Finance', 'Manufacturing', 'Services', 'Healthcare'];

const opportunityTypes = [
  'Внедрение CRM', 'Разработка сайта', 'Техподдержка', 'Консалтинг', 'Интеграция 1С',
  'Автоматизация склада', 'Мобильное приложение', 'SEO продвижение', 'Контекстная реклама',
  'Обучение персонала', 'Аудит безопасности', 'Миграция данных', 'Облачная инфраструктура',
  'ERP система', 'Чат-бот', 'Маркетплейс', 'CRM система', 'Интернет-магазин',
];

const utmSources = ['google', 'yandex', 'facebook', 'instagram', 'linkedin', 'vk', null];
const utmMediums = ['cpc', 'organic', 'email', 'social', 'referral', null];

const messageTemplates = [
  'Здравствуйте! Интересует ваш продукт.',
  'Подскажите стоимость услуг.',
  'Когда можно созвониться?',
  'Спасибо за информацию!',
  'Нужна консультация по вашим услугам.',
  'Хотим заказать демо.',
  'Какие условия сотрудничества?',
  'Отправил документы на почту.',
  'Готовы к следующему этапу.',
  'Есть вопросы по договору.',
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const phoneTypes: ('MOBILE' | 'FIXED_LINE' | 'UNKNOWN')[] = ['MOBILE', 'FIXED_LINE', 'UNKNOWN'];
const countries = ['RU', 'BY', 'KZ', 'UA', 'US', 'DE'];

function generateContactDoc(ownerId: mongoose.Types.ObjectId) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const hasCompany = Math.random() > 0.3;

  // Generate 1-3 emails (90% have at least 1 email)
  const emailCount = Math.random() > 0.1 ? faker.number.int({ min: 1, max: 3 }) : 0;
  const emails = [];
  for (let i = 0; i < emailCount; i++) {
    const isFirst = i === 0;
    emails.push({
      address: isFirst
        ? faker.internet.email({ firstName, lastName }).toLowerCase()
        : faker.internet.email().toLowerCase(),
      isVerified: Math.random() > 0.7,
      isSubscribed: Math.random() > 0.2,
    });
  }

  // Generate 1-3 phones (85% have at least 1 phone)
  const phoneCount = Math.random() > 0.15 ? faker.number.int({ min: 1, max: 3 }) : 0;
  const phones = [];
  for (let i = 0; i < phoneCount; i++) {
    const isFirst = i === 0;
    const phoneNumber = faker.phone.number({ style: 'international' });
    phones.push({
      e164: phoneNumber.replace(/\s/g, ''),
      international: phoneNumber,
      country: isFirst ? 'RU' : randomElement(countries),
      type: isFirst ? 'MOBILE' : randomElement(phoneTypes),
      isPrimary: isFirst,
      isVerified: Math.random() > 0.8,
      isSubscribed: Math.random() > 0.1,
    });
  }

  return {
    _id: new mongoose.Types.ObjectId(),
    name: `${firstName} ${lastName}`,
    emails,
    phones,
    company: hasCompany ? faker.company.name() : undefined,
    position: hasCompany && Math.random() > 0.4 ? faker.person.jobTitle() : undefined,
    type: randomElement(contactTypes),
    source: randomElement(sources),
    industry: randomElement(industries),
    ownerId,
    createdAt: faker.date.between({ from: '2023-01-01', to: new Date() }),
    updatedAt: new Date(),
  };
}

function generateOpportunityDoc(
  contact: mongoose.Types.ObjectId,
  priorityIds: mongoose.Types.ObjectId[],
  stages: { id: mongoose.Types.ObjectId; pipelineId: mongoose.Types.ObjectId }[],
  ownerId: mongoose.Types.ObjectId
) {
  const type = randomElement(opportunityTypes);
  const hasCompanyPrefix = Math.random() > 0.6;
  const name = hasCompanyPrefix ? `${type} - ${faker.company.name()}` : type;
  const stage = randomElement(stages);
  const utmSource = randomElement(utmSources);

  return {
    _id: new mongoose.Types.ObjectId(),
    name,
    amount: faker.number.int({ min: 10000, max: 10000000 }),
    closingDate: faker.date.between({
      from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      to: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    }),
    contact, // Field name in model is 'contact', not 'contactId'
    priority: randomElement(priorityIds), // Field name in model is 'priority', not 'priorityId'
    pipelineId: stage.pipelineId,
    stageId: stage.id,
    ownerId,
    archived: false,
    description: Math.random() > 0.4 ? faker.lorem.sentence({ min: 5, max: 15 }) : undefined,
    utm: utmSource ? {
      source: utmSource,
      medium: randomElement(utmMediums) || undefined,
    } : undefined,
    createdAt: faker.date.between({ from: '2023-01-01', to: new Date() }),
    updatedAt: new Date(),
  };
}

function generateInteractionDoc(
  contactId: mongoose.Types.ObjectId,
  channelIds: mongoose.Types.ObjectId[],
  opportunityIds: mongoose.Types.ObjectId[],
  userId: mongoose.Types.ObjectId
) {
  const direction = Math.random() > 0.5 ? 'inbound' : 'outbound';
  const statuses = ['pending', 'sent', 'delivered', 'read'];
  // 40% of interactions are linked to an opportunity
  const hasOpportunity = Math.random() > 0.6;

  return {
    _id: new mongoose.Types.ObjectId(),
    channelId: randomElement(channelIds),
    contactId,
    opportunityId: hasOpportunity ? randomElement(opportunityIds) : undefined,
    direction,
    status: direction === 'inbound' ? 'delivered' : randomElement(statuses),
    content: randomElement(messageTemplates),
    metadata: {},
    createdBy: direction === 'outbound' ? userId : undefined,
    createdAt: faker.date.between({ from: '2023-06-01', to: new Date() }),
    updatedAt: new Date(),
  };
}

// ==================== PROGRESS BAR ====================

function progressBar(current: number, total: number, label: string): void {
  const width = 40;
  const percent = current / total;
  const filled = Math.round(width * percent);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percentStr = (percent * 100).toFixed(1).padStart(5);
  process.stdout.write(`\r   ${label}: [${bar}] ${percentStr}% (${current.toLocaleString()}/${total.toLocaleString()})`);
}

// ==================== MAIN ====================

async function main() {
  console.log('='.repeat(70));
  console.log('  EXTREME SEED - Direct MongoDB Bulk Insert');
  console.log('='.repeat(70));
  console.log(`\n  Target counts:`);
  console.log(`    - Contacts:     ${COUNTS.contacts.toLocaleString()}`);
  console.log(`    - Opportunities: ${COUNTS.opportunities.toLocaleString()}`);
  console.log(`    - Interactions:  ${COUNTS.interactions.toLocaleString()}`);
  console.log(`\n  Batch size: ${BATCH_SIZE.toLocaleString()} documents\n`);

  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  const startTime = Date.now();

  // Connect to MongoDB
  console.log('1. Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  console.log('   Connected\n');

  // Clear existing data
  console.log('2. Clearing existing data...');
  const collections = ['users', 'contacts', 'opportunities', 'interactions', 'pipelines', 'pipelinestages', 'channels', 'dictionaries', 'dictionaryitems'];
  for (const coll of collections) {
    try {
      await db.collection(coll).deleteMany({});
    } catch {
      // Collection might not exist
    }
  }
  console.log('   Cleared\n');

  // Create admin user
  console.log('3. Creating admin user...');
  // Use bcrypt-compatible hash (same as auth system)
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash('123456', 10);
  const adminUser = await User.create({
    name: 'Admin User',
    email: '5901867@gmail.com',
    passwordHash,
    roles: ['admin'],
    isActive: true,
  });
  const userId = adminUser._id as mongoose.Types.ObjectId;
  console.log(`   Created: ${adminUser.email}\n`);

  // Create priority dictionary
  console.log('4. Creating priority dictionary...');
  const priorityDict = await Dictionary.create({
    code: 'opportunity_priority',
    name: 'Приоритет сделки',
    description: 'Приоритеты для сделок',
    allowHierarchy: false,
    fields: [{ code: 'color', name: 'Цвет', type: 'color', required: true }],
  });

  const priorityItems = [
    { code: 'low', name: 'Низкий', properties: { color: '#6b7280' } },
    { code: 'medium', name: 'Средний', properties: { color: '#eab308' } },
    { code: 'high', name: 'Высокий', properties: { color: '#f97316' } },
    { code: 'critical', name: 'Критический', properties: { color: '#ef4444' } },
  ];

  const priorityIds: mongoose.Types.ObjectId[] = [];
  for (const item of priorityItems) {
    const created = await DictionaryItem.create({
      dictionaryCode: priorityDict.code,
      ...item,
    });
    priorityIds.push(created._id as mongoose.Types.ObjectId);
  }
  console.log(`   Created ${priorityIds.length} priority levels\n`);

  // Create channels
  console.log('5. Creating channels...');
  const channelsData = [
    { code: 'sms', name: 'SMS', icon: 'smartphone', color: '#22c55e' },
    { code: 'email', name: 'Email', icon: 'mail', color: '#3b82f6' },
    { code: 'telegram', name: 'Telegram', icon: 'send', color: '#0088cc' },
    { code: 'whatsapp', name: 'WhatsApp', icon: 'message-circle', color: '#25d366' },
    { code: 'phone', name: 'Телефон', icon: 'phone-call', color: '#f97316' },
    { code: 'webchat', name: 'Онлайн-чат', icon: 'globe', color: '#6366f1' },
  ];

  const channelIds: mongoose.Types.ObjectId[] = [];
  for (const ch of channelsData) {
    const created = await Channel.create(ch);
    channelIds.push(created._id as mongoose.Types.ObjectId);
  }
  console.log(`   Created ${channelIds.length} channels\n`);

  // Create pipelines and stages
  console.log('6. Creating pipelines...');
  const pipelinesData = [
    {
      name: 'B2B Продажи',
      code: 'b2b_sales',
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
      isDefault: false,
      stages: [
        { code: 'inquiry', name: 'Заявка', color: '#6b7280', probability: 20, isInitial: true },
        { code: 'demo', name: 'Демо', color: '#3b82f6', probability: 40 },
        { code: 'offer', name: 'Оффер', color: '#8b5cf6', probability: 60 },
        { code: 'closed', name: 'Закрыто', color: '#22c55e', probability: 100, isFinal: true, isWon: true },
        { code: 'rejected', name: 'Отказ', color: '#ef4444', probability: 0, isFinal: true },
      ],
    },
  ];

  const allStages: { id: mongoose.Types.ObjectId; pipelineId: mongoose.Types.ObjectId }[] = [];

  for (const pData of pipelinesData) {
    const { stages, ...pipelineInfo } = pData;
    const pipeline = await Pipeline.create(pipelineInfo);

    for (let i = 0; i < stages.length; i++) {
      const stage = await PipelineStage.create({
        pipelineId: pipeline._id,
        ...stages[i],
        order: i,
      });
      allStages.push({
        id: stage._id as mongoose.Types.ObjectId,
        pipelineId: pipeline._id as mongoose.Types.ObjectId,
      });
    }
    console.log(`   + ${pData.name} (${stages.length} stages)`);
  }
  console.log();

  // Generate and insert contacts
  console.log('7. Generating contacts...');
  const contactIds: mongoose.Types.ObjectId[] = [];
  let contactsInserted = 0;

  for (let batch = 0; batch < COUNTS.contacts; batch += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, COUNTS.contacts - batch);
    const docs = [];

    for (let i = 0; i < batchSize; i++) {
      const doc = generateContactDoc(userId);
      contactIds.push(doc._id);
      docs.push(doc);
    }

    await Contact.insertMany(docs, { ordered: false });
    contactsInserted += batchSize;
    progressBar(contactsInserted, COUNTS.contacts, 'Contacts    ');
  }
  console.log('\n');

  // Generate and insert opportunities
  console.log('8. Generating opportunities...');
  const opportunityIds: mongoose.Types.ObjectId[] = [];
  let opportunitiesInserted = 0;

  for (let batch = 0; batch < COUNTS.opportunities; batch += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, COUNTS.opportunities - batch);
    const docs = [];

    for (let i = 0; i < batchSize; i++) {
      const contactId = randomElement(contactIds);
      const doc = generateOpportunityDoc(contactId, priorityIds, allStages, userId);
      opportunityIds.push(doc._id);
      docs.push(doc);
    }

    await Opportunity.insertMany(docs, { ordered: false });
    opportunitiesInserted += batchSize;
    progressBar(opportunitiesInserted, COUNTS.opportunities, 'Opportunities');
  }
  console.log('\n');

  // Generate and insert interactions
  console.log('9. Generating interactions...');
  let interactionsInserted = 0;

  for (let batch = 0; batch < COUNTS.interactions; batch += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, COUNTS.interactions - batch);
    const docs = [];

    for (let i = 0; i < batchSize; i++) {
      const contactId = randomElement(contactIds);
      docs.push(generateInteractionDoc(contactId, channelIds, opportunityIds, userId));
    }

    await Interaction.insertMany(docs, { ordered: false });
    interactionsInserted += batchSize;
    progressBar(interactionsInserted, COUNTS.interactions, 'Interactions');
  }
  console.log('\n');

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('='.repeat(70));
  console.log('  EXTREME SEED COMPLETED');
  console.log('='.repeat(70));
  console.log(`\n  Created:`);
  console.log(`    - ${contactsInserted.toLocaleString()} contacts`);
  console.log(`    - ${opportunitiesInserted.toLocaleString()} opportunities`);
  console.log(`    - ${interactionsInserted.toLocaleString()} interactions`);
  console.log(`\n  Time elapsed: ${elapsed} seconds`);
  console.log(`  Insert rate: ~${Math.round((contactsInserted + opportunitiesInserted + interactionsInserted) / parseFloat(elapsed)).toLocaleString()} docs/sec`);
  console.log(`\n  Login credentials:`);
  console.log(`    Email: 5901867@gmail.com`);
  console.log(`    Password: 123456`);
  console.log();

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
