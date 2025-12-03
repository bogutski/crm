import { IApiToken } from './model';

export type { IApiToken };

export interface CreateApiTokenDTO {
  name: string;
}

export interface UpdateApiTokenDTO {
  name?: string;
}

export interface ApiTokenResponse {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiTokenCreatedResponse extends ApiTokenResponse {
  token: string; // Полный токен показывается только при создании
}

export interface ApiTokensListResponse {
  tokens: ApiTokenResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiTokenFilters {
  search?: string;
  page?: number;
  limit?: number;
}
