/**
 * MCP Tools definitions and handlers
 * These tools are exposed via the MCP server endpoint
 * All tools use internal REST API calls for consistency
 */

// Tool definitions for MCP
export const MCP_TOOLS = [
  // ==================== КОНТАКТЫ ====================
  {
    name: 'search_contacts',
    description: 'Поиск контактов в CRM по имени, email, телефону или компании.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Поисковый запрос (имя, email, телефон или компания)',
        },
        limit: {
          type: 'number',
          description: 'Максимальное количество результатов (по умолчанию: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_contact_details',
    description: 'Получить подробную информацию о контакте по ID.',
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
    description: 'Создать новый контакт в CRM.',
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
    description: 'Обновить данные контакта.',
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

  // ==================== СДЕЛКИ ====================
  {
    name: 'search_opportunities',
    description: 'Поиск сделок в CRM по названию, контакту или стадии.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Поисковый запрос (название или имя контакта)',
        },
        stageId: {
          type: 'string',
          description: 'Фильтр по ID стадии воронки',
        },
        pipelineId: {
          type: 'string',
          description: 'Фильтр по ID воронки',
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
    description: 'Получить подробную информацию о сделке по ID.',
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
    description: 'Получить статистику по сделкам: общее количество, сумма, разбивка по стадиям.',
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
    description: 'Создать новую сделку в CRM.',
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
    description: 'Обновить данные сделки (название, сумму, заметки и т.д.).',
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
    description: 'Переместить сделку на другую стадию воронки.',
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

  // ==================== ЗАДАЧИ ====================
  {
    name: 'get_tasks_overview',
    description: 'Получить обзор задач: количество по статусам и список задач.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['open', 'in_progress', 'completed', 'cancelled'],
          description: 'Фильтр по статусу задачи',
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
    description: 'Получить подробную информацию о задаче по ID.',
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
    description: 'Создать новую задачу в CRM. Можно привязать к контакту или сделке.',
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
    description: 'Обновить данные задачи (название, описание, срок и т.д.).',
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
    description: 'Изменить статус существующей задачи.',
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
    description: 'Удалить задачу из CRM.',
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

  // ==================== ВЗАИМОДЕЙСТВИЯ ====================
  {
    name: 'search_interactions',
    description: 'Поиск взаимодействий с контактами (звонки, письма, встречи).',
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
    description: 'Записать взаимодействие с контактом (звонок, письмо, встреча и т.д.).',
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

  // ==================== ВОРОНКИ ====================
  {
    name: 'get_pipelines',
    description: 'Получить список всех воронок продаж.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_pipeline_stages',
    description: 'Получить список стадий воронки.',
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
    description: 'Получить аналитику воронки: количество сделок и суммы по стадиям.',
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

  // ==================== СПРАВОЧНИКИ ====================
  {
    name: 'get_dictionaries',
    description: 'Получить список всех справочников (словарей) системы.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_dictionary_items',
    description: 'Получить элементы справочника по его коду.',
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

  // ==================== КАНАЛЫ ====================
  {
    name: 'get_channels',
    description: 'Получить список каналов коммуникации (телефон, email, встреча и т.д.).',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },

  // ==================== КОНТАКТЫ (дополнительно) ====================
  {
    name: 'delete_contact',
    description: 'Удалить контакт из CRM.',
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
    description: 'Удалить сделку из CRM.',
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
    description: 'Архивировать или разархивировать сделку.',
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
    description: 'Получить подробную информацию о взаимодействии по ID.',
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
    description: 'Обновить данные взаимодействия.',
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
    description: 'Удалить взаимодействие из CRM.',
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
    description: 'Получить статистику взаимодействий по контакту.',
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

  // ==================== ПОЛЬЗОВАТЕЛИ ====================
  {
    name: 'search_users',
    description: 'Поиск пользователей CRM (для назначения ответственных).',
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
    description: 'Получить информацию о пользователе по ID.',
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
    description: 'Обновить данные пользователя (имя, email, аватар). Не изменяет роли и статус активности.',
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
    description: 'Поиск проектов в CRM.',
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
    description: 'Получить подробную информацию о проекте по ID.',
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
    description: 'Создать новый проект в CRM.',
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
    description: 'Обновить данные проекта.',
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
    description: 'Удалить проект из CRM.',
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
    description: 'Получить все задачи, привязанные к контакту.',
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
    description: 'Получить все задачи, привязанные к проекту.',
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
    description: 'Получить воронку по умолчанию со всеми стадиями.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_pipeline_by_code',
    description: 'Получить воронку по её коду со всеми стадиями.',
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
    description: 'Получить начальную стадию воронки.',
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
    description: 'Получить все взаимодействия с контактом (звонки, письма, встречи).',
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
    description: 'Получить элемент справочника по коду справочника и коду элемента.',
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
 */
async function apiCall(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  apiToken: string,
  body?: unknown
): Promise<unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
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
  _userId: string,
  apiToken: string
): Promise<unknown> {
  switch (name) {
    // ==================== КОНТАКТЫ ====================
    case 'search_contacts': {
      const { query, limit = 10 } = args as { query: string; limit?: number };
      const result = await apiCall('POST', '/api/contacts/search', apiToken, {
        search: query,
        limit,
        page: 1,
      }) as { total: number; contacts: Array<{
        id: string;
        name: string;
        company?: string;
        position?: string;
        emails?: Array<{ address: string }>;
        phones?: Array<{ international?: string; e164?: string }>;
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
        })),
      };
    }

    case 'get_contact_details': {
      const { contactId } = args as { contactId: string };
      const contact = await apiCall('GET', `/api/contacts/${contactId}`, apiToken);

      if (!contact) {
        throw new Error('Контакт не найден');
      }
      return { success: true, contact };
    }

    case 'create_contact': {
      const { name, company, position, email, phone, contactTypeId, sourceId, notes } = args as {
        name: string;
        company?: string;
        position?: string;
        email?: string;
        phone?: string;
        contactTypeId?: string;
        sourceId?: string;
        notes?: string;
      };

      const contactData: Record<string, unknown> = { name };
      if (company) contactData.company = company;
      if (position) contactData.position = position;
      if (email) contactData.emails = [{ address: email, isPrimary: true }];
      if (phone) contactData.phones = [{ original: phone, isPrimary: true }];
      if (contactTypeId) contactData.contactTypeId = contactTypeId;
      if (sourceId) contactData.sourceId = sourceId;
      if (notes) contactData.notes = notes;

      const contact = await apiCall('POST', '/api/contacts', apiToken, contactData) as {
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

      const contact = await apiCall('PATCH', `/api/contacts/${contactId}`, apiToken, updateData) as {
        id: string;
        name: string;
      };

      return { success: true, contact: { id: contact.id, name: contact.name } };
    }

    // ==================== СДЕЛКИ ====================
    case 'search_opportunities': {
      const { query, stageId, pipelineId, limit = 10 } = args as {
        query?: string;
        stageId?: string;
        pipelineId?: string;
        limit?: number;
      };
      const result = await apiCall('POST', '/api/opportunities/search', apiToken, {
        search: query,
        stageId,
        pipelineId,
        limit,
        page: 1,
      }) as { total: number; opportunities: Array<{
        id: string;
        name: string;
        amount?: number;
        stage?: { id: string; name: string };
        contact?: { id: string; name: string };
      }> };

      return {
        success: true,
        total: result.total,
        opportunities: result.opportunities.map((o) => ({
          id: o.id,
          name: o.name,
          amount: o.amount,
          stage: o.stage ? { id: o.stage.id, name: o.stage.name } : null,
          contact: o.contact ? { id: o.contact.id, name: o.contact.name } : null,
        })),
      };
    }

    case 'get_opportunity_details': {
      const { opportunityId } = args as { opportunityId: string };
      const opportunity = await apiCall('GET', `/api/opportunities/${opportunityId}`, apiToken);

      if (!opportunity) {
        throw new Error('Сделка не найдена');
      }
      return { success: true, opportunity };
    }

    case 'get_opportunities_stats': {
      const { pipelineId } = args as { pipelineId?: string };
      const queryParam = pipelineId ? `?pipelineId=${pipelineId}` : '';
      const stats = await apiCall('GET', `/api/opportunities/stats${queryParam}`, apiToken);

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

      const opportunity = await apiCall('POST', '/api/opportunities', apiToken, oppData) as {
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

      const opportunity = await apiCall('PATCH', `/api/opportunities/${opportunityId}`, apiToken, updateData) as {
        id: string;
        name: string;
        amount?: number;
      };

      return { success: true, opportunity: { id: opportunity.id, name: opportunity.name, amount: opportunity.amount } };
    }

    case 'update_opportunity_stage': {
      const { opportunityId, stageId } = args as { opportunityId: string; stageId: string };
      const opportunity = await apiCall('PATCH', `/api/opportunities/${opportunityId}`, apiToken, {
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
      const { status, limit = 10 } = args as { status?: string; limit?: number };

      const counts = await apiCall('POST', '/api/tasks/counts', apiToken, {}) as {
        open: number;
        in_progress: number;
        completed: number;
        cancelled: number;
        overdue: number;
      };

      const result = await apiCall('POST', '/api/tasks/search', apiToken, {
        status,
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
      const task = await apiCall('GET', `/api/tasks/${taskId}`, apiToken);

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

      const task = await apiCall('POST', '/api/tasks', apiToken, {
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

      const task = await apiCall('PATCH', `/api/tasks/${taskId}`, apiToken, updateData) as {
        id: string;
        title: string;
        status: string;
      };

      return { success: true, task: { id: task.id, title: task.title, status: task.status } };
    }

    case 'update_task_status': {
      const { taskId, status } = args as { taskId: string; status: string };
      const task = await apiCall('PATCH', `/api/tasks/${taskId}`, apiToken, {
        status,
      }) as { id: string; title: string; status: string } | null;

      if (!task) {
        throw new Error('Задача не найдена');
      }
      return { success: true, task: { id: task.id, title: task.title, status: task.status } };
    }

    case 'delete_task': {
      const { taskId } = args as { taskId: string };
      await apiCall('DELETE', `/api/tasks/${taskId}`, apiToken);

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

      const result = await apiCall('POST', '/api/interactions/search', apiToken, {
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

      const interaction = await apiCall('POST', '/api/interactions', apiToken, {
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
      const result = await apiCall('GET', '/api/pipelines', apiToken) as {
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
      const result = await apiCall('GET', `/api/pipelines/${pipelineId}/stages`, apiToken) as {
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

      const pipelinesResult = await apiCall('GET', '/api/pipelines', apiToken) as {
        pipelines: Array<{ id: string; name: string; isDefault?: boolean }>;
      };
      const pipelines = pipelinesResult.pipelines;

      const targetPipeline = pipelineId
        ? pipelines.find((p) => p.id === pipelineId)
        : pipelines.find((p) => p.isDefault) || pipelines[0];

      if (!targetPipeline) {
        throw new Error('Воронка не найдена');
      }

      const analytics = await apiCall('GET', `/api/pipelines/${targetPipeline.id}/analytics`, apiToken) as {
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
      const result = await apiCall('POST', '/api/dictionaries/search', apiToken, {}) as {
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
      const result = await apiCall('GET', `/api/dictionaries/${dictionaryCode}/items`, apiToken) as {
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
      const result = await apiCall('POST', '/api/channels/search', apiToken, {}) as {
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
      await apiCall('DELETE', `/api/contacts/${contactId}`, apiToken);
      return { success: true, message: 'Контакт удалён' };
    }

    // ==================== СДЕЛКИ (дополнительно) ====================
    case 'delete_opportunity': {
      const { opportunityId } = args as { opportunityId: string };
      await apiCall('DELETE', `/api/opportunities/${opportunityId}`, apiToken);
      return { success: true, message: 'Сделка удалена' };
    }

    case 'archive_opportunity': {
      const { opportunityId, archived = true } = args as { opportunityId: string; archived?: boolean };
      const opportunity = await apiCall('PATCH', `/api/opportunities/${opportunityId}`, apiToken, {
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
      const interaction = await apiCall('GET', `/api/interactions/${interactionId}`, apiToken);

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

      const interaction = await apiCall('PATCH', `/api/interactions/${interactionId}`, apiToken, updateData) as {
        id: string;
        subject?: string;
        status: string;
      };

      return { success: true, interaction: { id: interaction.id, subject: interaction.subject, status: interaction.status } };
    }

    case 'delete_interaction': {
      const { interactionId } = args as { interactionId: string };
      await apiCall('DELETE', `/api/interactions/${interactionId}`, apiToken);
      return { success: true, message: 'Взаимодействие удалено' };
    }

    case 'get_interaction_stats': {
      const { contactId } = args as { contactId: string };
      const stats = await apiCall('GET', `/api/interactions/stats/${contactId}`, apiToken) as {
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

      const result = await apiCall('POST', '/api/users/search', apiToken, {
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
      const user = await apiCall('GET', `/api/users/${userId}`, apiToken);

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
      const existingUser = await apiCall('GET', `/api/users/${userId}`, apiToken) as {
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

      const user = await apiCall('PATCH', `/api/users/${userId}`, apiToken, updateData) as {
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

      const result = await apiCall('POST', '/api/projects/search', apiToken, {
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
      const project = await apiCall('GET', `/api/projects/${projectId}`, apiToken);

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

      const project = await apiCall('POST', '/api/projects', apiToken, projectData) as {
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

      const project = await apiCall('PATCH', `/api/projects/${projectId}`, apiToken, updateData) as {
        id: string;
        name: string;
        status: string;
      };

      return { success: true, project: { id: project.id, name: project.name, status: project.status } };
    }

    case 'delete_project': {
      const { projectId } = args as { projectId: string };
      await apiCall('DELETE', `/api/projects/${projectId}`, apiToken);
      return { success: true, message: 'Проект удалён' };
    }

    // ==================== ДОПОЛНИТЕЛЬНЫЕ ИНСТРУМЕНТЫ ====================
    case 'get_tasks_by_contact': {
      const { contactId } = args as { contactId: string };
      const result = await apiCall('GET', `/api/contacts/${contactId}/tasks`, apiToken) as {
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
      const result = await apiCall('GET', `/api/projects/${projectId}/tasks`, apiToken) as {
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
      const pipeline = await apiCall('GET', '/api/pipelines/default', apiToken) as {
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
      const pipeline = await apiCall('GET', `/api/pipelines/code/${code}`, apiToken) as {
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
      const stage = await apiCall('GET', `/api/pipelines/${pipelineId}/initial-stage`, apiToken) as {
        id: string;
        name: string;
        color: string;
        order: number;
      };

      return { success: true, stage };
    }

    case 'get_interactions_by_contact': {
      const { contactId, limit = 50 } = args as { contactId: string; limit?: number };
      const result = await apiCall('GET', `/api/contacts/${contactId}/interactions?limit=${limit}`, apiToken) as {
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
      const item = await apiCall('GET', `/api/dictionaries/${dictionaryCode}/items/by-code/${itemCode}`, apiToken) as {
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
