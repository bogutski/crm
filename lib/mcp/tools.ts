/**
 * MCP Tools definitions and handlers
 * These tools are exposed via the MCP server endpoint
 * All tools use internal REST API calls for consistency
 *
 * For internal calls (from AI streaming tools), pass userId as apiToken
 * and set INTERNAL_USER_TOKEN to use session-based auth instead of Bearer token
 */

export const INTERNAL_USER_TOKEN = '__internal_user__';

// Tool definitions for MCP
export const MCP_TOOLS = [
  // ==================== КОНТАКТЫ (Клиенты, Лиды, Покупатели) ====================
  {
    name: 'search_contacts',
    description: 'Поиск клиентов/лидов в CRM. Контакты — это потенциальные или текущие клиенты (не сотрудники!). Поиск по имени, email, телефону, компании, адресу.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Поисковый запрос (имя, email, телефон, компания или адрес)',
        },
        city: {
          type: 'string',
          description: 'Фильтр по городу',
        },
        country: {
          type: 'string',
          description: 'Фильтр по коду страны ISO (RU, US, KZ и т.д.) - ищет в адресах и телефонах',
        },
        limit: {
          type: 'number',
          description: 'Максимальное количество результатов (по умолчанию: 10)',
        },
      },
    },
  },
  {
    name: 'get_contact_details',
    description: 'Подробная карточка клиента. Вся информация о контакте: данные, история взаимодействий, связанные сделки.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        contactId: {
          type: 'string',
          description: 'ID контакта',
        },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'create_contact',
    description: 'Добавить нового клиента/лида. Создаёт карточку контакта с данными (имя, компания, телефон, email, адрес).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Имя контакта (обязательно)',
        },
        company: {
          type: 'string',
          description: 'Название компании',
        },
        position: {
          type: 'string',
          description: 'Должность',
        },
        email: {
          type: 'string',
          description: 'Email адрес',
        },
        phone: {
          type: 'string',
          description: 'Номер телефона',
        },
        address: {
          type: 'object',
          description: 'Адрес контакта',
          properties: {
            line1: { type: 'string', description: 'Улица, дом' },
            line2: { type: 'string', description: 'Квартира, офис' },
            city: { type: 'string', description: 'Город' },
            state: { type: 'string', description: 'Область/регион' },
            zip: { type: 'string', description: 'Почтовый индекс' },
            country: { type: 'string', description: 'Код страны ISO (RU, US, KZ)' },
          },
        },
        contactTypeId: {
          type: 'string',
          description: 'ID типа контакта из словаря',
        },
        sourceId: {
          type: 'string',
          description: 'ID источника из словаря',
        },
        notes: {
          type: 'string',
          description: 'Заметки о контакте',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_contact',
    description: 'Обновить данные клиента. Изменить информацию в карточке контакта.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        contactId: {
          type: 'string',
          description: 'ID контакта (обязательно)',
        },
        name: {
          type: 'string',
          description: 'Новое имя контакта',
        },
        company: {
          type: 'string',
          description: 'Название компании',
        },
        position: {
          type: 'string',
          description: 'Должность',
        },
        notes: {
          type: 'string',
          description: 'Заметки о контакте',
        },
      },
      required: ['contactId'],
    },
  },

  // ==================== СДЕЛКИ (Продажи, Заказы, Opportunities) ====================
  {
    name: 'search_opportunities',
    description: 'Поиск сделок/продаж. Сделки — это потенциальные или активные продажи с суммой и этапом в воронке. Возвращает owner (ответственный менеджер) и stage.isWon для определения успешных сделок.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Поисковый запрос (название или имя контакта)',
        },
        contactId: {
          type: 'string',
          description: 'Фильтр по ID контакта — показать все сделки этого клиента',
        },
        ownerId: {
          type: 'string',
          description: 'Фильтр по ID ответственного менеджера',
        },
        stageId: {
          type: 'string',
          description: 'Фильтр по ID стадии воронки',
        },
        pipelineId: {
          type: 'string',
          description: 'Фильтр по ID воронки',
        },
        minAmount: {
          type: 'number',
          description: 'Минимальная сумма сделки',
        },
        maxAmount: {
          type: 'number',
          description: 'Максимальная сумма сделки',
        },
        closingDateFrom: {
          type: 'string',
          description: 'Дата закрытия от (ISO дата, например 2024-01-01)',
        },
        closingDateTo: {
          type: 'string',
          description: 'Дата закрытия до (ISO дата)',
        },
        limit: {
          type: 'number',
          description: 'Максимальное количество результатов (по умолчанию: 10)',
        },
      },
    },
  },
  {
    name: 'get_opportunity_details',
    description: 'Подробности сделки. Полная информация: сумма, этап воронки, связанный клиент, история.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        opportunityId: {
          type: 'string',
          description: 'ID сделки',
        },
      },
      required: ['opportunityId'],
    },
  },
  {
    name: 'get_opportunities_stats',
    description: 'Статистика продаж. Аналитика: количество сделок, общая сумма, распределение по этапам воронки. Включает статистику по менеджерам (byOwner): общее количество сделок, сумма, количество выигранных (won) и их сумма (wonAmount).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pipelineId: {
          type: 'string',
          description: 'Фильтр по конкретной воронке (опционально)',
        },
      },
    },
  },
  {
    name: 'create_opportunity',
    description: 'Создать сделку/продажу. Новая сделка с привязкой к клиенту и воронке продаж.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Название сделки (обязательно)',
        },
        amount: {
          type: 'number',
          description: 'Сумма сделки',
        },
        contactId: {
          type: 'string',
          description: 'ID контакта для привязки',
        },
        pipelineId: {
          type: 'string',
          description: 'ID воронки (если не указан, используется воронка по умолчанию)',
        },
        stageId: {
          type: 'string',
          description: 'ID стадии (если не указан, используется начальная стадия)',
        },
        expectedCloseDate: {
          type: 'string',
          description: 'Ожидаемая дата закрытия в формате ISO',
        },
        notes: {
          type: 'string',
          description: 'Заметки о сделке',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_opportunity',
    description: 'Обновить сделку. Изменить название, сумму, дату закрытия или заметки.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        opportunityId: {
          type: 'string',
          description: 'ID сделки (обязательно)',
        },
        name: {
          type: 'string',
          description: 'Новое название сделки',
        },
        amount: {
          type: 'number',
          description: 'Новая сумма сделки',
        },
        expectedCloseDate: {
          type: 'string',
          description: 'Новая ожидаемая дата закрытия',
        },
        notes: {
          type: 'string',
          description: 'Заметки о сделке',
        },
      },
      required: ['opportunityId'],
    },
  },
  {
    name: 'update_opportunity_stage',
    description: 'Переместить сделку по воронке. Изменить этап продажи (например: "Новая" → "В работе" → "Выиграна").',
    inputSchema: {
      type: 'object' as const,
      properties: {
        opportunityId: {
          type: 'string',
          description: 'ID сделки',
        },
        stageId: {
          type: 'string',
          description: 'ID новой стадии',
        },
      },
      required: ['opportunityId', 'stageId'],
    },
  },

  // ==================== ЗАДАЧИ (Дела, To-do, Напоминания) ====================
  {
    name: 'get_tasks_overview',
    description: 'Обзор задач/дел. Статистика и список задач: открытые, в работе, выполненные, просроченные. Можно фильтровать по исполнителю, создателю и датам.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['open', 'in_progress', 'completed', 'cancelled'],
          description: 'Фильтр по статусу задачи',
        },
        assigneeId: {
          type: 'string',
          description: 'Фильтр по ID исполнителя (на кого назначена задача)',
        },
        ownerId: {
          type: 'string',
          description: 'Фильтр по ID создателя задачи',
        },
        dueDateFrom: {
          type: 'string',
          description: 'Срок выполнения от (ISO дата, например 2024-01-01)',
        },
        dueDateTo: {
          type: 'string',
          description: 'Срок выполнения до (ISO дата)',
        },
        overdue: {
          type: 'boolean',
          description: 'Показать только просроченные задачи (срок прошёл, задача не завершена)',
        },
        limit: {
          type: 'number',
          description: 'Максимальное количество задач (по умолчанию: 10)',
        },
      },
    },
  },
  {
    name: 'get_task_details',
    description: 'Подробности задачи. Описание, срок, приоритет, исполнитель, связанный клиент или сделка.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        taskId: {
          type: 'string',
          description: 'ID задачи',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'create_task',
    description: 'Создать задачу/напоминание. Новое дело с дедлайном, приоритетом и привязкой к клиенту или сделке.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Название задачи (обязательно)',
        },
        description: {
          type: 'string',
          description: 'Описание задачи',
        },
        dueDate: {
          type: 'string',
          description: 'Срок выполнения в формате ISO (например, 2024-12-31)',
        },
        priorityId: {
          type: 'string',
          description: 'ID приоритета задачи из словаря',
        },
        contactId: {
          type: 'string',
          description: 'Привязать задачу к контакту',
        },
        opportunityId: {
          type: 'string',
          description: 'Привязать задачу к сделке',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: 'Обновить задачу. Изменить описание, срок выполнения или приоритет.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        taskId: {
          type: 'string',
          description: 'ID задачи (обязательно)',
        },
        title: {
          type: 'string',
          description: 'Новое название задачи',
        },
        description: {
          type: 'string',
          description: 'Новое описание задачи',
        },
        dueDate: {
          type: 'string',
          description: 'Новый срок выполнения',
        },
        priorityId: {
          type: 'string',
          description: 'Новый ID приоритета',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'update_task_status',
    description: 'Изменить статус задачи. Установить: открыта (open), в работе (in_progress), выполнена (completed) или отменена (cancelled).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        taskId: {
          type: 'string',
          description: 'ID задачи',
        },
        status: {
          type: 'string',
          enum: ['open', 'in_progress', 'completed', 'cancelled'],
          description: 'Новый статус задачи',
        },
      },
      required: ['taskId', 'status'],
    },
  },
  {
    name: 'delete_task',
    description: 'Удалить задачу. Полное удаление задачи из системы.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        taskId: {
          type: 'string',
          description: 'ID задачи для удаления',
        },
      },
      required: ['taskId'],
    },
  },

  // ==================== ВЗАИМОДЕЙСТВИЯ (Коммуникации, История общения) ====================
  {
    name: 'search_interactions',
    description: 'Поиск коммуникаций. История общения с клиентами: звонки, письма, встречи, сообщения.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        contactId: {
          type: 'string',
          description: 'Фильтр по ID контакта',
        },
        channelId: {
          type: 'string',
          description: 'Фильтр по ID канала',
        },
        direction: {
          type: 'string',
          enum: ['inbound', 'outbound'],
          description: 'Фильтр по направлению',
        },
        limit: {
          type: 'number',
          description: 'Максимальное количество результатов (по умолчанию: 20)',
        },
      },
    },
  },
  {
    name: 'create_interaction',
    description: 'Записать коммуникацию. Добавить в историю: звонок, письмо, встречу или сообщение с клиентом.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        contactId: {
          type: 'string',
          description: 'ID контакта (обязательно)',
        },
        channelId: {
          type: 'string',
          description: 'ID канала взаимодействия (обязательно)',
        },
        subject: {
          type: 'string',
          description: 'Тема или заголовок взаимодействия',
        },
        content: {
          type: 'string',
          description: 'Содержание взаимодействия (обязательно)',
        },
        direction: {
          type: 'string',
          enum: ['inbound', 'outbound'],
          description: 'Направление взаимодействия (обязательно)',
        },
      },
      required: ['contactId', 'channelId', 'direction', 'content'],
    },
  },

  // ==================== ВОРОНКИ (Этапы продаж, Pipeline) ====================
  {
    name: 'get_pipelines',
    description: 'Список воронок продаж. Все воронки (pipeline) — последовательности этапов для ведения сделок.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_pipeline_stages',
    description: 'Этапы воронки. Все стадии конкретной воронки продаж (например: Новая → Переговоры → Выиграна).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pipelineId: {
          type: 'string',
          description: 'ID воронки (обязательно)',
        },
      },
      required: ['pipelineId'],
    },
  },
  {
    name: 'get_pipeline_analytics',
    description: 'Аналитика воронки. Количество сделок и суммы на каждом этапе — для анализа конверсии.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pipelineId: {
          type: 'string',
          description: 'ID воронки (опционально, используется воронка по умолчанию)',
        },
      },
    },
  },

  // ==================== СПРАВОЧНИКИ (Словари, Настройки) ====================
  {
    name: 'get_dictionaries',
    description: 'Список справочников. Все справочники системы: типы контактов, источники, приоритеты задач и др.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_dictionary_items',
    description: 'Элементы справочника. Значения из справочника (например, все приоритеты: низкий, средний, высокий).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        dictionaryCode: {
          type: 'string',
          description: 'Код справочника (например: contact_types, task_priorities, sources)',
        },
      },
      required: ['dictionaryCode'],
    },
  },

  // ==================== КАНАЛЫ (Способы связи) ====================
  {
    name: 'get_channels',
    description: 'Каналы связи. Способы коммуникации с клиентами: телефон, email, мессенджеры, встречи.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },

  // ==================== КОНТАКТЫ (дополнительно) ====================
  {
    name: 'delete_contact',
    description: 'Удалить клиента из базы. Полное удаление карточки контакта и связей.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        contactId: {
          type: 'string',
          description: 'ID контакта для удаления',
        },
      },
      required: ['contactId'],
    },
  },

  // ==================== СДЕЛКИ (дополнительно) ====================
  {
    name: 'delete_opportunity',
    description: 'Удалить сделку. Полное удаление сделки из системы.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        opportunityId: {
          type: 'string',
          description: 'ID сделки для удаления',
        },
      },
      required: ['opportunityId'],
    },
  },
  {
    name: 'archive_opportunity',
    description: 'Архивировать сделку. Скрыть неактивную сделку из основного списка без удаления.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        opportunityId: {
          type: 'string',
          description: 'ID сделки',
        },
        archived: {
          type: 'boolean',
          description: 'true - архивировать, false - разархивировать',
        },
      },
      required: ['opportunityId'],
    },
  },

  // ==================== ВЗАИМОДЕЙСТВИЯ (дополнительно) ====================
  {
    name: 'get_interaction_details',
    description: 'Детали коммуникации. Полная информация о звонке, письме или встрече.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        interactionId: {
          type: 'string',
          description: 'ID взаимодействия',
        },
      },
      required: ['interactionId'],
    },
  },
  {
    name: 'update_interaction',
    description: 'Обновить запись коммуникации. Изменить тему, содержание или статус.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        interactionId: {
          type: 'string',
          description: 'ID взаимодействия (обязательно)',
        },
        subject: {
          type: 'string',
          description: 'Новая тема взаимодействия',
        },
        content: {
          type: 'string',
          description: 'Новое содержание взаимодействия',
        },
        status: {
          type: 'string',
          enum: ['pending', 'completed', 'cancelled'],
          description: 'Новый статус взаимодействия',
        },
      },
      required: ['interactionId'],
    },
  },
  {
    name: 'delete_interaction',
    description: 'Удалить коммуникацию. Удалить запись из истории общения.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        interactionId: {
          type: 'string',
          description: 'ID взаимодействия для удаления',
        },
      },
      required: ['interactionId'],
    },
  },
  {
    name: 'get_interaction_stats',
    description: 'Статистика коммуникаций. Количество взаимодействий по каналам и направлениям.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        contactId: {
          type: 'string',
          description: 'ID контакта',
        },
      },
      required: ['contactId'],
    },
  },

  // ==================== ПОЛЬЗОВАТЕЛИ (Менеджеры, Сотрудники, Администраторы) ====================
  {
    name: 'search_users',
    description: 'Поиск сотрудников/менеджеров. Пользователи системы — это сотрудники компании (НЕ клиенты!). Роли: admin, manager, user. Используй для назначения ответственных.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Поисковый запрос (имя или email)',
        },
        role: {
          type: 'string',
          description: 'Фильтр по роли (admin, manager, user)',
        },
        isActive: {
          type: 'boolean',
          description: 'Фильтр по активности',
        },
        limit: {
          type: 'number',
          description: 'Максимальное количество результатов (по умолчанию: 10)',
        },
      },
    },
  },
  {
    name: 'get_user_details',
    description: 'Информация о сотруднике. Данные пользователя системы: имя, email, роль, активность.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        userId: {
          type: 'string',
          description: 'ID пользователя',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'update_user',
    description: 'Обновить данные сотрудника. Изменить имя, email или аватар пользователя (кроме админов).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        userId: {
          type: 'string',
          description: 'ID пользователя (обязательно)',
        },
        name: {
          type: 'string',
          description: 'Новое имя пользователя',
        },
        email: {
          type: 'string',
          description: 'Новый email пользователя',
        },
        image: {
          type: 'string',
          description: 'URL аватара пользователя',
        },
      },
      required: ['userId'],
    },
  },

  // ==================== ПРОЕКТЫ ====================
  {
    name: 'search_projects',
    description: 'Поиск проектов. Проекты — контейнеры для группировки задач и работ по направлениям.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Поисковый запрос (название или описание)',
        },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'on_hold', 'cancelled'],
          description: 'Фильтр по статусу проекта',
        },
        ownerId: {
          type: 'string',
          description: 'Фильтр по владельцу проекта',
        },
        limit: {
          type: 'number',
          description: 'Максимальное количество результатов (по умолчанию: 10)',
        },
      },
    },
  },
  {
    name: 'get_project_details',
    description: 'Подробности проекта. Описание, статус, дедлайн, владелец и связанные задачи.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: {
          type: 'string',
          description: 'ID проекта',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_project',
    description: 'Создать проект. Новый проект для организации задач и работ.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Название проекта (обязательно)',
        },
        description: {
          type: 'string',
          description: 'Описание проекта',
        },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'on_hold', 'cancelled'],
          description: 'Статус проекта (по умолчанию: active)',
        },
        deadline: {
          type: 'string',
          description: 'Дедлайн проекта в формате ISO',
        },
        ownerId: {
          type: 'string',
          description: 'ID владельца проекта',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_project',
    description: 'Обновить проект. Изменить название, описание, статус или дедлайн.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: {
          type: 'string',
          description: 'ID проекта (обязательно)',
        },
        name: {
          type: 'string',
          description: 'Новое название проекта',
        },
        description: {
          type: 'string',
          description: 'Новое описание проекта',
        },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'on_hold', 'cancelled'],
          description: 'Новый статус проекта',
        },
        deadline: {
          type: 'string',
          description: 'Новый дедлайн проекта',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'delete_project',
    description: 'Удалить проект. Полное удаление проекта из системы.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: {
          type: 'string',
          description: 'ID проекта для удаления',
        },
      },
      required: ['projectId'],
    },
  },

  // ==================== ДОПОЛНИТЕЛЬНЫЕ ИНСТРУМЕНТЫ ====================
  {
    name: 'get_tasks_by_contact',
    description: 'Задачи по клиенту. Все задачи, связанные с конкретным контактом.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        contactId: {
          type: 'string',
          description: 'ID контакта',
        },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'get_tasks_by_project',
    description: 'Задачи по проекту. Все задачи в рамках конкретного проекта.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: {
          type: 'string',
          description: 'ID проекта',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_default_pipeline',
    description: 'Основная воронка. Воронка по умолчанию со всеми этапами продаж.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_pipeline_by_code',
    description: 'Воронка по коду. Найти воронку по системному коду (например: sales, leads).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        code: {
          type: 'string',
          description: 'Код воронки (например: sales, leads)',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'get_initial_stage',
    description: 'Начальный этап воронки. Первая стадия, на которую попадают новые сделки.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        pipelineId: {
          type: 'string',
          description: 'ID воронки',
        },
      },
      required: ['pipelineId'],
    },
  },
  {
    name: 'get_interactions_by_contact',
    description: 'История общения с клиентом. Все коммуникации с конкретным контактом: звонки, письма, встречи.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        contactId: {
          type: 'string',
          description: 'ID контакта',
        },
        limit: {
          type: 'number',
          description: 'Максимальное количество результатов (по умолчанию: 50)',
        },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'get_dictionary_item_by_code',
    description: 'Найти значение в справочнике. Конкретный элемент по кодам справочника и элемента.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        dictionaryCode: {
          type: 'string',
          description: 'Код справочника (например: contact_types, task_priorities)',
        },
        itemCode: {
          type: 'string',
          description: 'Код элемента справочника',
        },
      },
      required: ['dictionaryCode', 'itemCode'],
    },
  },
];

