import { z } from 'zod';
import { ApiRoute, OpenApiConfig } from './types';
import { zodToOpenApi } from './zod-to-openapi';
import { extractPathParams } from './define-routes';

interface OpenApiDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: { url: string; description?: string }[];
  tags?: { name: string; description?: string }[];
  paths: Record<string, Record<string, unknown>>;
  components: {
    securitySchemes?: Record<string, unknown>;
    schemas?: Record<string, unknown>;
  };
  security?: { bearerAuth: [] }[];
}

/**
 * Генерирует OpenAPI 3.0 документ из маршрутов.
 */
export function generateOpenApiDocument(
  config: OpenApiConfig,
  routes: ApiRoute[]
): OpenApiDocument {
  const doc: OpenApiDocument = {
    openapi: '3.0.3',
    info: config.info,
    servers: config.servers,
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  };

  // Собираем уникальные теги
  const tagsSet = new Set<string>();
  routes.forEach(route => {
    route.definition.tags.forEach(tag => tagsSet.add(tag));
  });
  doc.tags = Array.from(tagsSet).map(name => ({ name }));

  // Генерируем paths
  for (const route of routes) {
    const { method, path, definition } = route;

    // Конвертируем :param в {param}
    const openApiPath = path.replace(/:([a-zA-Z_]+)/g, '{$1}');

    if (!doc.paths[openApiPath]) {
      doc.paths[openApiPath] = {};
    }

    const operation: Record<string, unknown> = {
      summary: definition.summary,
      description: definition.description,
      tags: definition.tags,
      responses: {
        200: {
          description: 'Успешный ответ',
          content: definition.response
            ? {
                'application/json': {
                  schema: zodToOpenApi(definition.response),
                  example: definition.responseExample,
                },
              }
            : undefined,
        },
        401: {
          description: 'Не авторизован',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Unauthorized' },
                },
              },
            },
          },
        },
        500: {
          description: 'Внутренняя ошибка сервера',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                },
              },
            },
          },
        },
      },
    };

    // Path parameters
    const pathParams = extractPathParams(path);
    const parameters: unknown[] = [];

    if (pathParams.length > 0) {
      for (const param of pathParams) {
        parameters.push({
          name: param,
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: definition.params
            ? getParamDescription(definition.params, param)
            : undefined,
        });
      }
    }

    // Query parameters
    if (definition.query && definition.query instanceof z.ZodObject) {
      const shape = definition.query.shape as Record<string, z.ZodType>;

      for (const [name, schema] of Object.entries(shape)) {
        const openApiSchema = zodToOpenApi(schema);
        const isRequired = !(
          schema instanceof z.ZodOptional ||
          schema instanceof z.ZodDefault
        );

        parameters.push({
          name,
          in: 'query',
          required: isRequired,
          schema: openApiSchema,
          description: schema.description,
        });
      }
    }

    if (parameters.length > 0) {
      operation.parameters = parameters;
    }

    // Request body
    if (definition.body) {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: zodToOpenApi(definition.body),
            example: definition.bodyExample,
          },
        },
      };
    }

    // Security
    if (definition.auth === false) {
      operation.security = [];
    }

    doc.paths[openApiPath][method.toLowerCase()] = operation;
  }

  return doc;
}

function getParamDescription(schema: z.ZodType, param: string): string | undefined {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodType>;
    return shape[param]?.description;
  }
  return undefined;
}

/**
 * Сериализует OpenAPI документ в JSON.
 */
export function serializeOpenApi(doc: OpenApiDocument): string {
  return JSON.stringify(doc, null, 2);
}
