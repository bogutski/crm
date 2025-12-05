import mongoose from 'mongoose';
import { createInteraction as createInteractionController } from '@/modules/interaction/controller';
import { Channel } from '@/modules/channel/model';
import { getContactById } from '@/modules/contact/controller';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import { CreateInteractionParams } from '../types';

export async function createInteraction(params: CreateInteractionParams, userId: string) {
  await dbConnect();

  const { contactId, channelCode, direction, subject, content, opportunityId } = params;

  // Verify contact exists
  const contact = await getContactById(contactId);
  if (!contact) {
    return {
      success: false,
      error: 'Контакт не найден',
    };
  }

  // Find channel by code
  const channel = await Channel.findOne({ code: channelCode, isActive: true });
  if (!channel) {
    // Get available channels for error message
    const availableChannels = await Channel.find({ isActive: true }).select('code name');
    return {
      success: false,
      error: `Канал "${channelCode}" не найден. Доступные каналы: ${availableChannels.map((c) => c.code).join(', ')}`,
    };
  }

  const interaction = await createInteractionController({
    channelId: channel._id.toString(),
    contactId,
    opportunityId,
    direction,
    subject,
    content,
    status: 'sent',
  }, userId);

  return {
    success: true,
    message: `Взаимодействие с ${contact.name} через ${channel.name} записано`,
    interaction: {
      id: interaction.id,
      channel: channel.name,
      direction: direction === 'inbound' ? 'входящее' : 'исходящее',
      subject: interaction.subject,
      content: interaction.content,
      contact: {
        id: contact.id,
        name: contact.name,
      },
      createdAt: interaction.createdAt,
    },
  };
}
