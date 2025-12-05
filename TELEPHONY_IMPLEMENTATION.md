# Внедрение телефонии в CRM

## Обзор

Интеграция телефонии позволит пользователям совершать и принимать звонки прямо из CRM, автоматически логировать звонки как взаимодействия с контактами, использовать click-to-call из карточки контакта.

### Архитектура

Система использует универсальные сущности и паттерн адаптеров для поддержки разных провайдеров:

```
┌─────────────────────────────────────────────────────────┐
│                      CRM UI                              │
│  (Настройки, Click-to-call, Журнал звонков, Popup)      │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                 Telephony Service                        │
│         (Универсальная бизнес-логика)                   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              Adapter Interface                           │
│    makeCall, hangup, transfer, parseWebhook, etc.       │
└───────┬─────────────────┼─────────────────┬─────────────┘
        │                 │                 │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ Twilio  │       │ Telnyx  │       │ Vonage  │
   │ Adapter │       │ Adapter │       │ Adapter │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                 │                 │
        ▼                 ▼                 ▼
   Twilio API        Telnyx API       Vonage API
```

### Начальные провайдеры

| Провайдер | Приоритет | Причина выбора |
|-----------|-----------|----------------|
| **Telnyx** | 1 | Простой API, низкие цены, своя сеть |
| **Twilio** | 2 | Самый популярный, отличная документация |
| **Vonage** | 3 | API-first подход, хорошая альтернатива |

Дополнительные провайдеры (RingCentral, Dialpad, 8x8, Aircall) будут добавлены позже по мере необходимости.

---

## План внедрения

### Фаза 1: Настройка провайдеров

**Цель:** Пользователь может добавить провайдера, ввести API ключи и проверить подключение.

#### 1.1 Модель данных TelephonyProvider
- [x] Создать `modules/telephony/models/provider.ts` — Mongoose модель
- [x] Создать `modules/telephony/types.ts` — типы и DTO для провайдера
- [x] Создать `modules/telephony/validation.ts` — Zod схемы валидации
- [x] Создать `modules/telephony/index.ts` — barrel экспорт
- [x] **Тест:** Модель создаётся в MongoDB, CRUD работает

```typescript
// Структура TelephonyProvider
{
  code: 'telnyx' | 'twilio' | 'vonage',
  name: string,
  enabled: boolean,
  isActive: boolean,
  credentials: {
    apiKey?: string,
    apiSecret?: string,
    accountSid?: string,
    authToken?: string,
  },
  webhookSecret?: string,
  settings: {
    defaultCallerId?: string,
    recordCalls?: boolean,
  },
  createdAt: Date,
  updatedAt: Date,
}
```

#### 1.2 API для управления провайдерами
- [x] Создать `app/api/telephony/providers/route.ts` — GET список, POST создание
- [x] Создать `app/api/telephony/providers/[id]/route.ts` — GET, PATCH, DELETE
- [x] Создать `app/api/telephony/providers/[id]/activate/route.ts` — POST активация
- [x] **Тест:** API возвращает провайдеров, ключи скрыты (hasApiKey: true)

#### 1.3 Базовые адаптеры (только валидация ключей)
- [x] Создать `lib/telephony/types.ts` — интерфейс ITelephonyAdapter
- [x] Создать `lib/telephony/index.ts` — фабрика getAdapter()
- [x] Создать `lib/telephony/adapters/telnyx.ts` — только validateCredentials()
- [x] Создать `lib/telephony/adapters/twilio.ts` — только validateCredentials()
- [x] Создать `lib/telephony/adapters/vonage.ts` — только validateCredentials()
- [x] Создать `app/api/telephony/providers/[id]/test/route.ts` — POST тест подключения
- [x] **Тест:** Валидация ключей работает для всех трёх провайдеров

#### 1.4 Страница настроек телефонии
- [x] Добавить пункт "Телефония" в `app/settings/components/SettingsNav.tsx`
- [x] Создать `app/settings/telephony/page.tsx` — главная страница
- [x] Создать `app/settings/telephony/components/ProviderCard.tsx` — карточка провайдера
- [x] Создать `app/settings/telephony/components/ProviderForm.tsx` — форма с полями ключей
- [x] Показать статусы: "Активен", "Настроен", "Не настроен"
- [x] Кнопка "Проверить подключение"
- [x] Кнопка "Сделать активным"
- [x] **Тест:** Можно добавить провайдера, ввести ключи, проверить подключение, активировать

