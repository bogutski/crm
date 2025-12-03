import { z } from 'zod';

interface OpenApiSchema {
  type?: string;
  format?: string;
  description?: string;
  enum?: string[];
  items?: OpenApiSchema;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  additionalProperties?: boolean | OpenApiSchema;
  nullable?: boolean;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  oneOf?: OpenApiSchema[];
  allOf?: OpenApiSchema[];
}

/**
 * Конвертирует Zod схему в OpenAPI Schema.
 */
export function zodToOpenApi(schema: z.ZodType): OpenApiSchema {
  const description = schema.description;

  // Unwrap effects (refinements, transforms, etc.)
  if (schema instanceof z.ZodEffects) {
    return zodToOpenApi(schema._def.schema);
  }

  // Optional
  if (schema instanceof z.ZodOptional) {
    return zodToOpenApi(schema.unwrap());
  }

  // Nullable
  if (schema instanceof z.ZodNullable) {
    return {
      ...zodToOpenApi(schema.unwrap()),
      nullable: true,
    };
  }

  // Default
  if (schema instanceof z.ZodDefault) {
    const inner = zodToOpenApi(schema._def.innerType);
    return {
      ...inner,
      default: schema._def.defaultValue(),
    };
  }

  // String
  if (schema instanceof z.ZodString) {
    const result: OpenApiSchema = { type: 'string', description };
    for (const check of schema._def.checks) {
      if (check.kind === 'min') result.minLength = check.value;
      if (check.kind === 'max') result.maxLength = check.value;
      if (check.kind === 'email') result.format = 'email';
      if (check.kind === 'url') result.format = 'uri';
      if (check.kind === 'regex') result.pattern = check.regex.source;
    }
    return result;
  }

  // Number
  if (schema instanceof z.ZodNumber) {
    const result: OpenApiSchema = { type: 'number', description };
    for (const check of schema._def.checks) {
      if (check.kind === 'min') result.minimum = check.value;
      if (check.kind === 'max') result.maximum = check.value;
      if (check.kind === 'int') result.type = 'integer';
    }
    return result;
  }

  // Boolean
  if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean', description };
  }

  // Date
  if (schema instanceof z.ZodDate) {
    return { type: 'string', format: 'date-time', description };
  }

  // Array
  if (schema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodToOpenApi(schema.element),
      description,
    };
  }

  // Object
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodType>;
    const properties: Record<string, OpenApiSchema> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToOpenApi(value);

      // Определяем обязательность
      const isOptional =
        value instanceof z.ZodOptional ||
        value instanceof z.ZodDefault ||
        (value instanceof z.ZodNullable && value.unwrap() instanceof z.ZodOptional);

      if (!isOptional) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      description,
    };
  }

  // Record
  if (schema instanceof z.ZodRecord) {
    return {
      type: 'object',
      additionalProperties: zodToOpenApi(schema._def.valueType),
      description,
    };
  }

  // Enum
  if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: schema._def.values,
      description,
    };
  }

  // Literal
  if (schema instanceof z.ZodLiteral) {
    const value = schema._def.value;
    return {
      type: typeof value as 'string' | 'number' | 'boolean',
      enum: [value],
      description,
    };
  }

  // Union
  if (schema instanceof z.ZodUnion) {
    return {
      oneOf: schema._def.options.map((opt: z.ZodType) => zodToOpenApi(opt)),
      description,
    };
  }

  // Lazy (для рекурсивных типов) - не разворачиваем чтобы избежать бесконечной рекурсии
  if (schema instanceof z.ZodLazy) {
    return {
      type: 'array',
      items: { type: 'object' },
      description: description || 'Рекурсивная структура',
    };
  }

  // Unknown / Any
  if (schema instanceof z.ZodUnknown || schema instanceof z.ZodAny) {
    return { description };
  }

  // Fallback
  return { description };
}

/**
 * Извлекает описание из Zod схемы.
 */
export function getSchemaDescription(schema: z.ZodType): string | undefined {
  return schema.description;
}
