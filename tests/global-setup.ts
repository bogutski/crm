/**
 * Global setup for Playwright tests
 * Clears the database and seeds test contacts before running tests
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Contact schema for seeding
const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    emails: [{
      address: String,
      isVerified: { type: Boolean, default: false },
      isSubscribed: { type: Boolean, default: true },
    }],
    phones: [{
      e164: String,
      international: String,
      country: String,
      type: { type: String, enum: ['MOBILE', 'FIXED_LINE', 'UNKNOWN'], default: 'MOBILE' },
      isPrimary: { type: Boolean, default: false },
      isVerified: { type: Boolean, default: false },
      isSubscribed: { type: Boolean, default: true },
    }],
    company: String,
    position: String,
    notes: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Russian names and data for seeding
const firstNames = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём', 'Илья', 'Кирилл', 'Михаил',
  'Анна', 'Мария', 'Елена', 'Дарья', 'Алина', 'Ирина', 'Екатерина', 'Арина', 'Полина', 'Ольга',
];

const lastNames = [
  'Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Михайлов', 'Новиков', 'Фёдоров',
  'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семёнов', 'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев',
];

const companies = [
  'Газпром', 'Лукойл', 'Сбербанк', 'Роснефть', 'Яндекс', 'Тинькофф', 'Озон', 'Wildberries', 'МТС', 'Мегафон',
  null, null, null,
];

const positions = [
  'Генеральный директор', 'Финансовый директор', 'Технический директор', 'Менеджер проекта',
  'Аналитик', 'Разработчик', 'Дизайнер', 'Маркетолог', 'Специалист', 'Консультант',
  null, null,
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone(): string {
  const codes = ['900', '901', '902', '903', '905', '910', '915', '920', '925', '930', '950', '960', '980', '985', '999'];
  const code = randomElement(codes);
  const num1 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const num2 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const num3 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `+7${code}${num1}${num2}${num3}`;
}

function transliterate(text: string): string {
  return text.toLowerCase()
    .replace(/ё/g, 'e').replace(/а/g, 'a').replace(/б/g, 'b').replace(/в/g, 'v').replace(/г/g, 'g')
    .replace(/д/g, 'd').replace(/е/g, 'e').replace(/ж/g, 'zh').replace(/з/g, 'z').replace(/и/g, 'i')
    .replace(/й/g, 'y').replace(/к/g, 'k').replace(/л/g, 'l').replace(/м/g, 'm').replace(/н/g, 'n')
    .replace(/о/g, 'o').replace(/п/g, 'p').replace(/р/g, 'r').replace(/с/g, 's').replace(/т/g, 't')
    .replace(/у/g, 'u').replace(/ф/g, 'f').replace(/х/g, 'h').replace(/ц/g, 'ts').replace(/ч/g, 'ch')
    .replace(/ш/g, 'sh').replace(/щ/g, 'sch').replace(/ъ/g, '').replace(/ы/g, 'y').replace(/ь/g, '')
    .replace(/э/g, 'e').replace(/ю/g, 'yu').replace(/я/g, 'ya');
}

function generateContact(ownerId: mongoose.Types.ObjectId, index: number) {
  const firstName = randomElement(firstNames);
  const lastName = randomElement(lastNames);
  const company = randomElement(companies);
  const position = randomElement(positions);

  const emailDomains = ['gmail.com', 'yandex.ru', 'mail.ru', 'outlook.com'];
  const translitName = transliterate(`${firstName}.${lastName}`);
  const phone = generatePhone();

  return {
    name: `${firstName} ${lastName}`,
    emails: Math.random() > 0.1 ? [{
      address: `${translitName}${index}@${randomElement(emailDomains)}`,
      isVerified: Math.random() > 0.7,
      isSubscribed: Math.random() > 0.2,
    }] : [],
    phones: Math.random() > 0.15 ? [{
      e164: phone,
      international: `+7 ${phone.slice(2, 5)} ${phone.slice(5, 8)}-${phone.slice(8, 10)}-${phone.slice(10)}`,
      country: 'RU',
      type: 'MOBILE' as const,
      isPrimary: true,
    }] : [],
    company: company || undefined,
    position: position || undefined,
    ownerId,
  };
}

async function globalSetup() {
  dotenv.config({ path: '.env.local' });
  const mongoUri = process.env.MONGODB_URI!;

  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;
  if (db) {
    // Clear all collections
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
    console.log('Database cleared before tests');

    // Create test user
    const UserSchema = new mongoose.Schema({ email: String, name: String });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const testUser = await User.create({ email: 'seed@example.com', name: 'Seed User' });

    // Seed contacts
    const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
    const TOTAL_CONTACTS = 100;
    const contacts = [];

    for (let i = 0; i < TOTAL_CONTACTS; i++) {
      contacts.push(generateContact(testUser._id as mongoose.Types.ObjectId, i));
    }

    await Contact.insertMany(contacts);
    console.log(`Seeded ${TOTAL_CONTACTS} test contacts`);
  }

  await mongoose.disconnect();
}

export default globalSetup;
