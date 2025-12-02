// Типы полей для словаря
export type DictionaryFieldType = 'string' | 'number' | 'boolean' | 'color' | 'icon';

// Описание поля словаря
export interface DictionaryField {
  code: string;
  name: string;
  type: DictionaryFieldType;
  required: boolean;
}

// Словарь (мета-описание)
export interface Dictionary {
  id: string;
  code: string;
  name: string;
  description?: string;
  allowHierarchy: boolean;
  maxDepth: number;
  fields: DictionaryField[];
  createdAt: Date;
  updatedAt: Date;
}

// Элемент словаря
export interface DictionaryItem {
  id: string;
  dictionaryCode: string;
  code?: string; // уникальный код в рамках словаря (для связей)
  name: string;
  weight: number;
  parentId: string | null;
  depth: number;
  isActive: boolean;
  properties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs для создания
export interface CreateDictionaryDTO {
  code: string;
  name: string;
  description?: string;
  allowHierarchy?: boolean;
  maxDepth?: number;
  fields?: DictionaryField[];
}

export interface UpdateDictionaryDTO {
  name?: string;
  description?: string;
  allowHierarchy?: boolean;
  maxDepth?: number;
  fields?: DictionaryField[];
}

export interface CreateDictionaryItemDTO {
  dictionaryCode: string;
  code?: string; // уникальный код в рамках словаря
  name: string;
  parentId?: string | null;
  properties?: Record<string, unknown>;
}

export interface UpdateDictionaryItemDTO {
  code?: string | null; // уникальный код в рамках словаря
  name?: string;
  parentId?: string | null;
  isActive?: boolean;
  properties?: Record<string, unknown>;
}

// Response types
export interface DictionaryResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  allowHierarchy: boolean;
  maxDepth: number;
  fields: DictionaryField[];
  itemCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DictionaryItemResponse {
  id: string;
  dictionaryCode: string;
  code?: string;
  name: string;
  weight: number;
  parentId: string | null;
  depth: number;
  isActive: boolean;
  properties: Record<string, unknown>;
  children?: DictionaryItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DictionaryListResponse {
  dictionaries: DictionaryResponse[];
  total: number;
}

export interface DictionaryItemsListResponse {
  items: DictionaryItemResponse[];
  total: number;
}
