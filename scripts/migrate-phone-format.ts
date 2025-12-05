/**
 * Миграция: форматирование телефонов в международный формат
 *
 * Использование: npx tsx scripts/migrate-phone-format.ts
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

config({ path: '.env.local' });

// Форматирование телефона в международный формат
// Определяем формат по номеру, а не по полю country (т.к. seed может содержать несоответствия)
function formatInternational(e164: string): string {
  if (!e164) return e164;

  // Если уже отформатирован (содержит пробелы), пропускаем
  if (e164.includes(' ')) return e164;

  // Убираем всё кроме цифр и +
  const cleaned = e164.replace(/[^\d+]/g, '');
  const digits = cleaned.replace('+', '');

  if (digits.length < 4) return e164;

  // USA/Canada: +1 XXX XXX XXXX
  if (digits.startsWith('1') && digits.length === 11) {
    return `+1 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  // Russia: +7 XXX XXX XX XX
  if (digits.startsWith('7') && digits.length === 11) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }

  // UK: +44 XXXX XXXXXX
  if (digits.startsWith('44') && digits.length >= 11) {
    return `+44 ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }

  // Germany: +49 XXX XXXXXXXX
  if (digits.startsWith('49') && digits.length >= 11) {
    return `+49 ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }

  // Ukraine: +380 XX XXX XX XX
  if (digits.startsWith('380') && digits.length === 12) {
    return `+380 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }

  // Универсальный формат: разбиваем на группы
  const parts: string[] = [];
  let remaining = digits;

  // Определяем код страны
  if (digits.startsWith('1') || digits.startsWith('7')) {
    parts.push(`+${digits[0]}`);
    remaining = digits.slice(1);
  } else if (digits.length > 10) {
    // 3-значный код страны
    parts.push(`+${digits.slice(0, 3)}`);
    remaining = digits.slice(3);
  } else {
    // 2-значный код страны
    parts.push(`+${digits.slice(0, 2)}`);
    remaining = digits.slice(2);
  }

  // Разбиваем на группы по 3
  while (remaining.length > 0) {
    const chunkSize = remaining.length > 4 ? 3 : remaining.length;
    parts.push(remaining.slice(0, chunkSize));
    remaining = remaining.slice(chunkSize);
  }

  return parts.join(' ');
}

async function migrate() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;
  const contactsCollection = db.collection('contacts');

  // Получаем все контакты с телефонами
  const contacts = await contactsCollection.find({
    'phones.0': { $exists: true }
  }).toArray();

  console.log(`Found ${contacts.length} contacts with phones`);

  let updatedCount = 0;

  for (const contact of contacts) {
    let needsUpdate = false;
    const updatedPhones = contact.phones.map((phone: any) => {
      const formatted = formatInternational(phone.e164);

      // Проверяем, нужно ли обновление
      if (formatted !== phone.international) {
        needsUpdate = true;
        console.log(`  ${phone.international} -> ${formatted}`);
        return { ...phone, international: formatted };
      }
      return phone;
    });

    if (needsUpdate) {
      await contactsCollection.updateOne(
        { _id: contact._id },
        { $set: { phones: updatedPhones } }
      );
      updatedCount++;
      console.log(`Updated: ${contact.name}`);
    }
  }

  console.log(`\nMigration complete. Updated ${updatedCount} contacts.`);

  await mongoose.disconnect();
}

migrate().catch(console.error);
