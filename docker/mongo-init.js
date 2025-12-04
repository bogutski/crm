// Инициализация MongoDB для CRM системы
// Этот скрипт создаёт базу данных и пользователя с необходимыми правами

db = db.getSiblingDB('crmproto');

// Создание пользователя для приложения
db.createUser({
  user: 'crmproto_user',
  pwd: 'Xk9mPv3nQwL7rT2s',
  roles: [
    {
      role: 'readWrite',
      db: 'crmproto'
    }
  ]
});

print('✓ Пользователь crmproto_user создан');
print('✓ База данных crmproto инициализирована');
print('✓ Готово к подключению приложения');
