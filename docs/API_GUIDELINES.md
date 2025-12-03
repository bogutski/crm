# API Guidelines

Руководство по разработке API для CRM системы.

## Получение списков (Search Pattern)

**Важное правило**: Для получения списков сущностей используется метод `POST` с endpoint `/search`.

### Почему POST вместо GET?

1. **Сложные фильтры** — легко передавать вложенные объекты, массивы, диапазоны значений
2. **Нет лимита URL** — GET имеет ограничение ~2000 символов
3. **Чище выглядит** — не нужно URL-encode специальных символов
4. **Типизация** — проще валидировать body через Zod схемы

### Паттерн endpoints

| Операция | Метод | Endpoint | Описание |
|----------|-------|----------|----------|
| Поиск/Список | `POST` | `/api/{resource}/search` | Получение списка с фильтрацией |
| Создание | `POST` | `/api/{resource}` | Создание новой сущности |
| Получение | `GET` | `/api/{resource}/:id` | Получение по ID |
| Обновление | `PATCH` | `/api/{resource}/:id` | Частичное обновление |
| Удаление | `DELETE` | `/api/{resource}/:id` | Удаление сущности |

### Примеры

#### Поиск контактов

```typescript
// POST /api/contacts/search
const response = await fetch('/api/contacts/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    search: 'Иван',
    contactType: 'client',
    page: 1,
    limit: 20,
  }),
});
```

#### Поиск пользователей

```typescript
// POST /api/users/search
const response = await fetch('/api/users/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    role: 'manager',
    isActive: true,
    page: 1,
    limit: 20,
  }),
});
```

#### Поиск сделок

```typescript
// POST /api/opportunities/search
const response = await fetch('/api/opportunities/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stage: 'negotiation',
    priority: 'high',
    minValue: 100000,
    maxValue: 500000,
    page: 1,
    limit: 20,
  }),
});
```

#### Поиск словарей

```typescript
// POST /api/dictionaries/search
const response = await fetch('/api/dictionaries/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
});
```

### Структура ответа

Все search endpoints возвращают единообразную структуру:

```typescript
interface SearchResponse<T> {
  [items]: T[];  // contacts, users, opportunities, dictionaries
  total: number;
  page: number;
  limit: number;
}
```

### Параметры пагинации

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `page` | number | 1 | Номер страницы (начиная с 1) |
| `limit` | number | 20-30 | Количество на странице (макс. 100) |

### Валидация

Все параметры фильтрации валидируются через Zod схемы:

- `contactFiltersSchema` — для контактов
- `userFiltersSchema` — для пользователей
- `opportunityFiltersSchema` — для сделок

Схемы находятся в `modules/{module}/validation.ts`.

## CRUD операции

### Создание (POST)

```typescript
// POST /api/contacts
const response = await fetch('/api/contacts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Иван Петров',
    emails: [{ address: 'ivan@example.com' }],
    company: 'ООО Технологии',
  }),
});
// Статус: 201 Created
```

### Получение по ID (GET)

```typescript
// GET /api/contacts/:id
const response = await fetch(`/api/contacts/${id}`);
// Статус: 200 OK или 404 Not Found
```

### Обновление (PATCH)

```typescript
// PATCH /api/contacts/:id
const response = await fetch(`/api/contacts/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    company: 'Новая компания',
  }),
});
// Статус: 200 OK
```

### Удаление (DELETE)

```typescript
// DELETE /api/contacts/:id
const response = await fetch(`/api/contacts/${id}`, {
  method: 'DELETE',
});
// Статус: 200 OK
```

## Аутентификация

Все API endpoints требуют аутентификации через NextAuth.js сессию. Неавторизованные запросы получают:
- Редирект на `/login` для браузерных запросов
- `401 Unauthorized` для API запросов

## Обработка ошибок

```typescript
interface ErrorResponse {
  error: string;
}

// Примеры:
// 401 - { error: 'Unauthorized' }
// 404 - { error: 'Contact not found' }
// 500 - { error: 'Failed to fetch contacts' }
```

## Документация API

OpenAPI документация генерируется автоматически из `routes.meta.ts` файлов. Доступна по адресу `/docs`.
