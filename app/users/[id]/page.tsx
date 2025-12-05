import { auth } from '@/modules/user';
import { redirect } from 'next/navigation';
import { Header } from '@/app/components/Header';
import { UserView } from './components/UserView';

interface UserPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-black">
      <Header userName={session?.user?.name || session?.user?.email} />

      <main className="flex-1 flex min-h-0">
        <UserView userId={id} />
      </main>
    </div>
  );
}
