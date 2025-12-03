import { auth } from '@/modules/user';
import { redirect } from 'next/navigation';
import { Header } from '../components/Header';
import { OpportunitiesPageContent } from './components/OpportunitiesPageContent';

interface OpportunitiesPageProps {
  searchParams: Promise<{ page?: string; search?: string; pipeline?: string }>;
}

export default async function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-black">
      <Header userName={session?.user?.name || session?.user?.email} />

      <main className="flex-1 flex flex-col px-6 pt-6 min-h-0">
        <OpportunitiesPageContent
          initialPage={params.page ? parseInt(params.page, 10) : 1}
          initialSearch={params.search || ''}
        />
      </main>
    </div>
  );
}
