import { Interaction, IInteraction } from './model';
import {
  InteractionResponse,
  InteractionListResponse,
  CreateInteractionDTO,
  UpdateInteractionDTO,
  InteractionFilters,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

// === Преобразователь в Response ===

function toInteractionResponse(
  interaction: IInteraction & {
    channelData?: { _id: mongoose.Types.ObjectId; code: string; name: string; icon: string; color: string }[];
    contactData?: { _id: mongoose.Types.ObjectId; name: string }[];
  }
): InteractionResponse {
  const response: InteractionResponse = {
    id: interaction._id.toString(),
    channelId: interaction.channelId.toString(),
    contactId: interaction.contactId.toString(),
    opportunityId: interaction.opportunityId?.toString(),
    direction: interaction.direction,
    status: interaction.status,
    subject: interaction.subject,
    content: interaction.content,
    duration: interaction.duration,
    recordingUrl: interaction.recordingUrl,
    metadata: interaction.metadata,
    createdAt: interaction.createdAt,
    createdBy: interaction.createdBy?.toString(),
  };

  // Add populated channel
  if (interaction.channelData?.[0]) {
    const ch = interaction.channelData[0];
    response.channel = {
      id: ch._id.toString(),
      code: ch.code,
      name: ch.name,
      icon: ch.icon,
      color: ch.color,
    };
  }

  // Add populated contact
  if (interaction.contactData?.[0]) {
    const ct = interaction.contactData[0];
    response.contact = {
      id: ct._id.toString(),
      name: ct.name,
    };
  }

  return response;
}

// === CRUD ===

export async function getInteractions(
  filters: InteractionFilters = {},
  limit = 50,
  offset = 0
): Promise<InteractionListResponse> {
  await dbConnect();

  const query: Record<string, unknown> = {};

  if (filters.contactId) {
    query.contactId = new mongoose.Types.ObjectId(filters.contactId);
  }
  if (filters.channelId) {
    query.channelId = new mongoose.Types.ObjectId(filters.channelId);
  }
  if (filters.opportunityId) {
    query.opportunityId = new mongoose.Types.ObjectId(filters.opportunityId);
  }
  if (filters.direction) {
    query.direction = filters.direction;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) {
      (query.createdAt as Record<string, Date>).$gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (query.createdAt as Record<string, Date>).$lte = filters.dateTo;
    }
  }

  const [interactions, total] = await Promise.all([
    Interaction.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: 'channels',
          localField: 'channelId',
          foreignField: '_id',
          as: 'channelData',
        },
      },
      {
        $lookup: {
          from: 'contacts',
          localField: 'contactId',
          foreignField: '_id',
          as: 'contactData',
        },
      },
    ]),
    Interaction.countDocuments(query),
  ]);

  return {
    interactions: interactions.map(toInteractionResponse),
    total,
  };
}

export async function getInteractionById(id: string): Promise<InteractionResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const result = await Interaction.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: 'channels',
        localField: 'channelId',
        foreignField: '_id',
        as: 'channelData',
      },
    },
    {
      $lookup: {
        from: 'contacts',
        localField: 'contactId',
        foreignField: '_id',
        as: 'contactData',
      },
    },
  ]);

  return result[0] ? toInteractionResponse(result[0]) : null;
}

export async function getInteractionsByContact(
  contactId: string,
  limit = 50,
  offset = 0
): Promise<InteractionListResponse> {
  return getInteractions({ contactId }, limit, offset);
}

export async function createInteraction(
  data: CreateInteractionDTO,
  userId?: string
): Promise<InteractionResponse> {
  await dbConnect();

  const interaction = await Interaction.create({
    channelId: new mongoose.Types.ObjectId(data.channelId),
    contactId: new mongoose.Types.ObjectId(data.contactId),
    opportunityId: data.opportunityId ? new mongoose.Types.ObjectId(data.opportunityId) : undefined,
    direction: data.direction,
    status: data.status || 'pending',
    subject: data.subject,
    content: data.content,
    duration: data.duration,
    recordingUrl: data.recordingUrl,
    metadata: data.metadata || {},
    createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
  });

  // Fetch with populated fields
  const result = await getInteractionById(interaction._id.toString());
  return result!;
}

export async function updateInteraction(
  id: string,
  data: UpdateInteractionDTO
): Promise<InteractionResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const interaction = await Interaction.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  );

  if (!interaction) return null;

  return getInteractionById(id);
}

export async function deleteInteraction(id: string): Promise<boolean> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return false;

  const result = await Interaction.findByIdAndDelete(id);
  return !!result;
}

// === Stats ===

export async function getInteractionStats(contactId: string): Promise<{
  total: number;
  byChannel: Record<string, number>;
  byDirection: Record<string, number>;
}> {
  await dbConnect();

  const stats = await Interaction.aggregate([
    { $match: { contactId: new mongoose.Types.ObjectId(contactId) } },
    {
      $facet: {
        total: [{ $count: 'count' }],
        byChannel: [
          {
            $lookup: {
              from: 'channels',
              localField: 'channelId',
              foreignField: '_id',
              as: 'channel',
            },
          },
          { $unwind: '$channel' },
          { $group: { _id: '$channel.code', count: { $sum: 1 } } },
        ],
        byDirection: [
          { $group: { _id: '$direction', count: { $sum: 1 } } },
        ],
      },
    },
  ]);

  const result = stats[0];

  return {
    total: result.total[0]?.count || 0,
    byChannel: Object.fromEntries(
      result.byChannel.map((item: { _id: string; count: number }) => [item._id, item.count])
    ),
    byDirection: Object.fromEntries(
      result.byDirection.map((item: { _id: string; count: number }) => [item._id, item.count])
    ),
  };
}
