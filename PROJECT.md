# ClientBase - Описание проекта

## Общая информация

**Название:** crm-proto-next
**Тип:** CRM-система (прототип)
**Версия:** 0.1.0
**Дата создания:** 2025-12-01

## Технологический стек

- **Framework:** Next.js 16.0.6
- **UI Library:** React 19.2.0
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript 5
- **Linting:** ESLint 9
- **Database:** MongoDB 8.0 (Docker)
- **ORM:** Mongoose
- **Auth:** NextAuth.js v5 (beta) + Credentials + Google OAuth + JWT
- **E2E Testing:** Playwright

## База данных

- **Контейнер:** mongodb (Docker)
- **База:** crmproto
- **Пользователь:** crmproto_user
- **Порт:** 27017
- **Аутентификация:** authSource=crmproto

## Структура проекта

```
crm-proto-next/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  # NextAuth API routes
│   │   │   └── register/route.ts       # Регистрация по email/password
│   │   ├── users/
│   │   │   ├── route.ts                # GET (список), POST (создание)
│   │   │   └── [id]/route.ts           # GET, PATCH, DELETE по ID
│   │   ├── contacts/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── opportunities/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── stats/route.ts          # Статистика по сделкам
│   │   └── health/route.ts
│   ├── login/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── modules/                            # Модульная структура бизнес-логики
│   ├── user/
│   │   ├── model.ts                    # Mongoose модель
│   │   ├── types.ts                    # TypeScript типы и DTO
│   │   ├── validation.ts               # Zod схемы валидации
│   │   ├── controller.ts               # Бизнес-логика (CRUD)
│   │   └── index.ts                    # Экспорт модуля
│   ├── contact/
│   │   ├── model.ts
│   │   ├── types.ts
│   │   ├── validation.ts
│   │   ├── controller.ts
│   │   └── index.ts
│   ├── opportunity/
│   │   ├── model.ts
│   │   ├── types.ts
│   │   ├── validation.ts
│   │   ├── controller.ts
│   │   └── index.ts
│   └── index.ts                        # Общий экспорт всех модулей
├── lib/
│   ├── auth.ts                         # NextAuth конфигурация
│   ├── auth-adapter.ts                 # Mongoose adapter для NextAuth
│   └── mongodb.ts                      # Подключение к MongoDB
├── models/                             # Служебные модели (auth)
│   ├── index.ts                        # Re-export из modules
│   ├── Account.ts                      # OAuth аккаунты
│   └── Session.ts                      # Сессии
├── tests/
│   ├── e2e/
│   │   ├── auth.spec.ts                # E2E тесты аутентификации
│   │   └── api/
│   │       ├── users.spec.ts           # API тесты Users
│   │       ├── contacts.spec.ts        # API тесты Contacts
│   │       └── opportunities.spec.ts   # API тесты Opportunities
│   ├── fixtures/
│   │   └── test-data.ts
│   └── helpers/
│       ├── db-helpers.ts
│       └── auth-helpers.ts
├── middleware.ts
├── playwright.config.ts
└── PROJECT.md
```

## API Endpoints

