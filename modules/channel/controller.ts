import { Channel, IChannel } from './model';
import {
  ChannelResponse,
  ChannelListResponse,
  CreateChannelDTO,
  UpdateChannelDTO,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import { safeEmitWebhookEvent } from '@/lib/events';
import mongoose from 'mongoose';

// === Преобразователь в Response ===

function toChannelResponse(channel: IChannel): ChannelResponse {
  return {
    id: channel._id.toString(),
    code: channel.code,
    name: channel.name,
    icon: channel.icon,
    color: channel.color,
    isActive: channel.isActive,
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt,
  };
}

// === CRUD ===

export async function getChannels(includeInactive = false): Promise<ChannelListResponse> {
  await dbConnect();

  const query: Record<string, unknown> = {};
  if (!includeInactive) {
    query.isActive = true;
  }

  const channels = await Channel.find(query).sort({ name: 1 });

  return {
    channels: channels.map(toChannelResponse),
    total: channels.length,
  };
}

export async function getChannelById(id: string): Promise<ChannelResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const channel = await Channel.findById(id);
  return channel ? toChannelResponse(channel) : null;
}

export async function getChannelByCode(code: string): Promise<ChannelResponse | null> {
  await dbConnect();

  const channel = await Channel.findOne({ code: code.toLowerCase() });
  return channel ? toChannelResponse(channel) : null;
}

export async function createChannel(data: CreateChannelDTO): Promise<ChannelResponse> {
  await dbConnect();

  const channel = await Channel.create({
    code: data.code.toLowerCase(),
    name: data.name,
    icon: data.icon || 'message-circle',
    color: data.color || '#6b7280',
    isActive: data.isActive ?? true,
  });

  const response = toChannelResponse(channel);

  // Emit webhook event
  safeEmitWebhookEvent('channel', 'created', response);

  return response;
}

export async function updateChannel(
  id: string,
  data: UpdateChannelDTO
): Promise<ChannelResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const channel = await Channel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  );

  if (!channel) return null;

  const response = toChannelResponse(channel);

  // Emit webhook event
  safeEmitWebhookEvent('channel', 'updated', response);

  return response;
}

export async function deleteChannel(id: string): Promise<boolean> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return false;

  const result = await Channel.findByIdAndDelete(id);

  if (result) {
    // Emit webhook event
    safeEmitWebhookEvent('channel', 'deleted', { id });
  }

  return !!result;
}
