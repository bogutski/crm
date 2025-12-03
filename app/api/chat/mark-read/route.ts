import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import { Interaction } from '@/modules/interaction/model';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { contactId } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId is required' },
        { status: 400 }
      );
    }

    // Mark all inbound messages for this contact as read
    const result = await Interaction.updateMany(
      {
        contactId: new mongoose.Types.ObjectId(contactId),
        direction: 'inbound',
        status: { $ne: 'read' }
      },
      { $set: { status: 'read' } }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
