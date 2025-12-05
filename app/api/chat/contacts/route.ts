import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import { Interaction } from '@/modules/interaction/model';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const priorityContactId = searchParams.get('priorityContactId') || '';
    const skip = (page - 1) * limit;

    // Build match stage for search
    const searchMatch = search
      ? {
          $match: {
            $or: [
              { 'contact.name': { $regex: search, $options: 'i' } },
              { 'contact.company': { $regex: search, $options: 'i' } },
              { lastMessage: { $regex: search, $options: 'i' } }
            ]
          }
        }
      : null;

    // Get all contacts that have at least one interaction
    // with aggregated unread count (status != 'read' and direction == 'inbound')
    const pipeline: any[] = [
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
    ];

    // Add search match if search query provided
    if (searchMatch) {
      pipeline.push(searchMatch);
    }

    // Get total count using facet
    const result = await Interaction.aggregate([
      ...pipeline,
      {
        $facet: {
          contacts: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }]
        }
      }
    ]);

    let contacts = result[0]?.contacts || [];
    const total = result[0]?.totalCount[0]?.count || 0;
    const hasMore = skip + contacts.length < total;

    // On first page, if priorityContactId is provided, ensure it's included
    if (page === 1 && priorityContactId && !search) {
      const priorityExists = contacts.some((c: any) => c.contactId === priorityContactId);

      if (!priorityExists) {
        // Fetch the priority contact separately
        try {
          const priorityResult = await Interaction.aggregate([
            { $match: { contactId: new mongoose.Types.ObjectId(priorityContactId) } },
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
            {
              $lookup: {
                from: 'contacts',
                localField: '_id',
                foreignField: '_id',
                as: 'contact'
              }
            },
            { $unwind: '$contact' },
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

          if (priorityResult.length > 0) {
            // Add priority contact at the beginning
            contacts = [priorityResult[0], ...contacts];
          }
        } catch {
          // Invalid ObjectId, ignore
        }
      }
    }

    return NextResponse.json({
      contacts,
      total,
      page,
      limit,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching chat contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat contacts' },
      { status: 500 }
    );
  }
}
