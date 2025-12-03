import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import { Interaction } from '@/modules/interaction/model';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get all contacts that have at least one interaction
    // with aggregated unread count (status != 'read' and direction == 'inbound')
    const contactsWithMessages = await Interaction.aggregate([
      // Group by contactId
      {
        $group: {
          _id: '$contactId',
          lastMessage: { $last: '$content' },
          lastMessageAt: { $max: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$direction', 'inbound'] },
                  { $ne: ['$status', 'read'] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      // Sort by last message date (most recent first)
      { $sort: { lastMessageAt: -1 } },
      // Lookup contact details
      {
        $lookup: {
          from: 'contacts',
          localField: '_id',
          foreignField: '_id',
          as: 'contact'
        }
      },
      { $unwind: '$contact' },
      // Project final shape
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          contactId: { $toString: '$_id' },
          name: '$contact.name',
          company: '$contact.company',
          position: '$contact.position',
          emails: '$contact.emails',
          phones: '$contact.phones',
          lastMessage: 1,
          lastMessageAt: 1,
          unreadCount: 1
        }
      }
    ]);

    return NextResponse.json({
      contacts: contactsWithMessages,
      total: contactsWithMessages.length
    });
  } catch (error) {
    console.error('Error fetching chat contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat contacts' },
      { status: 500 }
    );
  }
}