---

### Фаза 2: Управление номерами

**Цель:** Пользователь видит номера из аккаунта провайдера и может настроить маршрутизацию.

#### 2.1 Модель данных TelephonyNumber
- [ ] Создать `modules/telephony/models/number.ts` — Mongoose модель
- [ ] Добавить типы в `modules/telephony/types.ts`
- [ ] Добавить схемы в `modules/telephony/validation.ts`
- [ ] **Тест:** Модель создаётся, связь с провайдером работает

```typescript
// Структура TelephonyNumber
{
  provider: ObjectId,
  phoneNumber: string,          // E.164: "+14155551234"
  friendlyName?: string,
  type: 'local' | 'tollfree' | 'mobile',
  country: string,
  capabilities: { voice, sms, mms, fax },
  routing: {
    type: 'user' | 'queue' | 'external',
    userId?: ObjectId,
    externalNumber?: string,
  },
  providerNumberId: string,
  isActive: boolean,
}
```

#### 2.2 Расширение адаптеров — получение номеров
- [ ] Добавить `listNumbers()` в адаптер Telnyx
- [ ] Добавить `listNumbers()` в адаптер Twilio
- [ ] Добавить `listNumbers()` в адаптер Vonage
- [ ] **Тест:** Номера загружаются из аккаунта провайдера

#### 2.3 API номеров
- [ ] Создать `app/api/telephony/numbers/route.ts` — GET список
- [ ] Создать `app/api/telephony/numbers/[id]/route.ts` — GET, PATCH
- [ ] Создать `app/api/telephony/numbers/sync/route.ts` — POST синхронизация
- [ ] **Тест:** Синхронизация номеров работает

#### 2.4 UI управления номерами
- [ ] Создать `app/settings/telephony/numbers/page.tsx`
- [ ] Создать `app/settings/telephony/components/NumbersTable.tsx`
- [ ] Создать `app/settings/telephony/components/NumberRoutingForm.tsx`
- [ ] Кнопка "Синхронизировать номера"
- [ ] **Тест:** Номера отображаются, можно настроить маршрутизацию

---

### Фаза 3: Привязка пользователей

**Цель:** Назначить номера пользователям CRM для исходящих звонков.

#### 3.1 Модель данных TelephonyUser
- [ ] Создать `modules/telephony/models/user.ts` — Mongoose модель
- [ ] Добавить типы в `modules/telephony/types.ts`
- [ ] Добавить схемы в `modules/telephony/validation.ts`
- [ ] **Тест:** Модель создаётся, связи работают

```typescript
// Структура TelephonyUser
{
  user: ObjectId,
  assignedNumbers: ObjectId[],
  primaryNumber?: ObjectId,
  forwardingNumber?: string,
  settings: {
    receiveCallsInBrowser: boolean,
    forwardWhenOffline: boolean,
    voicemailEnabled: boolean,
    dndEnabled: boolean,
  },
  status: 'online' | 'offline' | 'busy' | 'dnd',
}
```

#### 3.2 API пользователей телефонии
- [ ] Создать `app/api/telephony/users/route.ts` — GET список, POST создание
- [ ] Создать `app/api/telephony/users/[id]/route.ts` — GET, PATCH
- [ ] **Тест:** CRUD работает

#### 3.3 UI назначения номеров
- [ ] Создать `app/settings/telephony/users/page.tsx`
- [ ] Создать `app/settings/telephony/components/UserAssignmentForm.tsx`
- [ ] Выбор основного номера для исходящих
- [ ] **Тест:** Можно назначить номера пользователю

---

### Фаза 4: Исходящие звонки

**Цель:** Click-to-call из карточки контакта.

#### 4.1 Модель данных Call
- [ ] Создать `modules/telephony/models/call.ts` — Mongoose модель
- [ ] Добавить типы в `modules/telephony/types.ts`
- [ ] Добавить схемы в `modules/telephony/validation.ts`
- [ ] **Тест:** Модель создаётся

