import { getContactById } from '@/modules/contact/controller';
import { getOpportunitiesByContact } from '@/modules/opportunity/controller';
import { getInteractionsByContact } from '@/modules/interaction/controller';
import { GetContactDetailsParams } from '../types';

export async function getContactDetails(params: GetContactDetailsParams) {
  const { contactId, includeInteractions, includeOpportunities } = params;

  const contact = await getContactById(contactId);

  if (!contact) {
    return {
      success: false,
      error: 'Контакт не найден',
    };
  }

  const result: Record<string, unknown> = {
    success: true,
    contact: {
      id: contact.id,
      name: contact.name,
      company: contact.company,
      position: contact.position,
      notes: contact.notes,
      emails: contact.emails?.map((e) => ({
        address: e.address,
        isVerified: e.isVerified,
        isSubscribed: e.isSubscribed,
      })) || [],
      phones: contact.phones?.map((p) => ({
        number: p.international || p.e164,
        type: p.type,
        isPrimary: p.isPrimary,
      })) || [],
      contactType: contact.contactType?.name,
      source: contact.source,
      owner: contact.owner?.name,
      createdAt: contact.createdAt,
    },
  };

  if (includeOpportunities) {
    const opportunities = await getOpportunitiesByContact(contactId);
    result.opportunities = {
      total: opportunities.length,
      totalAmount: opportunities.reduce((sum, o) => sum + (o.amount || 0), 0),
      items: opportunities.slice(0, 10).map((opp) => ({
        id: opp.id,
        name: opp.name,
        amount: opp.amount,
        stage: opp.stage?.name,
        stageColor: opp.stage?.color,
        closingDate: opp.closingDate,
        isWon: opp.stage?.isWon,
      })),
    };
  }

  if (includeInteractions) {
    const interactionsResult = await getInteractionsByContact(contactId, 10, 0);
    result.interactions = {
      total: interactionsResult.total,
      items: interactionsResult.interactions.map((i) => ({
        id: i.id,
        channel: i.channel?.name,
        channelIcon: i.channel?.icon,
        direction: i.direction,
        subject: i.subject,
        content: i.content?.substring(0, 200),
        createdAt: i.createdAt,
      })),
    };
  }

  return result;
}
