import { auth } from '@/modules/user';
import { redirect } from 'next/navigation';
import { Header } from '../components/Header';
import { ContactsTable } from './components/ContactsTable';
import { ContactsSearch } from './components/ContactsSearch';
import { CreateContactButton } from './components/CreateContactButton';

interface ContactsPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
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
        <div>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Контакты
            </h2>
            <ContactsSearch initialSearch={params.search || ''} />
            <CreateContactButton />
          </div>
          <ContactsTable
            initialPage={params.page ? parseInt(params.page, 10) : 1}
            initialSearch={params.search || ''}
          />
        </div>
      </main>
    </div>
  );
}
