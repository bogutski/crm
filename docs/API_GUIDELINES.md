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

## Специальные endpoints

Помимо стандартных CRUD операций, API предоставляет специальные endpoints для получения статистики и аналитики.

### Статистика сделок

Получение агрегированной статистики по сделкам с группировкой по стадиям.

```typescript
// GET /api/opportunities/stats?pipelineId=xxx (опционально)
const response = await fetch('/api/opportunities/stats');

// Ответ:
interface OpportunitiesStats {
  total: number;           // Общее количество сделок
  totalAmount: number;     // Общая сумма всех сделок
  byStage: {               // Статистика по стадиям
    [stageName: string]: {
      count: number;       // Количество сделок в стадии
      amount: number;      // Сумма сделок в стадии
    };
  };
}
```

### Аналитика воронки

Детальная аналитика по конкретной воронке продаж.

```typescript
// GET /api/pipelines/:id/analytics
const response = await fetch(`/api/pipelines/${pipelineId}/analytics`);

// Ответ:
interface PipelineAnalytics {
  pipeline: {
    id: string;
    name: string;
  };
  stages: Array<{
    id: string;
    name: string;
    count: number;         // Количество сделок в стадии
    totalAmount: number;   // Сумма сделок в стадии
    avgAmount: number;     // Средняя сумма сделки в стадии
  }>;
  totalOpportunities: number; // Общее количество сделок в воронке
}
```

### Количество задач по статусам

Получение количества задач по каждому статусу.

```typescript
// POST /api/tasks/counts
const response = await fetch('/api/tasks/counts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // Опциональные фильтры:
    search: 'текст',
    priorityId: 'xxx',
    assigneeId: 'xxx',
    ownerId: 'xxx',
    entityType: 'contact',
    entityId: 'xxx',
    dueDateFrom: '2024-01-01',
    dueDateTo: '2024-12-31',
  }),
});

// Ответ:
interface TaskCounts {
  open: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  overdue: number;
}
```

## Аутентификация API

### Сессионная аутентификация

Для браузерных запросов используется NextAuth.js сессия. Неавторизованные запросы получают:
- Редирект на `/login` для браузерных запросов
- `401 Unauthorized` для API запросов

### API Токены

Для внешних интеграций (MCP сервер, внешние системы) используются API токены:

```typescript
// Запрос с API токеном
const response = await fetch('/api/contacts/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_TOKEN',
  },
  body: JSON.stringify({ search: 'Иван' }),
});
```

API токены создаются в настройках системы (`/settings/api`).

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

## MCP Server

CRM предоставляет MCP (Model Context Protocol) сервер для интеграции с AI-клиентами (Claude Desktop, Cursor и др.).

### Endpoints MCP

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/mcp` | GET | Информация о сервере и список инструментов |
| `/api/mcp/sse` | GET | SSE соединение для MCP клиентов |
| `/api/mcp/messages` | POST | Обработка MCP сообщений |

### Аутентификация MCP

MCP сервер требует Bearer токен авторизации:

```
Authorization: Bearer YOUR_API_TOKEN
```

### Доступные инструменты MCP (46 инструментов)

**Контакты (5):**
- `search_contacts` — Поиск контактов по имени, email, телефону
- `get_contact_details` — Получение подробной информации о контакте
- `create_contact` — Создание нового контакта
- `update_contact` — Обновление данных контакта
- `delete_contact` — Удаление контакта

**Сделки (8):**
- `search_opportunities` — Поиск сделок по названию, контакту, стадии
- `get_opportunity_details` — Получение информации о сделке
- `get_opportunities_stats` — Статистика по сделкам (суммы, количество по стадиям)
- `create_opportunity` — Создание новой сделки
- `update_opportunity` — Обновление данных сделки
- `update_opportunity_stage` — Перемещение сделки на другую стадию воронки
- `delete_opportunity` — Удаление сделки
- `archive_opportunity` — Архивация/разархивация сделки

**Задачи (8):**
- `get_tasks_overview` — Обзор задач с количеством по статусам
- `get_task_details` — Получение информации о задаче
- `get_tasks_by_contact` — Получить задачи, привязанные к контакту
- `get_tasks_by_project` — Получить задачи, привязанные к проекту
- `create_task` — Создание новой задачи
- `update_task` — Обновление данных задачи
- `update_task_status` — Изменение статуса задачи
- `delete_task` — Удаление задачи

**Взаимодействия (7):**
- `search_interactions` — Поиск взаимодействий (звонки, письма, встречи)
- `get_interaction_details` — Получение информации о взаимодействии
- `get_interaction_stats` — Статистика взаимодействий по контакту
- `get_interactions_by_contact` — Все взаимодействия с контактом
- `create_interaction` — Создание записи о взаимодействии с контактом
- `update_interaction` — Обновление взаимодействия
- `delete_interaction` — Удаление взаимодействия

**Воронки (6):**
- `get_pipelines` — Список всех воронок продаж
- `get_pipeline_stages` — Стадии конкретной воронки
- `get_pipeline_analytics` — Аналитика воронки (количество и суммы по стадиям)
- `get_default_pipeline` — Получить воронку по умолчанию со стадиями
- `get_pipeline_by_code` — Получить воронку по коду
- `get_initial_stage` — Получить начальную стадию воронки

**Справочники (3):**
- `get_dictionaries` — Список всех справочников системы
- `get_dictionary_items` — Элементы справочника по его коду
- `get_dictionary_item_by_code` — Элемент справочника по коду

**Каналы (1):**
- `get_channels` — Список каналов коммуникации

**Пользователи (3):**
- `search_users` — Поиск пользователей CRM
- `get_user_details` — Информация о пользователе
- `update_user` — Обновление данных пользователя (имя, email, аватар)

**Проекты (5):**
- `search_projects` — Поиск проектов
- `get_project_details` — Информация о проекте
- `create_project` — Создание проекта
- `update_project` — Обновление проекта
- `delete_project` — Удаление проекта

Подробная информация о MCP сервере и схема параметров каждого инструмента доступна по адресу `/api/mcp`.

## Документация API

OpenAPI документация генерируется автоматически из `routes.meta.ts` файлов. Доступна по адресу `/docs`.