### Authentication
| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/health` | GET | Проверка состояния приложения и БД |
| `/api/auth/*` | * | NextAuth endpoints (signin, signout, session) |
| `/api/auth/register` | POST | Регистрация по email/password |

### Users
| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/users` | GET | Список пользователей (фильтры: search, role, isActive, page, limit) |
| `/api/users` | POST | Создание пользователя |
| `/api/users/:id` | GET | Получение пользователя по ID |
| `/api/users/:id` | PATCH | Обновление пользователя |
| `/api/users/:id` | DELETE | Удаление пользователя |

### Contacts
| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/contacts` | GET | Список контактов (фильтры: search, status, ownerId, tags, page, limit) |
| `/api/contacts` | POST | Создание контакта |
| `/api/contacts/:id` | GET | Получение контакта по ID |
| `/api/contacts/:id` | PATCH | Обновление контакта |
| `/api/contacts/:id` | DELETE | Удаление контакта |

### Opportunities
| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/opportunities` | GET | Список сделок (фильтры: search, stage, priority, ownerId, minValue, maxValue, page, limit) |
| `/api/opportunities` | POST | Создание сделки |
| `/api/opportunities/:id` | GET | Получение сделки по ID |
| `/api/opportunities/:id` | PATCH | Обновление сделки |
| `/api/opportunities/:id` | DELETE | Удаление сделки |
| `/api/opportunities/stats` | GET | Статистика по сделкам |

## Модели данных

### User
| Поле | Тип | Описание |
|------|-----|----------|
| email | string | Email (уникальный) |
| name | string | Отображаемое имя |
| passwordHash | string? | Хеш пароля (bcrypt) |
| image | string? | URL аватара |
| roles | string[] | Роли: admin, manager, user |
| isActive | boolean | Активен ли аккаунт |
| googleId | string? | ID из Google |
| lastLoginAt | Date? | Последний вход |

### Contact
| Поле | Тип | Описание |
|------|-----|----------|
| firstName | string | Имя |
| lastName | string | Фамилия |
| email | string? | Email |
| phone | string? | Телефон |
| company | string? | Компания |
| position | string? | Должность |
| status | enum | active, inactive, lead, customer |
| source | string? | Источник |
| notes | string? | Заметки |
| tags | string[] | Теги |
| ownerId | ObjectId | Владелец (User) |

### Opportunity
| Поле | Тип | Описание |
|------|-----|----------|
| title | string | Название сделки |
| description | string? | Описание |
| value | number | Сумма сделки |
| currency | string | Валюта (USD по умолчанию) |
| stage | enum | prospecting, qualification, proposal, negotiation, closed_won, closed_lost |
| priority | enum | low, medium, high |
| probability | number | Вероятность закрытия (0-100) |
| expectedCloseDate | Date? | Ожидаемая дата закрытия |
| actualCloseDate | Date? | Фактическая дата закрытия |
| contactId | ObjectId? | Связанный контакт |
| ownerId | ObjectId | Владелец (User) |
| notes | string? | Заметки |
| tags | string[] | Теги |

### Account (OAuth)
Хранит связь пользователя с Google аккаунтом и токены.

### Session
Хранит активные сессии пользователей в БД.

## Текущий статус

- Настроена инфраструктура MongoDB + Mongoose
- Аутентификация: email/password + Google OAuth
- JWT токены для сессий
- Middleware защищает все роуты кроме публичных
- Роли пользователей: admin, manager, user

---

## Принципы разработки

### Основные принципы

1. **Простота** — избегать over-engineering, писать минимально необходимый код
2. **Читаемость** — код должен быть понятен без лишних комментариев
3. **Итеративность** — маленькие шаги, частые проверки
4. **E2E First** — каждая новая фича начинается с E2E теста

### Технические предпочтения

- *Будет дополняться по мере работы над проектом*

---

## Процесс разработки

### Методология: E2E First (Test-Driven)

При разработке новой функциональности **обязательно** следовать этому порядку:

```
1. Написать E2E тест (Playwright) — тест падает, фичи ещё нет
2. Реализовать минимальный код для прохождения теста
3. Тест проходит
4. Рефакторинг при необходимости
5. Коммит
```

### Что покрывать E2E тестами

- **Critical path** — регистрация, логин, logout
- **User flows** — основные сценарии использования (CRUD операции)
- **Permissions** — проверка ролей и доступов
- **Edge cases** — ошибки валидации, граничные случаи

### Структура тестов

```
tests/
├── e2e/
│   ├── auth.spec.ts        # Аутентификация
│   ├── contacts.spec.ts    # Контакты (пример)
│   └── ...
├── fixtures/
│   └── test-data.ts        # Тестовые данные
└── playwright.config.ts
```

### Почему Playwright (а не Cypress)

- Официальная рекомендация Vercel/Next.js
- Быстрее (параллельное выполнение)
- Встроенная поддержка API тестов
- Меньше flaky тестов (лучший auto-wait)
- Легче настроить в CI/CD

### Команды для тестирования

```bash
npm run test:e2e          # Запуск всех E2E тестов
npm run test:e2e:ui       # Запуск с UI (debug mode)
npm run test:e2e:headed   # Запуск с видимым браузером
```

### Важно для Claude Code

> **Git commits:**
> - **НИКОГДА** не создавай commit без явного указания пользователя
> - Дождись явной команды типа "создай commit", "закоммить", "сделай commit"
> - Без явного запроса — только вносить изменения в код, но не коммитить

> **При получении задачи на новую фичу:**
> 1. Сначала создай E2E тест в `tests/e2e/`
> 2. Убедись что тест падает (фичи нет)
> 3. Реализуй фичу
> 4. Убедись что тест проходит
> 5. Обнови PROJECT.md если нужно

> **При изменении существующего функционала:**
> 1. Найди тесты которые покрывают изменяемый код
> 2. Запусти их и убедись что они проходят ДО изменений
> 3. Внеси изменения в код
> 4. Обнови тесты если изменилось ожидаемое поведение
> 5. Убедись что все тесты проходят ПОСЛЕ изменений
> 6. Если тесты не найдены — напиши их перед изменением

> **Тесты API endpoints:**
> - Каждый модуль (`users`, `contacts`, `opportunities`) имеет свой файл тестов в `tests/e2e/api/`
> - Тесты покрывают: unauthorized access, CRUD операции, фильтрацию, пагинацию
> - При добавлении нового endpoint — добавь тесты в соответствующий файл

---

## История изменений

### 2025-12-01 (вечер)
- Создана модульная структура `/modules/`:
  - `user/` - модель, типы, валидация, контроллер
  - `contact/` - модель, типы, валидация, контроллер
  - `opportunity/` - модель, типы, валидация, контроллер
- Добавлены REST API endpoints для всех модулей:
  - `/api/users` - CRUD для пользователей
  - `/api/contacts` - CRUD для контактов
  - `/api/opportunities` - CRUD для сделок + статистика
- Добавлены API тесты (50 тестов):
  - `tests/e2e/api/users.spec.ts`
  - `tests/e2e/api/contacts.spec.ts`
  - `tests/e2e/api/opportunities.spec.ts`
- Обновлены инструкции по тестированию в PROJECT.md:
  - Правила при изменении существующего функционала
  - Структура API тестов

### 2025-12-01 (утро)
- Создан файл PROJECT.md для документации проекта
- Зафиксирован начальный технологический стек
- Настроена MongoDB: база `crmproto`, пользователь `crmproto_user`
- Установлен mongoose, создан singleton для подключения (`lib/mongodb.ts`)
- Создан API endpoint `/api/health` для проверки состояния БД
- Реализована система аутентификации:
  - NextAuth.js v5 с Credentials + Google OAuth providers
  - Кастомный Mongoose adapter (из-за конфликта версий mongodb)
  - Модели: User, Account, Session
  - JWT strategy для сессий
  - Middleware для защиты роутов
  - Страница логина `/login` с табами Вход/Регистрация
  - API регистрации `/api/auth/register`
- Настроен Playwright для E2E тестирования:
  - Конфигурация `playwright.config.ts`
  - Структура тестов `tests/e2e/`
  - 10 тестов для auth (регистрация, логин, защита роутов)
  - npm scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:headed`
- Зафиксирована методология "E2E First" в принципах разработки

---

*Этот файл обновляется при каждом сеансе работы над проектом*
