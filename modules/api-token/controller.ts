import crypto from 'crypto';
import ApiToken, { IApiToken } from './model';
import {
  CreateApiTokenDTO,
  UpdateApiTokenDTO,
  ApiTokenResponse,
  ApiTokenCreatedResponse,
  ApiTokensListResponse,
  ApiTokenFilters,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';

const TOKEN_PREFIX = 'crm_sk_';

function generateToken(): string {
  const randomPart = crypto.randomBytes(32).toString('hex');
  return `${TOKEN_PREFIX}${randomPart}`;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function toApiTokenResponse(apiToken: IApiToken): ApiTokenResponse {
  return {
    id: apiToken._id.toString(),
    name: apiToken.name,
    tokenPrefix: apiToken.tokenPrefix,
    lastUsedAt: apiToken.lastUsedAt,
    createdAt: apiToken.createdAt,
    updatedAt: apiToken.updatedAt,
  };
}

export async function getApiTokens(filters: ApiTokenFilters): Promise<ApiTokensListResponse> {
  await dbConnect();

  const { search, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = {};

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [tokens, total] = await Promise.all([
    ApiToken.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ApiToken.countDocuments(query),
  ]);

  return {
    tokens: tokens.map(toApiTokenResponse),
    total,
    page,
    limit,
  };
}

export async function getApiTokenById(id: string): Promise<ApiTokenResponse | null> {
  await dbConnect();

  const token = await ApiToken.findById(id);
  if (!token) return null;

  return toApiTokenResponse(token);
}

export async function createApiToken(data: CreateApiTokenDTO): Promise<ApiTokenCreatedResponse> {
  await dbConnect();

  const plainToken = generateToken();
  const tokenHash = hashToken(plainToken);
  const tokenPrefix = plainToken.substring(0, 12) + '...';

  const apiToken = await ApiToken.create({
    name: data.name,
    tokenHash,
    tokenPrefix,
  });

  return {
    ...toApiTokenResponse(apiToken),
    token: plainToken,
  };
}

export async function updateApiToken(
  id: string,
  data: UpdateApiTokenDTO
): Promise<ApiTokenResponse | null> {
  await dbConnect();

  const token = await ApiToken.findByIdAndUpdate(id, { $set: data }, { new: true });
  if (!token) return null;

  return toApiTokenResponse(token);
}

export async function deleteApiToken(id: string): Promise<boolean> {
  await dbConnect();

  const result = await ApiToken.findByIdAndDelete(id);
  return !!result;
}

export async function verifyApiToken(token: string): Promise<ApiTokenResponse | null> {
  if (!token.startsWith(TOKEN_PREFIX)) {
    return null;
  }

  await dbConnect();

  const tokenHash = hashToken(token);
  const apiToken = await ApiToken.findOne({ tokenHash });

  if (!apiToken) {
    return null;
  }

  // Обновляем lastUsedAt
  await ApiToken.findByIdAndUpdate(apiToken._id, { lastUsedAt: new Date() });

  return toApiTokenResponse(apiToken);
}
