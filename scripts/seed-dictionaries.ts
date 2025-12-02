import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Dictionary schema
const DictionaryFieldSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['string', 'number', 'boolean', 'color', 'icon'], required: true },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const DictionarySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    allowHierarchy: { type: Boolean, default: false },
    maxDepth: { type: Number, default: 1 },
    fields: { type: [DictionaryFieldSchema], default: [] },
  },
  { timestamps: true }
);

const DictionaryItemSchema = new mongoose.Schema(
  {
    dictionaryCode: { type: String, required: true },
    code: { type: String, sparse: true },
    name: { type: String, required: true },
    weight: { type: Number, default: 0 },
    parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    depth: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const Dictionary = mongoose.models.Dictionary || mongoose.model('Dictionary', DictionarySchema);
const DictionaryItem = mongoose.models.DictionaryItem || mongoose.model('DictionaryItem', DictionaryItemSchema);

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  // 1. Создаём словарь "Типы контактов"
  console.log('\nCreating "Типы контактов" dictionary...');
  await Dictionary.findOneAndUpdate(
    { code: 'contact_types' },
    {
      code: 'contact_types',
      name: 'Типы контактов',
      description: 'Категоризация контактов по типам',
      allowHierarchy: false,
      maxDepth: 1,
      fields: [{ code: 'color', name: 'Цвет', type: 'color', required: true }],
    },
    { upsert: true, new: true }
  );

  // Удаляем старые элементы
  await DictionaryItem.deleteMany({ dictionaryCode: 'contact_types' });

  // Добавляем типы контактов
  const contactTypes = [
    { code: 'client', name: 'Клиент', color: '#22c55e' },
    { code: 'lead', name: 'Лид', color: '#3b82f6' },
    { code: 'partner', name: 'Партнёр', color: '#a855f7' },
    { code: 'supplier', name: 'Поставщик', color: '#f97316' },
    { code: 'vip', name: 'VIP', color: '#ffd700' },
    { code: 'potential', name: 'Потенциальный', color: '#6b7280' },
  ];

  for (let i = 0; i < contactTypes.length; i++) {
    await DictionaryItem.create({
      dictionaryCode: 'contact_types',
      code: contactTypes[i].code,
      name: contactTypes[i].name,
      weight: i,
      properties: { color: contactTypes[i].color },
    });
    console.log(`  Added: ${contactTypes[i].name} (${contactTypes[i].code})`);
  }

  // 2. Создаём словарь "Источники"
  console.log('\nCreating "Источники" dictionary...');
  await Dictionary.findOneAndUpdate(
    { code: 'sources' },
    {
      code: 'sources',
      name: 'Источники',
      description: 'Откуда пришёл контакт',
      allowHierarchy: false,
      maxDepth: 1,
      fields: [{ code: 'color', name: 'Цвет', type: 'color', required: false }],
    },
    { upsert: true, new: true }
  );

  await DictionaryItem.deleteMany({ dictionaryCode: 'sources' });

  const sources = [
    { code: 'website', name: 'Сайт', color: '#3b82f6' },
    { code: 'ads', name: 'Реклама', color: '#f97316' },
    { code: 'referral', name: 'Рекомендация', color: '#22c55e' },
    { code: 'cold_call', name: 'Холодный звонок', color: '#6b7280' },
    { code: 'exhibition', name: 'Выставка', color: '#a855f7' },
    { code: 'social', name: 'Социальные сети', color: '#ec4899' },
  ];

  for (let i = 0; i < sources.length; i++) {
    await DictionaryItem.create({
      dictionaryCode: 'sources',
      code: sources[i].code,
      name: sources[i].name,
      weight: i,
      properties: { color: sources[i].color },
    });
    console.log(`  Added: ${sources[i].name} (${sources[i].code})`);
  }

  // 3. Создаём словарь "Отрасли" с иерархией
  console.log('\nCreating "Отрасли" dictionary (hierarchical)...');
  await Dictionary.findOneAndUpdate(
    { code: 'industries' },
    {
      code: 'industries',
      name: 'Отрасли',
      description: 'Отрасли деятельности компаний',
      allowHierarchy: true,
      maxDepth: 2,
      fields: [],
    },
    { upsert: true, new: true }
  );

  await DictionaryItem.deleteMany({ dictionaryCode: 'industries' });

  // Корневые отрасли
  const it = await DictionaryItem.create({
    dictionaryCode: 'industries',
    name: 'IT',
    weight: 0,
    depth: 0,
  });
  console.log('  Added: IT');

  // Подотрасли IT
  const itChildren = ['Разработка ПО', 'Интеграция', 'Консалтинг', 'Хостинг'];
  for (let i = 0; i < itChildren.length; i++) {
    await DictionaryItem.create({
      dictionaryCode: 'industries',
      name: itChildren[i],
      weight: i,
      parentId: it._id,
      depth: 1,
    });
    console.log(`    Added: ${itChildren[i]}`);
  }

  const retail = await DictionaryItem.create({
    dictionaryCode: 'industries',
    name: 'Розничная торговля',
    weight: 1,
    depth: 0,
  });
  console.log('  Added: Розничная торговля');

  const retailChildren = ['Продукты', 'Одежда', 'Электроника'];
  for (let i = 0; i < retailChildren.length; i++) {
    await DictionaryItem.create({
      dictionaryCode: 'industries',
      name: retailChildren[i],
      weight: i,
      parentId: retail._id,
      depth: 1,
    });
    console.log(`    Added: ${retailChildren[i]}`);
  }

  await DictionaryItem.create({
    dictionaryCode: 'industries',
    name: 'Финансы',
    weight: 2,
    depth: 0,
  });
  console.log('  Added: Финансы');

  await DictionaryItem.create({
    dictionaryCode: 'industries',
    name: 'Производство',
    weight: 3,
    depth: 0,
  });
  console.log('  Added: Производство');

  console.log('\n✅ Dictionaries seeded successfully!');
  
  // Выводим статистику
  const dictCount = await Dictionary.countDocuments();
  const itemCount = await DictionaryItem.countDocuments();
  console.log(`\nTotal: ${dictCount} dictionaries, ${itemCount} items`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
