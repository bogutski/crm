import { UserPhoneLine, IUserPhoneLine } from './model';
import {
  UserPhoneLineResponse,
  UserPhoneLineListResponse,
  CreateUserPhoneLineDTO,
  UpdateUserPhoneLineDTO,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

// === Преобразователь в Response ===

function toPhoneLineResponse(
  line: IUserPhoneLine,
  providerInfo?: { name: string; type: string }
): UserPhoneLineResponse {
  return {
    id: line._id.toString(),
    userId: line.userId.toString(),
    providerId: line.providerId.toString(),
    providerName: providerInfo?.name,
    providerType: providerInfo?.type,
    phoneNumber: line.phoneNumber,
    displayName: line.displayName,
    capabilities: line.capabilities,
    isDefault: line.isDefault,
    isActive: line.isActive,
    forwardingEnabled: line.forwardingEnabled,
    forwardTo: line.forwardTo,
    forwardOnBusy: line.forwardOnBusy,
    forwardOnNoAnswer: line.forwardOnNoAnswer,
    forwardOnOffline: line.forwardOnOffline,
    forwardAfterRings: line.forwardAfterRings,
    lastInboundCall: line.lastInboundCall,
    lastOutboundCall: line.lastOutboundCall,
    totalInboundCalls: line.totalInboundCalls,
    totalOutboundCalls: line.totalOutboundCalls,
    createdAt: line.createdAt,
    updatedAt: line.updatedAt,
  };
}

// === CRUD ===

export interface SearchPhoneLinesOptions {
  userId?: string;
  providerId?: string;
  isActive?: boolean;
  includeInactive?: boolean;
  capability?: string;
}

export async function getUserPhoneLines(
  options: SearchPhoneLinesOptions = {}
): Promise<UserPhoneLineListResponse> {
  await dbConnect();

  const query: Record<string, unknown> = {};

  if (options.userId) {
    query.userId = new mongoose.Types.ObjectId(options.userId);
  }

  if (options.providerId) {
    query.providerId = new mongoose.Types.ObjectId(options.providerId);
  }

  if (!options.includeInactive) {
    query.isActive = true;
  } else if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }

  if (options.capability) {
    query.capabilities = options.capability;
  }

  const lines = await UserPhoneLine.find(query)
    .sort({ isDefault: -1, displayName: 1 })
    .populate('providerId', 'name type');

  const results = lines.map(line => {
    const provider = line.providerId as unknown as { name: string; type: string } | null;
    return toPhoneLineResponse(
      line,
      provider ? { name: provider.name, type: provider.type } : undefined
    );
  });

  return {
    lines: results,
    total: results.length,
  };
}

export async function getUserPhoneLineById(
  id: string
): Promise<UserPhoneLineResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const line = await UserPhoneLine.findById(id)
    .populate('providerId', 'name type');

  if (!line) return null;

  const provider = line.providerId as unknown as { name: string; type: string } | null;
  return toPhoneLineResponse(
    line,
    provider ? { name: provider.name, type: provider.type } : undefined
  );
}

export async function getUserPhoneLineByNumber(
  phoneNumber: string
): Promise<UserPhoneLineResponse | null> {
  await dbConnect();

  const line = await UserPhoneLine.findOne({ phoneNumber })
    .populate('providerId', 'name type');

  if (!line) return null;

  const provider = line.providerId as unknown as { name: string; type: string } | null;
  return toPhoneLineResponse(
    line,
    provider ? { name: provider.name, type: provider.type } : undefined
  );
}

export async function getDefaultLineForUser(
  userId: string
): Promise<UserPhoneLineResponse | null> {
  await dbConnect();

  const line = await UserPhoneLine.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    isDefault: true,
    isActive: true,
  }).populate('providerId', 'name type');

  if (line) {
    const provider = line.providerId as unknown as { name: string; type: string } | null;
    return toPhoneLineResponse(
      line,
      provider ? { name: provider.name, type: provider.type } : undefined
    );
  }

  // Если нет линии по умолчанию, возвращаем первую активную
  const fallback = await UserPhoneLine.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    isActive: true,
  }).populate('providerId', 'name type');

  if (!fallback) return null;

  const provider = fallback.providerId as unknown as { name: string; type: string } | null;
  return toPhoneLineResponse(
    fallback,
    provider ? { name: provider.name, type: provider.type } : undefined
  );
}

export async function createUserPhoneLine(
  data: CreateUserPhoneLineDTO
): Promise<UserPhoneLineResponse> {
  await dbConnect();

  const line = await UserPhoneLine.create({
    userId: new mongoose.Types.ObjectId(data.userId),
    providerId: new mongoose.Types.ObjectId(data.providerId),
    phoneNumber: data.phoneNumber,
    displayName: data.displayName,
    capabilities: data.capabilities || ['voice', 'sms'],
    isDefault: data.isDefault ?? false,
    isActive: data.isActive ?? true,
    forwardingEnabled: data.forwardingEnabled ?? false,
    forwardTo: data.forwardTo,
    forwardOnBusy: data.forwardOnBusy ?? true,
    forwardOnNoAnswer: data.forwardOnNoAnswer ?? true,
    forwardOnOffline: data.forwardOnOffline ?? true,
    forwardAfterRings: data.forwardAfterRings ?? 3,
    totalInboundCalls: 0,
    totalOutboundCalls: 0,
  });

  return toPhoneLineResponse(line);
}

export async function updateUserPhoneLine(
  id: string,
  data: UpdateUserPhoneLineDTO
): Promise<UserPhoneLineResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const line = await UserPhoneLine.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).populate('providerId', 'name type');

  if (!line) return null;

  const provider = line.providerId as unknown as { name: string; type: string } | null;
  return toPhoneLineResponse(
    line,
    provider ? { name: provider.name, type: provider.type } : undefined
  );
}

export async function deleteUserPhoneLine(id: string): Promise<boolean> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return false;

  const result = await UserPhoneLine.findByIdAndDelete(id);
  return !!result;
}

// === Статистика ===

export async function incrementCallCount(
  lineId: string,
  direction: 'inbound' | 'outbound'
): Promise<void> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(lineId)) return;

  const update: Record<string, unknown> = {};
  if (direction === 'inbound') {
    update.$inc = { totalInboundCalls: 1 };
    update.lastInboundCall = new Date();
  } else {
    update.$inc = { totalOutboundCalls: 1 };
    update.lastOutboundCall = new Date();
  }

  await UserPhoneLine.findByIdAndUpdate(lineId, update);
}

// === Получение линий для маршрутизации ===

export async function getLinesForUser(userId: string): Promise<UserPhoneLineResponse[]> {
  await dbConnect();

  const lines = await UserPhoneLine.find({
    userId: new mongoose.Types.ObjectId(userId),
    isActive: true,
  })
    .sort({ isDefault: -1 })
    .populate('providerId', 'name type');

  return lines.map(line => {
    const provider = line.providerId as unknown as { name: string; type: string } | null;
    return toPhoneLineResponse(
      line,
      provider ? { name: provider.name, type: provider.type } : undefined
    );
  });
}

// === Проверка уникальности номера ===

export async function isPhoneNumberAvailable(
  phoneNumber: string,
  excludeId?: string
): Promise<boolean> {
  await dbConnect();

  const query: Record<string, unknown> = { phoneNumber };
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }

  const count = await UserPhoneLine.countDocuments(query);
  return count === 0;
}
