import { NextRequest, NextResponse } from 'next/server';
import { getContacts } from '@/modules/contact';
import { getOpportunities } from '@/modules/opportunity';
import { getTasks } from '@/modules/task';
import { apiAuth } from '@/lib/api-auth';
import { z } from 'zod';

const searchRequestSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { query } = searchRequestSchema.parse(body);

    // Perform parallel searches across all entities
    const [contactsResult, opportunitiesResult, tasksResult] = await Promise.all([
      getContacts({ search: query, limit: 5, page: 1 }).catch(() => ({ contacts: [], total: 0 })),
      getOpportunities({ search: query, limit: 5, page: 1 }).catch(() => ({ opportunities: [], total: 0 })),
      getTasks({ search: query, limit: 5, page: 1 }).catch(() => ({ tasks: [], total: 0 })),
    ]);

    // Transform results to match expected format
    const response = {
      contacts: {
        items: contactsResult.contacts.map((contact) => ({
          id: contact.id,
          name: contact.name,
          company: contact.company,
          email: contact.emails?.[0]?.address,
        })),
        total: contactsResult.total,
      },
      opportunities: {
        items: opportunitiesResult.opportunities.map((opp) => ({
          id: opp.id,
          name: opp.name,
          amount: opp.amount,
          stage: opp.stage?.name,
        })),
        total: opportunitiesResult.total,
      },
      tasks: {
        items: tasksResult.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          dueDate: task.dueDate,
        })),
        total: tasksResult.total,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Global search error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to perform search', details: errorMessage },
      { status: 500 }
    );
  }
}
