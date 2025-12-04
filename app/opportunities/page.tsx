import { auth } from '@/modules/user';
import { redirect } from 'next/navigation';
import { Header } from '../components/Header';
import { OpportunitiesPageContent } from './components/OpportunitiesPageContent';

interface OpportunitiesPageProps {
  searchParams: Promise<{ page?: string; search?: string; pipeline?: string; view?: string }>;
}

export default async function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header userName={session?.user?.name || session?.user?.email} />

      <main className="px-6 py-6">
        <OpportunitiesPageContent
          initialPage={params.page ? parseInt(params.page, 10) : 1}
          initialSearch={params.search || ''}
          initialView={params.view as 'table' | 'kanban' | undefined}
        />
      </main>
    </div>
  );
}
