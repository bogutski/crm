import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Contact schema (simplified for seeding)
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

const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

// Russian first names
const firstNames = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём', 'Илья', 'Кирилл', 'Михаил',
  'Никита', 'Матвей', 'Роман', 'Егор', 'Арсений', 'Иван', 'Денис', 'Евгений', 'Даниил', 'Тимофей',
  'Анна', 'Мария', 'Елена', 'Дарья', 'Алина', 'Ирина', 'Екатерина', 'Арина', 'Полина', 'Ольга',
  'Юлия', 'Татьяна', 'Наталья', 'Виктория', 'Марина', 'Светлана', 'Анастасия', 'Ксения', 'Валерия', 'София',
];

// Russian last names
const lastNames = [
  'Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Михайлов', 'Новиков', 'Фёдоров',
  'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семёнов', 'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев',
  'Орлов', 'Андреев', 'Макаров', 'Никитин', 'Захаров', 'Зайцев', 'Соловьёв', 'Борисов', 'Яковлев', 'Григорьев',
];

// Companies
const companies = [
  'Газпром', 'Лукойл', 'Сбербанк', 'Роснефть', 'РЖД', 'ВТБ', 'Магнит', 'Норникель', 'Татнефть', 'Сургутнефтегаз',
  'Яндекс', 'Mail.ru Group', 'Тинькофф', 'Озон', 'Wildberries', 'X5 Retail Group', 'МТС', 'Мегафон', 'Билайн', 'Ростелеком',
  'Северсталь', 'НЛМК', 'ММК', 'Русал', 'Полюс', 'Алроса', 'ФосАгро', 'Уралкалий', 'Акрон', 'ЕвроХим',
  null, null, null, null, null, // Some contacts without company
];

// Positions
const positions = [
  'Генеральный директор', 'Финансовый директор', 'Технический директор', 'Коммерческий директор',
  'Директор по маркетингу', 'Директор по продажам', 'HR-директор', 'IT-директор',
  'Руководитель отдела', 'Менеджер проекта', 'Старший менеджер', 'Менеджер по продажам',
  'Аналитик', 'Разработчик', 'Дизайнер', 'Бухгалтер', 'Юрист', 'Маркетолог',
  'Специалист', 'Консультант', 'Ассистент', 'Координатор',
  null, null, null, // Some contacts without position
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone(): string {
  const code = ['900', '901', '902', '903', '904', '905', '906', '908', '909', '910', '911', '912', '913', '914', '915', '916', '917', '918', '919', '920', '921', '922', '923', '924', '925', '926', '927', '928', '929', '930', '931', '932', '933', '934', '936', '937', '938', '939', '950', '951', '952', '953', '954', '955', '956', '958', '960', '961', '962', '963', '964', '965', '966', '967', '968', '969', '970', '971', '977', '978', '980', '981', '982', '983', '984', '985', '986', '987', '988', '989', '991', '992', '993', '994', '995', '996', '997', '999'];
  const selectedCode = randomElement(code);
  const num1 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const num2 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const num3 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `+7${selectedCode}${num1}${num2}${num3}`;
}

function generateContact(ownerId: mongoose.Types.ObjectId, index: number) {
  const firstName = randomElement(firstNames);
  const lastName = randomElement(lastNames);
  const company = randomElement(companies);
  const position = randomElement(positions);

  const emailDomains = ['gmail.com', 'yandex.ru', 'mail.ru', 'outlook.com', 'company.ru'];
  const emailName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/ё/g, 'e');
  const translitName = emailName
    .replace(/а/g, 'a').replace(/б/g, 'b').replace(/в/g, 'v').replace(/г/g, 'g').replace(/д/g, 'd')
    .replace(/е/g, 'e').replace(/ж/g, 'zh').replace(/з/g, 'z').replace(/и/g, 'i').replace(/й/g, 'y')
    .replace(/к/g, 'k').replace(/л/g, 'l').replace(/м/g, 'm').replace(/н/g, 'n').replace(/о/g, 'o')
    .replace(/п/g, 'p').replace(/р/g, 'r').replace(/с/g, 's').replace(/т/g, 't').replace(/у/g, 'u')
    .replace(/ф/g, 'f').replace(/х/g, 'h').replace(/ц/g, 'ts').replace(/ч/g, 'ch').replace(/ш/g, 'sh')
    .replace(/щ/g, 'sch').replace(/ъ/g, '').replace(/ы/g, 'y').replace(/ь/g, '').replace(/э/g, 'e')
    .replace(/ю/g, 'yu').replace(/я/g, 'ya');

  const phone = generatePhone();
  const hasEmail = Math.random() > 0.1; // 90% have email
  const hasPhone = Math.random() > 0.15; // 85% have phone

  return {
    name: `${firstName} ${lastName}`,
    emails: hasEmail ? [{
      address: `${translitName}${index}@${randomElement(emailDomains)}`,
      isVerified: Math.random() > 0.7,
      isSubscribed: Math.random() > 0.2,
    }] : [],
    phones: hasPhone ? [{
      e164: phone,
      international: `+7 ${phone.slice(2, 5)} ${phone.slice(5, 8)}-${phone.slice(8, 10)}-${phone.slice(10)}`,
      country: 'RU',
      type: 'MOBILE' as const,
      isPrimary: true,
      isVerified: Math.random() > 0.8,
      isSubscribed: Math.random() > 0.1,
    }] : [],
    company: company || undefined,
    position: position || undefined,
    notes: Math.random() > 0.7 ? `Заметка для контакта #${index}` : undefined,
    ownerId,
  };
}

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  // Get first user as owner
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ email: String }));
  let user = await User.findOne();

  if (!user) {
    console.log('No user found. Creating a test user...');
    user = await User.create({ email: 'test@example.com', name: 'Test User' });
  }

  console.log(`Using owner: ${user.email || user._id}`);

  // Check existing contacts count
  const existingCount = await Contact.countDocuments({ ownerId: user._id });
  console.log(`Existing contacts: ${existingCount}`);

  const TOTAL_CONTACTS = 300;
  const BATCH_SIZE = 100;

  console.log(`Creating ${TOTAL_CONTACTS} contacts...`);

  const startTime = Date.now();

  for (let batch = 0; batch < TOTAL_CONTACTS / BATCH_SIZE; batch++) {
    const contacts = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const index = batch * BATCH_SIZE + i + existingCount;
      contacts.push(generateContact(user._id, index));
    }

    await Contact.insertMany(contacts);
    console.log(`Batch ${batch + 1}/${TOTAL_CONTACTS / BATCH_SIZE} inserted (${(batch + 1) * BATCH_SIZE} contacts)`);
  }

  const elapsed = Date.now() - startTime;
  const finalCount = await Contact.countDocuments({ ownerId: user._id });

  console.log(`\nDone! Created ${TOTAL_CONTACTS} contacts in ${elapsed}ms`);
  console.log(`Total contacts in database: ${finalCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