/**
 * Helper to make internal API calls
 * Uses the API token for authentication
 * For internal calls, use INTERNAL_USER_TOKEN as apiToken to skip Bearer auth
 */
async function apiCall(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  apiToken: string,
  body?: unknown,
  userId?: string
): Promise<unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}${path}`;

  // For internal calls, we use a special header to pass userId
  // This allows the API to authenticate via internal mechanism
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiToken === INTERNAL_USER_TOKEN && userId) {
    // Internal call - use X-Internal-User-Id header
    headers['X-Internal-User-Id'] = userId;
  } else {
    // External call - use Bearer token
    headers['Authorization'] = `Bearer ${apiToken}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API call failed: ${response.status}`);
  }

  return response.json();
}

// Tool handlers
export async function handleMCPToolCall(
  name: string,
  args: Record<string, unknown>,
  userId: string,
  apiToken: string
): Promise<unknown> {
  console.log(`[MCP Tools] handleMCPToolCall: ${name}`, { args, userId, isInternal: apiToken === INTERNAL_USER_TOKEN });

  // Create a wrapper for apiCall that includes apiToken and userId for internal calls
  const api = async (
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown
  ) => {
    console.log(`[MCP Tools] API call: ${method} ${path}`);
    const result = await apiCall(method, path, apiToken, body, userId);
    console.log(`[MCP Tools] API call completed: ${method} ${path}`);
    return result;
  };

  switch (name) {
    // ==================== КОНТАКТЫ ====================
    case 'search_contacts': {
      const { query, city, country, limit = 10 } = args as {
        query?: string;
        city?: string;
        country?: string;
        limit?: number;
      };
      const result = await api('POST', '/api/contacts/search', {
        search: query,
        city,
        country,
        limit,
        page: 1,
      }) as { total: number; contacts: Array<{
        id: string;
        name: string;
        company?: string;
        position?: string;
        emails?: Array<{ address: string }>;
        phones?: Array<{ international?: string; e164?: string; country?: string }>;
        addresses?: Array<{ city?: string; country?: string; line1?: string }>;
      }> };

      return {
        success: true,
        total: result.total,
        contacts: result.contacts.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company,
          position: c.position,
          emails: c.emails?.map((e) => e.address).filter(Boolean) || [],
          phones: c.phones?.map((p) => p.international || p.e164).filter(Boolean) || [],
          addresses: c.addresses?.map((a) => [a.line1, a.city, a.country].filter(Boolean).join(', ')).filter(Boolean) || [],
        })),
      };
    }

    case 'get_contact_details': {
      const { contactId } = args as { contactId: string };
      const contact = await api('GET', `/api/contacts/${contactId}`);

      if (!contact) {
        throw new Error('Контакт не найден');
      }
      return { success: true, contact };
    }

    case 'create_contact': {
      const { name, company, position, email, phone, address, contactTypeId, sourceId, notes } = args as {
        name: string;
        company?: string;
        position?: string;
        email?: string;
        phone?: string;
        address?: {
          line1?: string;
          line2?: string;
          city?: string;
          state?: string;
          zip?: string;
          country?: string;
        };
        contactTypeId?: string;
        sourceId?: string;
        notes?: string;
      };

      const contactData: Record<string, unknown> = { name };
      if (company) contactData.company = company;
      if (position) contactData.position = position;
      if (email) contactData.emails = [{ address: email, isPrimary: true }];
      if (phone) contactData.phones = [{ original: phone, isPrimary: true }];
      if (address) contactData.addresses = [{ ...address, isPrimary: true }];
      if (contactTypeId) contactData.contactTypeId = contactTypeId;
      if (sourceId) contactData.sourceId = sourceId;
      if (notes) contactData.notes = notes;

      const contact = await api('POST', '/api/contacts', contactData) as {
        id: string;
        name: string;
      };

      return { success: true, contact: { id: contact.id, name: contact.name } };
    }

    case 'update_contact': {
      const { contactId, name, company, position, notes } = args as {
        contactId: string;
        name?: string;
        company?: string;
        position?: string;
        notes?: string;
      };

      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name;
      if (company !== undefined) updateData.company = company;
      if (position !== undefined) updateData.position = position;
      if (notes !== undefined) updateData.notes = notes;

      const contact = await api('PATCH', `/api/contacts/${contactId}`, updateData) as {
        id: string;
        name: string;
      };

      return { success: true, contact: { id: contact.id, name: contact.name } };
    }

    // ==================== СДЕЛКИ ====================
    case 'search_opportunities': {
      const { query, contactId, ownerId, stageId, pipelineId, minAmount, maxAmount, closingDateFrom, closingDateTo, limit = 10 } = args as {
        query?: string;
        contactId?: string;
        ownerId?: string;
        stageId?: string;
        pipelineId?: string;
        minAmount?: number;
        maxAmount?: number;
        closingDateFrom?: string;
        closingDateTo?: string;
        limit?: number;
      };
      const result = await api('POST', '/api/opportunities/search', {
        search: query,
        contactId,
        ownerId,
        stageId,
        pipelineId,
        minAmount,
        maxAmount,
        closingDateFrom,
        closingDateTo,
        limit,
        page: 1,
      }) as { total: number; totalAmount: number; opportunities: Array<{
        id: string;
        name: string;
        amount?: number;
        stage?: { id: string; name: string; isWon?: boolean; isFinal?: boolean };
        contact?: { id: string; name: string };
        owner?: { id: string; name: string; email?: string };
      }> };

      return {
        success: true,
        total: result.total,
        totalAmount: result.totalAmount,
        opportunities: result.opportunities.map((o) => ({
          id: o.id,
          name: o.name,
          amount: o.amount,
          stage: o.stage ? { id: o.stage.id, name: o.stage.name, isWon: o.stage.isWon, isFinal: o.stage.isFinal } : null,
          contact: o.contact ? { id: o.contact.id, name: o.contact.name } : null,
          owner: o.owner ? { id: o.owner.id, name: o.owner.name } : null,
        })),
      };
    }

    case 'get_opportunity_details': {
      const { opportunityId } = args as { opportunityId: string };
      const opportunity = await api('GET', `/api/opportunities/${opportunityId}`);

      if (!opportunity) {
        throw new Error('Сделка не найдена');
      }
      return { success: true, opportunity };
    }

    case 'get_opportunities_stats': {
      const { pipelineId } = args as { pipelineId?: string };
      const queryParam = pipelineId ? `?pipelineId=${pipelineId}` : '';
      const stats = await api('GET', `/api/opportunities/stats${queryParam}`);

      return { success: true, stats };
    }

    case 'create_opportunity': {
      const { name, amount, contactId, pipelineId, stageId, expectedCloseDate, notes } = args as {
        name: string;
        amount?: number;
        contactId?: string;
        pipelineId?: string;
        stageId?: string;
        expectedCloseDate?: string;
        notes?: string;
      };

      const oppData: Record<string, unknown> = { name };
      if (amount !== undefined) oppData.amount = amount;
      if (contactId) oppData.contactId = contactId;
      if (pipelineId) oppData.pipelineId = pipelineId;
      if (stageId) oppData.stageId = stageId;
      if (expectedCloseDate) oppData.expectedCloseDate = expectedCloseDate;
      if (notes) oppData.notes = notes;

      const opportunity = await api('POST', '/api/opportunities', oppData) as {
        id: string;
        name: string;
        amount?: number;
      };

      return { success: true, opportunity: { id: opportunity.id, name: opportunity.name, amount: opportunity.amount } };
    }

    case 'update_opportunity': {
      const { opportunityId, name, amount, expectedCloseDate, notes } = args as {
        opportunityId: string;
        name?: string;
        amount?: number;
        expectedCloseDate?: string;
        notes?: string;
      };

      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name;
      if (amount !== undefined) updateData.amount = amount;
      if (expectedCloseDate !== undefined) updateData.expectedCloseDate = expectedCloseDate;
      if (notes !== undefined) updateData.notes = notes;

      const opportunity = await api('PATCH', `/api/opportunities/${opportunityId}`, updateData) as {
        id: string;
        name: string;
        amount?: number;
      };

      return { success: true, opportunity: { id: opportunity.id, name: opportunity.name, amount: opportunity.amount } };
    }

    case 'update_opportunity_stage': {
      const { opportunityId, stageId } = args as { opportunityId: string; stageId: string };
      const opportunity = await api('PATCH', `/api/opportunities/${opportunityId}`, {
        stageId,
      }) as { id: string; name: string; stage?: { name: string } } | null;

      if (!opportunity) {
        throw new Error('Сделка не найдена');
      }
      return {
        success: true,
        opportunity: { id: opportunity.id, name: opportunity.name, stage: opportunity.stage?.name },
      };
    }

    // ==================== ЗАДАЧИ ====================
    case 'get_tasks_overview': {
      const { status, assigneeId, ownerId, dueDateFrom, dueDateTo, overdue, limit = 10 } = args as {
        status?: string;
        assigneeId?: string;
        ownerId?: string;
        dueDateFrom?: string;
        dueDateTo?: string;
        overdue?: boolean;
        limit?: number;
      };

      const filters = { assigneeId, ownerId, dueDateFrom, dueDateTo };

      const counts = await api('POST', '/api/tasks/counts', filters) as {
        open: number;
        in_progress: number;
        completed: number;
        cancelled: number;
        overdue: number;
      };

      const result = await api('POST', '/api/tasks/search', {
        status,
        assigneeId,
        ownerId,
        dueDateFrom,
        dueDateTo,
        overdue,
        limit,
        page: 1,
      }) as { tasks: Array<{
        id: string;
        title: string;
        status: string;
        priority?: { name: string };
        dueDate?: string;
      }> };

      return {
        success: true,
        counts,
        tasks: result.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority?.name,
          dueDate: t.dueDate,
        })),
      };
    }

    case 'get_task_details': {
      const { taskId } = args as { taskId: string };
      const task = await api('GET', `/api/tasks/${taskId}`);

      if (!task) {
        throw new Error('Задача не найдена');
      }
      return { success: true, task };
    }

    case 'create_task': {
      const { title, description, dueDate, priorityId, contactId, opportunityId } = args as {
        title: string;
        description?: string;
        dueDate?: string;
        priorityId?: string;
        contactId?: string;
        opportunityId?: string;
      };

      const linkedTo = contactId
        ? { entityType: 'contact' as const, entityId: contactId }
        : opportunityId
          ? { entityType: 'opportunity' as const, entityId: opportunityId }
          : undefined;

      const task = await api('POST', '/api/tasks', {
        title,
        description,
        dueDate,
        priorityId,
        linkedTo,
      }) as { id: string; title: string };

      return { success: true, task: { id: task.id, title: task.title } };
    }

    case 'update_task': {
      const { taskId, title, description, dueDate, priorityId } = args as {
        taskId: string;
        title?: string;
        description?: string;
        dueDate?: string;
        priorityId?: string;
      };

      const updateData: Record<string, unknown> = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (priorityId !== undefined) updateData.priorityId = priorityId;

      const task = await api('PATCH', `/api/tasks/${taskId}`, updateData) as {
        id: string;
        title: string;
        status: string;
      };

      return { success: true, task: { id: task.id, title: task.title, status: task.status } };
    }

    case 'update_task_status': {
      const { taskId, status } = args as { taskId: string; status: string };
      const task = await api('PATCH', `/api/tasks/${taskId}`, {
        status,
      }) as { id: string; title: string; status: string } | null;

      if (!task) {
        throw new Error('Задача не найдена');
      }
      return { success: true, task: { id: task.id, title: task.title, status: task.status } };
    }

    case 'delete_task': {
      const { taskId } = args as { taskId: string };
      await api('DELETE', `/api/tasks/${taskId}`);

      return { success: true, message: 'Задача удалена' };
    }

    // ==================== ВЗАИМОДЕЙСТВИЯ ====================
    case 'search_interactions': {
      const { contactId, channelId, direction, limit = 20 } = args as {
        contactId?: string;
        channelId?: string;
        direction?: 'inbound' | 'outbound';
        limit?: number;
      };

      const result = await api('POST', '/api/interactions/search', {
        contactId,
        channelId,
        direction,
        limit,
      }) as { total: number; interactions: Array<{
        id: string;
        subject?: string;
        content: string;
        direction: string;
        channel?: { name: string };
        contact?: { name: string };
        createdAt: string;
      }> };

      return {
        success: true,
        total: result.total,
        interactions: result.interactions.map((i) => ({
          id: i.id,
          subject: i.subject,
          content: i.content,
          direction: i.direction,
          channel: i.channel?.name,
          contact: i.contact?.name,
          createdAt: i.createdAt,
        })),
      };
    }

    case 'create_interaction': {
      const { contactId, channelId, subject, content, direction } = args as {
        contactId: string;
        channelId: string;
        subject?: string;
        content: string;
        direction: 'inbound' | 'outbound';
      };

      const interaction = await api('POST', '/api/interactions', {
        contactId,
        channelId,
        subject,
        content,
        direction,
      }) as { id: string };

      return { success: true, interaction: { id: interaction.id } };
    }

    // ==================== ВОРОНКИ ====================
    case 'get_pipelines': {
      const result = await api('GET', '/api/pipelines') as {
        pipelines: Array<{
          id: string;
          name: string;
          code: string;
          isDefault: boolean;
          stagesCount?: number;
        }>;
      };

      return {
        success: true,
        pipelines: result.pipelines.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          isDefault: p.isDefault,
          stagesCount: p.stagesCount,
        })),
      };
    }

    case 'get_pipeline_stages': {
      const { pipelineId } = args as { pipelineId: string };
      const result = await api('GET', `/api/pipelines/${pipelineId}/stages`) as {
        stages: Array<{
          id: string;
          name: string;
          color?: string;
          order: number;
          isInitial: boolean;
        }>;
      };

      return {
        success: true,
        stages: result.stages.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          order: s.order,
          isInitial: s.isInitial,
        })),
      };
    }

    case 'get_pipeline_analytics': {
      const { pipelineId } = args as { pipelineId?: string };

      const pipelinesResult = await api('GET', '/api/pipelines') as {
        pipelines: Array<{ id: string; name: string; isDefault?: boolean }>;
      };
      const pipelines = pipelinesResult.pipelines;

      const targetPipeline = pipelineId
        ? pipelines.find((p) => p.id === pipelineId)
        : pipelines.find((p) => p.isDefault) || pipelines[0];

      if (!targetPipeline) {
        throw new Error('Воронка не найдена');
      }

      const analytics = await api('GET', `/api/pipelines/${targetPipeline.id}/analytics`) as {
        pipeline: { id: string; name: string };
        stages: Array<{ id: string; name: string; count: number; totalAmount: number; avgAmount: number }>;
        totalOpportunities: number;
      };

      return {
        success: true,
        pipeline: analytics.pipeline,
        stages: analytics.stages,
        totalOpportunities: analytics.totalOpportunities,
      };
    }

    // ==================== СПРАВОЧНИКИ ====================
    case 'get_dictionaries': {
      const result = await api('POST', '/api/dictionaries/search', {}) as {
        dictionaries: Array<{
          code: string;
          name: string;
          description?: string;
          itemsCount?: number;
        }>;
      };

      return {
        success: true,
        dictionaries: result.dictionaries.map((d) => ({
          code: d.code,
          name: d.name,
          description: d.description,
          itemsCount: d.itemsCount,
        })),
      };
    }

    case 'get_dictionary_items': {
      const { dictionaryCode } = args as { dictionaryCode: string };
      const result = await api('GET', `/api/dictionaries/${dictionaryCode}/items`) as {
        items: Array<{
          id: string;
          code: string;
          name: string;
          color?: string;
          isActive: boolean;
        }>;
      };

      return {
        success: true,
        dictionaryCode,
        items: result.items.map((i) => ({
          id: i.id,
          code: i.code,
          name: i.name,
          color: i.color,
          isActive: i.isActive,
        })),
      };
    }

    // ==================== КАНАЛЫ ====================
    case 'get_channels': {
      const result = await api('POST', '/api/channels/search', {}) as {
        channels: Array<{
          id: string;
          code: string;
          name: string;
          icon?: string;
          color?: string;
        }>;
      };

      return {
        success: true,
        channels: result.channels.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          icon: c.icon,
          color: c.color,
        })),
      };
    }

    // ==================== КОНТАКТЫ (дополнительно) ====================
    case 'delete_contact': {
      const { contactId } = args as { contactId: string };
      await api('DELETE', `/api/contacts/${contactId}`);
      return { success: true, message: 'Контакт удалён' };
    }

    // ==================== СДЕЛКИ (дополнительно) ====================
    case 'delete_opportunity': {
      const { opportunityId } = args as { opportunityId: string };
      await api('DELETE', `/api/opportunities/${opportunityId}`);
      return { success: true, message: 'Сделка удалена' };
    }

    case 'archive_opportunity': {
      const { opportunityId, archived = true } = args as { opportunityId: string; archived?: boolean };
      const opportunity = await api('PATCH', `/api/opportunities/${opportunityId}`, {
        archived,
      }) as { id: string; name: string; archived: boolean };

      return {
        success: true,
        opportunity: { id: opportunity.id, name: opportunity.name, archived: opportunity.archived },
        message: archived ? 'Сделка архивирована' : 'Сделка разархивирована',
      };
    }

    // ==================== ВЗАИМОДЕЙСТВИЯ (дополнительно) ====================
    case 'get_interaction_details': {
      const { interactionId } = args as { interactionId: string };
      const interaction = await api('GET', `/api/interactions/${interactionId}`);

      if (!interaction) {
        throw new Error('Взаимодействие не найдено');
      }
      return { success: true, interaction };
    }

    case 'update_interaction': {
      const { interactionId, subject, content, status } = args as {
        interactionId: string;
        subject?: string;
        content?: string;
        status?: string;
      };

      const updateData: Record<string, unknown> = {};
      if (subject !== undefined) updateData.subject = subject;
      if (content !== undefined) updateData.content = content;
      if (status !== undefined) updateData.status = status;

      const interaction = await api('PATCH', `/api/interactions/${interactionId}`, updateData) as {
        id: string;
        subject?: string;
        status: string;
      };

      return { success: true, interaction: { id: interaction.id, subject: interaction.subject, status: interaction.status } };
    }

    case 'delete_interaction': {
      const { interactionId } = args as { interactionId: string };
      await api('DELETE', `/api/interactions/${interactionId}`);
      return { success: true, message: 'Взаимодействие удалено' };
    }

    case 'get_interaction_stats': {
      const { contactId } = args as { contactId: string };
      const stats = await api('GET', `/api/interactions/stats/${contactId}`) as {
        total: number;
        byChannel: Record<string, number>;
        byDirection: Record<string, number>;
      };

      return { success: true, stats };
    }

    // ==================== ПОЛЬЗОВАТЕЛИ ====================
    case 'search_users': {
      const { query, role, isActive, limit = 10 } = args as {
        query?: string;
        role?: string;
        isActive?: boolean;
        limit?: number;
      };

      const result = await api('POST', '/api/users/search', {
        search: query,
        role,
        isActive,
        limit,
        page: 1,
      }) as { total: number; users: Array<{
        id: string;
        name: string;
        email: string;
        roles: string[];
        isActive: boolean;
      }> };

      return {
        success: true,
        total: result.total,
        users: result.users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          roles: u.roles,
          isActive: u.isActive,
        })),
      };
    }

    case 'get_user_details': {
      const { userId } = args as { userId: string };
      const user = await api('GET', `/api/users/${userId}`);

      if (!user) {
        throw new Error('Пользователь не найден');
      }
      return { success: true, user };
    }

    case 'update_user': {
      const { userId, name, email, image } = args as {
        userId: string;
        name?: string;
        email?: string;
        image?: string;
      };

      // Сначала проверяем, не является ли пользователь админом
      const existingUser = await api('GET', `/api/users/${userId}`) as {
        id: string;
        roles: string[];
      };

      if (!existingUser) {
        throw new Error('Пользователь не найден');
      }

      // Запрещаем модификацию админов через MCP
      if (existingUser.roles && existingUser.roles.includes('admin')) {
        throw new Error('Модификация администраторов через MCP запрещена. Используйте панель администратора.');
      }

      // Только не-админские поля (имя, email, изображение)
      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (image !== undefined) updateData.image = image;

      const user = await api('PATCH', `/api/users/${userId}`, updateData) as {
        id: string;
        name: string;
        email: string;
      };

      return { success: true, user: { id: user.id, name: user.name, email: user.email } };
    }

    // ==================== ПРОЕКТЫ ====================
    case 'search_projects': {
      const { query, status, ownerId, limit = 10 } = args as {
        query?: string;
        status?: string;
        ownerId?: string;
        limit?: number;
      };

      const result = await api('POST', '/api/projects/search', {
        search: query,
        status,
        ownerId,
        limit,
        page: 1,
      }) as { total: number; projects: Array<{
        id: string;
        name: string;
        description?: string;
        status: string;
        deadline?: string;
        owner?: { id: string; name: string };
      }> };

      return {
        success: true,
        total: result.total,
        projects: result.projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          deadline: p.deadline,
          owner: p.owner ? { id: p.owner.id, name: p.owner.name } : null,
        })),
      };
    }

    case 'get_project_details': {
      const { projectId } = args as { projectId: string };
      const project = await api('GET', `/api/projects/${projectId}`);

      if (!project) {
        throw new Error('Проект не найден');
      }
      return { success: true, project };
    }

    case 'create_project': {
      const { name, description, status, deadline, ownerId } = args as {
        name: string;
        description?: string;
        status?: string;
        deadline?: string;
        ownerId?: string;
      };

      const projectData: Record<string, unknown> = { name };
      if (description) projectData.description = description;
      if (status) projectData.status = status;
      if (deadline) projectData.deadline = deadline;
      if (ownerId) projectData.ownerId = ownerId;

      const project = await api('POST', '/api/projects', projectData) as {
        id: string;
        name: string;
        status: string;
      };

      return { success: true, project: { id: project.id, name: project.name, status: project.status } };
    }

    case 'update_project': {
      const { projectId, name, description, status, deadline } = args as {
        projectId: string;
        name?: string;
        description?: string;
        status?: string;
        deadline?: string;
      };

      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status;
      if (deadline !== undefined) updateData.deadline = deadline;

      const project = await api('PATCH', `/api/projects/${projectId}`, updateData) as {
        id: string;
        name: string;
        status: string;
      };

      return { success: true, project: { id: project.id, name: project.name, status: project.status } };
    }

    case 'delete_project': {
      const { projectId } = args as { projectId: string };
      await api('DELETE', `/api/projects/${projectId}`);
      return { success: true, message: 'Проект удалён' };
    }

    // ==================== ДОПОЛНИТЕЛЬНЫЕ ИНСТРУМЕНТЫ ====================
    case 'get_tasks_by_contact': {
      const { contactId } = args as { contactId: string };
      const result = await api('GET', `/api/contacts/${contactId}/tasks`) as {
        tasks: Array<{
          id: string;
          title: string;
          status: string;
          priority?: { name: string; color?: string };
          dueDate?: string;
          assignee?: { name: string };
        }>;
        total: number;
      };

      return {
        success: true,
        total: result.total,
        tasks: result.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority?.name,
          dueDate: t.dueDate,
          assignee: t.assignee?.name,
        })),
      };
    }

    case 'get_tasks_by_project': {
      const { projectId } = args as { projectId: string };
      const result = await api('GET', `/api/projects/${projectId}/tasks`) as {
        tasks: Array<{
          id: string;
          title: string;
          status: string;
          priority?: { name: string; color?: string };
          dueDate?: string;
          assignee?: { name: string };
        }>;
        total: number;
      };

      return {
        success: true,
        total: result.total,
        tasks: result.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority?.name,
          dueDate: t.dueDate,
          assignee: t.assignee?.name,
        })),
      };
    }

    case 'get_default_pipeline': {
      const pipeline = await api('GET', '/api/pipelines/default') as {
        id: string;
        name: string;
        code: string;
        stages: Array<{
          id: string;
          name: string;
          color: string;
          order: number;
          isInitial: boolean;
          isFinal: boolean;
          isWon: boolean;
        }>;
      };

      return {
        success: true,
        pipeline: {
          id: pipeline.id,
          name: pipeline.name,
          code: pipeline.code,
          stages: pipeline.stages.map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            order: s.order,
            isInitial: s.isInitial,
            isFinal: s.isFinal,
            isWon: s.isWon,
          })),
        },
      };
    }

    case 'get_pipeline_by_code': {
      const { code } = args as { code: string };
      const pipeline = await api('GET', `/api/pipelines/code/${code}`) as {
        id: string;
        name: string;
        code: string;
        stages: Array<{
          id: string;
          name: string;
          color: string;
          order: number;
          isInitial: boolean;
          isFinal: boolean;
          isWon: boolean;
        }>;
      };

      return {
        success: true,
        pipeline: {
          id: pipeline.id,
          name: pipeline.name,
          code: pipeline.code,
          stages: pipeline.stages.map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            order: s.order,
            isInitial: s.isInitial,
            isFinal: s.isFinal,
            isWon: s.isWon,
          })),
        },
      };
    }

    case 'get_initial_stage': {
      const { pipelineId } = args as { pipelineId: string };
      const stage = await api('GET', `/api/pipelines/${pipelineId}/initial-stage`) as {
        id: string;
        name: string;
        color: string;
        order: number;
      };

      return { success: true, stage };
    }

    case 'get_interactions_by_contact': {
      const { contactId, limit = 50 } = args as { contactId: string; limit?: number };
      const result = await api('GET', `/api/contacts/${contactId}/interactions?limit=${limit}`) as {
        interactions: Array<{
          id: string;
          direction: string;
          status: string;
          subject?: string;
          content?: string;
          channel?: { code: string; name: string };
          createdAt: string;
        }>;
        total: number;
      };

      return {
        success: true,
        total: result.total,
        interactions: result.interactions.map((i) => ({
          id: i.id,
          direction: i.direction,
          status: i.status,
          subject: i.subject,
          content: i.content?.substring(0, 200),
          channel: i.channel?.name,
          createdAt: i.createdAt,
        })),
      };
    }

    case 'get_dictionary_item_by_code': {
      const { dictionaryCode, itemCode } = args as { dictionaryCode: string; itemCode: string };
      const item = await api('GET', `/api/dictionaries/${dictionaryCode}/items/by-code/${itemCode}`) as {
        id: string;
        code: string;
        name: string;
        properties?: Record<string, unknown>;
      };

      return { success: true, item };
    }

    default:
      throw new Error(`Неизвестный инструмент: ${name}`);
  }
}
