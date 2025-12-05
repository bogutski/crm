import { NextRequest, NextResponse } from 'next/server';
import { getContacts } from '@/modules/contact';
import { getOpportunities } from '@/modules/opportunity';
import { getTasks } from '@/modules/task';
import { apiAuth } from '@/lib/api-auth';

export interface GlobalSearchResult {
  contacts: {
    items: Array<{ id: string; name: string; company?: string; email?: string }>;
    total: number;
  };
  opportunities: {
    items: Array<{ id: string; name?: string; amount?: number; stage?: string }>;
    total: number;
  };
  tasks: {
    items: Array<{ id: string; title: string; status: string; dueDate?: Date }>;
    total: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({
        contacts: { items: [], total: 0 },
        opportunities: { items: [], total: 0 },
        tasks: { items: [], total: 0 },
      });
    }

    const searchQuery = query.trim();
    const limit = 10; // Показываем по 10 результатов на категорию

    const [contactsResult, opportunitiesResult, tasksResult] = await Promise.all([
      getContacts({ search: searchQuery, limit }),
      getOpportunities({ search: searchQuery, limit }),
      getTasks({ search: searchQuery, limit }),
    ]);

    const result: GlobalSearchResult = {
      contacts: {
        items: contactsResult.contacts.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company,
          email: c.emails?.[0]?.address,
        })),
        total: contactsResult.total,
      },
      opportunities: {
        items: opportunitiesResult.opportunities.map((o) => ({
          id: o.id,
          name: o.name,
          amount: o.amount,
          stage: o.stage?.name,
        })),
        total: opportunitiesResult.total,
      },
      tasks: {
        items: tasksResult.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          dueDate: t.dueDate,
        })),
        total: tasksResult.total,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in global search:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
