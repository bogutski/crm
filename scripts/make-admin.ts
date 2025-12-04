/**
 * Скрипт для назначения роли администратора пользователю
 *
 * Использование:
 *   npm run make-admin your-email@example.com
 */

import { connectToDatabase } from '../lib/mongodb';
import User from '../modules/user/model';

async function makeAdmin(email: string) {
  try {
    await connectToDatabase();

    // Найти пользователя по email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ Пользователь с email "${email}" не найден`);
      process.exit(1);
    }

    // Проверить, есть ли уже роль admin
    if (user.roles.includes('admin')) {
      console.log(`✅ Пользователь ${user.name} (${user.email}) уже является администратором`);
      process.exit(0);
    }

    // Добавить роль admin
    user.roles.push('admin');
    await user.save();

    console.log(`✅ Роль администратора успешно назначена пользователю:`);
    console.log(`   Имя: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Роли: ${user.roles.join(', ')}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при назначении роли:', error);
    process.exit(1);
  }
}

// Получить email из аргументов командной строки
const email = process.argv[2];

if (!email) {
  console.error('❌ Укажите email пользователя');
  console.log('\nИспользование:');
  console.log('  npm run make-admin your-email@example.com');
  console.log('  или');
  console.log('  npx tsx scripts/make-admin.ts your-email@example.com');
  process.exit(1);
}

makeAdmin(email);
