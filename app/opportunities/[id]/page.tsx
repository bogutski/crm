import { auth } from '@/modules/user';
import { redirect, notFound } from 'next/navigation';
import { Header } from '@/app/components/Header';
import { OpportunityView } from './components/OpportunityView';

interface OpportunityPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-black">
      <Header userName={session?.user?.name || session?.user?.email} />

      <main className="flex-1 flex min-h-0">
        <OpportunityView opportunityId={id} />
      </main>
    </div>
  );
}
