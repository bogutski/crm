import { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RouteDefinition {
  /** Краткое описание эндпоинта */
  summary: string;
  /** Подробное описание (опционально) */
  description?: string;
  /** Теги для группировки */
  tags: string[];
  /** Схема query параметров */
  query?: z.ZodType;
  /** Схема path параметров */
  params?: z.ZodType;
  /** Схема тела запроса */
  body?: z.ZodType;
  /** Пример тела запроса */
  bodyExample?: Record<string, unknown>;
  /** Схема успешного ответа */
  response?: z.ZodType;
  /** Пример ответа */
  responseExample?: Record<string, unknown> | unknown[];
  /** Требуется ли авторизация (по умолчанию true) */
  auth?: boolean;
}

export interface ApiRoute {
  method: HttpMethod;
  path: string;
  definition: RouteDefinition;
}

export interface ApiModule {
  name: string;
  routes: ApiRoute[];
}

export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
}

export interface OpenApiConfig {
  info: OpenApiInfo;
  servers?: { url: string; description?: string }[];
}