```typescript
// Структура Call
{
  provider: ObjectId,
  providerCallId: string,
  direction: 'inbound' | 'outbound',
  status: 'ringing' | 'in-progress' | 'completed' | 'failed',
  from: string,
  to: string,
  contact?: ObjectId,
  user?: ObjectId,
  initiatedAt: Date,
  answeredAt?: Date,
  endedAt?: Date,
  duration?: number,
  recording?: { url, duration },
  transfers?: [{ timestamp, toNumber, type }],
  notes?: string,
}
```

#### 4.2 Расширение адаптеров — звонки
- [ ] Добавить `makeCall()` в адаптер Telnyx
- [ ] Добавить `makeCall()` в адаптер Twilio
- [ ] Добавить `makeCall()` в адаптер Vonage
- [ ] Добавить `hangup()` в адаптеры
- [ ] **Тест:** Исходящий звонок инициируется

#### 4.3 API звонков
- [ ] Создать `app/api/telephony/calls/route.ts` — GET журнал, POST новый звонок
- [ ] Создать `app/api/telephony/calls/[id]/route.ts` — GET детали
- [ ] Создать `app/api/telephony/calls/[id]/hangup/route.ts` — POST завершить
- [ ] **Тест:** Можно инициировать звонок через API

#### 4.4 Click-to-call UI
- [ ] Создать `app/components/ClickToCall.tsx` — кнопка звонка
- [ ] Добавить в карточку контакта
- [ ] Добавить в таблицу контактов
- [ ] **Тест:** Click-to-call работает

#### 4.5 Виджет активного звонка
- [ ] Создать `app/components/ActiveCallWidget.tsx`
- [ ] Таймер, кнопки mute/hangup
- [ ] Интегрировать в layout
- [ ] **Тест:** Виджет отображается во время звонка

---

### Фаза 5: Входящие звонки

**Цель:** Принимать входящие звонки, показывать popup с информацией о контакте.

#### 5.1 Webhook endpoints
- [ ] Создать `app/api/telephony/webhook/telnyx/route.ts`
- [ ] Создать `app/api/telephony/webhook/twilio/route.ts`
- [ ] Создать `app/api/telephony/webhook/vonage/route.ts`
- [ ] Добавить `parseWebhook()` и `validateWebhook()` в адаптеры
- [ ] **Тест:** Webhook принимает события

#### 5.2 Real-time уведомления
- [ ] Расширить Socket.IO для телефонии
- [ ] Эмитить события: incoming_call, call_answered, call_ended
- [ ] **Тест:** События доходят до клиента

#### 5.3 Popup входящего звонка
- [ ] Создать `app/components/IncomingCallPopup.tsx`
- [ ] Поиск контакта по номеру
- [ ] Кнопки: ответить, отклонить
- [ ] **Тест:** Popup появляется при входящем

---

### Фаза 6: Журнал звонков

**Цель:** Просмотр истории звонков, интеграция с контактами.

#### 6.1 Автоматическое логирование
- [ ] Создавать Call при каждом звонке
- [ ] Привязывать к Contact по номеру
- [ ] Создавать Interaction после завершения
- [ ] **Тест:** Звонки появляются в истории контакта

#### 6.2 Страница журнала
- [ ] Создать `app/calls/page.tsx`
- [ ] Создать `app/calls/components/CallsTable.tsx`
- [ ] Фильтры: направление, статус, дата
- [ ] **Тест:** Журнал работает

#### 6.3 Интеграция с контактами
- [ ] Вкладка "Звонки" в карточке контакта
- [ ] История звонков с контактом
- [ ] **Тест:** История видна в карточке

---

### Фаза 7: Переадресация

**Цель:** Возможность перевести звонок на другого пользователя.

#### 7.1 Расширение адаптеров
- [ ] Добавить `transfer()` в адаптер Telnyx
- [ ] Добавить `transfer()` в адаптер Twilio
- [ ] Добавить `transfer()` в адаптер Vonage
- [ ] **Тест:** Переадресация работает

#### 7.2 API и UI переадресации
- [ ] Создать `app/api/telephony/calls/[id]/transfer/route.ts`
- [ ] Добавить кнопку Transfer в ActiveCallWidget
- [ ] Модальное окно выбора получателя
- [ ] **Тест:** Можно перевести звонок

