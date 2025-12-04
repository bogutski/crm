import { auth } from '@/modules/user';
import { redirect } from 'next/navigation';
import { Header } from '../components/Header';
import { ContactsPageContent } from './components/ContactsPageContent';

interface ContactsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    ownerId?: string;
    contactType?: string;
    source?: string;
  }>;
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header userName={session?.user?.name || session?.user?.email} />

      <main className="px-6 py-6">
        <ContactsPageContent
          initialPage={params.page ? parseInt(params.page, 10) : 1}
          initialSearch={params.search || ''}
          initialOwnerId={params.ownerId}
          initialContactType={params.contactType}
          initialSource={params.source}
        />
      </main>
    </div>
  );
}
