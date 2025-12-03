import { auth } from '@/modules/user';
import { redirect } from 'next/navigation';
import { Header } from '../components/Header';
import { TasksPageContent } from './components/TasksPageContent';

interface TasksPageProps {
  searchParams: Promise<{ page?: string; search?: string; project?: string; status?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-black">
      <Header userName={session?.user?.name || session?.user?.email} />

      <main className="flex-1 flex flex-col px-6 pt-6 min-h-0">
        <TasksPageContent
          initialPage={params.page ? parseInt(params.page, 10) : 1}
          initialSearch={params.search || ''}
          initialProjectId={params.project || null}
          initialStatus={params.status || null}
        />
      </main>
    </div>
  );
}
