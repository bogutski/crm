import { ChannelProvider, IChannelProvider } from './model';
import {
  ChannelProviderResponse,
  ChannelProviderListResponse,
  CreateChannelProviderDTO,
  UpdateChannelProviderDTO,
  ProviderConfig,
  PROVIDER_METADATA,
  TELEPHONY_PROVIDER_TYPES,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import { encryptConfig, decryptConfig, updateEncryptedConfig } from './crypto';
import mongoose from 'mongoose';

// === Преобразователь в Response ===

function toProviderResponse(provider: IChannelProvider): ChannelProviderResponse {
  return {
    id: provider._id.toString(),
    channelId: provider.channelId.toString(),
    type: provider.type,
    category: provider.category,
    name: provider.name,
    description: provider.description,
    webhookUrl: provider.webhookUrl,
    capabilities: provider.capabilities,
    isDefault: provider.isDefault,
    priority: provider.priority,
    isActive: provider.isActive,
    lastHealthCheck: provider.lastHealthCheck,
    healthStatus: provider.healthStatus,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

// === CRUD ===

export interface SearchProvidersOptions {
  channelId?: string;
  category?: 'telephony' | 'ai_agent';
  type?: string;
  isActive?: boolean;
  includeInactive?: boolean;
}

export async function getChannelProviders(
  options: SearchProvidersOptions = {}
): Promise<ChannelProviderListResponse> {
  await dbConnect();

  const query: Record<string, unknown> = {};

  if (options.channelId) {
    query.channelId = new mongoose.Types.ObjectId(options.channelId);
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.type) {
    query.type = options.type;
  }

  if (!options.includeInactive) {
    query.isActive = true;
  } else if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }

  const providers = await ChannelProvider.find(query)
    .sort({ priority: -1, name: 1 })
    .populate('channelId', 'code name');

  return {
    providers: providers.map(toProviderResponse),
    total: providers.length,
  };
}

export async function getChannelProviderById(
  id: string
): Promise<ChannelProviderResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const provider = await ChannelProvider.findById(id);
  return provider ? toProviderResponse(provider) : null;
}

export async function getDefaultProvider(
  channelId: string,
  category: 'telephony' | 'ai_agent'
): Promise<ChannelProviderResponse | null> {
  await dbConnect();

  const provider = await ChannelProvider.findOne({
    channelId: new mongoose.Types.ObjectId(channelId),
    category,
    isDefault: true,
    isActive: true,
  });

  if (provider) {
    return toProviderResponse(provider);
  }

  // Если нет провайдера по умолчанию, возвращаем первый активный по приоритету
  const fallback = await ChannelProvider.findOne({
    channelId: new mongoose.Types.ObjectId(channelId),
    category,
    isActive: true,
  }).sort({ priority: -1 });

  return fallback ? toProviderResponse(fallback) : null;
}

export async function createChannelProvider(
  data: CreateChannelProviderDTO
): Promise<ChannelProviderResponse> {
  await dbConnect();

  // Определяем категорию
  const category = TELEPHONY_PROVIDER_TYPES.includes(
    data.type as typeof TELEPHONY_PROVIDER_TYPES[number]
  ) ? 'telephony' : 'ai_agent';

  // Получаем capabilities из метаданных, если не указаны
  const capabilities = data.capabilities || PROVIDER_METADATA[data.type]?.capabilities || [];

  // Генерируем webhook URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const webhookUrl = `${baseUrl}/api/webhooks/${data.type}`;

  // Шифруем конфигурацию
  const configEncrypted = encryptConfig(data.config as unknown as Record<string, unknown>);

  const provider = await ChannelProvider.create({
    channelId: new mongoose.Types.ObjectId(data.channelId),
    type: data.type,
    category,
    name: data.name,
    description: data.description,
    configEncrypted,
    webhookUrl,
    capabilities,
    isDefault: data.isDefault ?? false,
    priority: data.priority ?? 0,
    isActive: data.isActive ?? true,
    healthStatus: 'unknown',
  });

  return toProviderResponse(provider);
}

export async function updateChannelProvider(
  id: string,
  data: UpdateChannelProviderDTO
): Promise<ChannelProviderResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const provider = await ChannelProvider.findById(id).select('+configEncrypted');
  if (!provider) return null;

  // Обновляем поля
  if (data.name !== undefined) provider.name = data.name;
  if (data.description !== undefined) provider.description = data.description;
  if (data.capabilities !== undefined) provider.capabilities = data.capabilities;
  if (data.isDefault !== undefined) provider.isDefault = data.isDefault;
  if (data.priority !== undefined) provider.priority = data.priority;
  if (data.isActive !== undefined) provider.isActive = data.isActive;

  // Обновляем конфигурацию (partial update)
  if (data.config) {
    provider.configEncrypted = updateEncryptedConfig(
      provider.configEncrypted,
      data.config as Record<string, unknown>
    );
  }

  await provider.save();

  return toProviderResponse(provider);
}

export async function deleteChannelProvider(id: string): Promise<boolean> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return false;

  const result = await ChannelProvider.findByIdAndDelete(id);
  return !!result;
}

// === Получение конфигурации (для внутреннего использования) ===

export async function getProviderConfig(id: string): Promise<ProviderConfig | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const provider = await ChannelProvider.findById(id).select('+configEncrypted');
  if (!provider) return null;

  return decryptConfig(provider.configEncrypted) as unknown as ProviderConfig;
}

// === Health Check ===

export async function updateProviderHealth(
  id: string,
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
): Promise<void> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return;

  await ChannelProvider.findByIdAndUpdate(id, {
    healthStatus: status,
    lastHealthCheck: new Date(),
  });
}

// === Получение провайдеров для маршрутизации ===

export async function getProvidersForRouting(
  channelId: string,
  category: 'telephony' | 'ai_agent'
): Promise<ChannelProviderResponse[]> {
  await dbConnect();

  const providers = await ChannelProvider.find({
    channelId: new mongoose.Types.ObjectId(channelId),
    category,
    isActive: true,
  }).sort({ isDefault: -1, priority: -1 });

  return providers.map(toProviderResponse);
}

// === Проверка существования провайдера по типу для канала ===

export async function hasProviderOfType(
  channelId: string,
  type: string
): Promise<boolean> {
  await dbConnect();

  const count = await ChannelProvider.countDocuments({
    channelId: new mongoose.Types.ObjectId(channelId),
    type,
  });

  return count > 0;
}