---

### Фаза 8: Записи звонков

**Цель:** Прослушивание записей звонков.

#### 8.1 Сохранение записей
- [ ] Получать URL записи из webhook
- [ ] Сохранять в модели Call
- [ ] **Тест:** URL записи сохраняется

#### 8.2 UI воспроизведения
- [ ] Создать `app/api/telephony/calls/[id]/recording/route.ts`
- [ ] Добавить аудио-плеер в детали звонка
- [ ] **Тест:** Можно прослушать запись

---

### Фаза 9: Очереди звонков

**Цель:** Распределение входящих между агентами.

#### 9.1 Модель данных CallQueue
- [ ] Создать `modules/telephony/models/queue.ts`
- [ ] **Тест:** Модель создаётся

```typescript
// Структура CallQueue
{
  name: string,
  numbers: ObjectId[],
  members: [{ user: ObjectId, priority: number }],
  strategy: 'round-robin' | 'ring-all',
  settings: { maxWaitTime, holdMusicUrl },
  overflow: { type, target },
}
```

#### 9.2 API и UI очередей
- [ ] Создать `app/api/telephony/queues/route.ts`
- [ ] Создать `app/settings/telephony/queues/page.tsx`
- [ ] **Тест:** Очереди работают

---

### Фаза 10: Голосовая почта

**Цель:** Сохранение и прослушивание голосовых сообщений.

#### 10.1 Модель данных Voicemail
- [ ] Создать `modules/telephony/models/voicemail.ts`
- [ ] **Тест:** Модель создаётся

```typescript
// Структура Voicemail
{
  call: ObjectId,
  user?: ObjectId,
  from: string,
  contact?: ObjectId,
  recordingUrl: string,
  duration: number,
  transcription?: string,
  status: 'new' | 'listened' | 'archived',
}
```

#### 10.2 API и UI голосовой почты
- [ ] Создать `app/api/telephony/voicemails/route.ts`
- [ ] Создать `app/voicemails/page.tsx`
- [ ] **Тест:** Голосовая почта работает

---

### Фаза 11: WebRTC (опционально)

**Цель:** Звонки прямо из браузера без внешнего телефона.

#### 11.1 WebRTC интеграция
- [ ] Настроить SIP credentials
- [ ] Интегрировать WebRTC SDK
- [ ] **Тест:** Звонки в браузере работают

#### 11.2 Softphone UI
- [ ] Создать `app/components/Softphone.tsx`
- [ ] Dialpad, управление микрофоном
- [ ] **Тест:** Softphone работает

---

## Правила работы

1. **Последовательное выполнение** — не переходить к следующей фазе пока текущая не завершена
2. **Сначала модель** — в каждой фазе сначала создаём модель данных, потом API, потом UI
3. **Отметки в чеклисте** — отмечать `[x]` после завершения и успешного теста
4. **Коммиты** — делать коммит после каждой завершённой фазы

---

## Статус

| Фаза | Название | Статус | Прогресс |
|------|----------|--------|----------|
| 1 | Настройка провайдеров | ✅ Завершена | 18/18 |
| 2 | Управление номерами | ⏳ Не начата | 0/12 |
| 3 | Привязка пользователей | ⏳ Не начата | 0/8 |
| 4 | Исходящие звонки | ⏳ Не начата | 0/14 |
| 5 | Входящие звонки | ⏳ Не начата | 0/9 |
| 6 | Журнал звонков | ⏳ Не начата | 0/8 |
| 7 | Переадресация | ⏳ Не начата | 0/6 |
| 8 | Записи звонков | ⏳ Не начата | 0/4 |
| 9 | Очереди звонков | ⏳ Не начата | 0/4 |
| 10 | Голосовая почта | ⏳ Не начата | 0/4 |
| 11 | WebRTC | ⏳ Не начата | 0/4 |

**Общий прогресс:** 18/91 задач

---

## Ссылки

- [Telnyx API Docs](https://developers.telnyx.com/)
- [Twilio API Docs](https://www.twilio.com/docs)
- [Vonage API Docs](https://developer.vonage.com/)
