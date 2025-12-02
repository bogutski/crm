import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import {
  getContacts,
  createContact,
  createContactSchema,
  contactFiltersSchema,
} from '@/modules/contact';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = contactFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const result = await getContacts(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createContactSchema.parse(body);

    const contact = await createContact({
      ...data,
      ownerId: session.user.id,
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
