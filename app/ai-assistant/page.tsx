import { Metadata } from 'next';
import { auth } from '@/modules/user';
import { redirect } from 'next/navigation';
import { Header } from '../components/Header';
import { DialoguesPageContent } from './components/DialoguesPageContent';
import { SocketWrapper } from '../components/SocketWrapper';

export const metadata: Metadata = {
  title: 'AI Assistant | CRM',
  description: 'AI ассистент для работы с CRM',
};

export default async function AIDialoguesPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userId = (session.user as any)?.id;

  return (
    <SocketWrapper userId={userId}>
      <div className="h-screen flex flex-col bg-white dark:bg-black">
        <Header userName={session?.user?.name || session?.user?.email} />

        <main className="flex-1 flex flex-col px-6 pt-6 min-h-0">
          <DialoguesPageContent />
        </main>
      </div>
    </SocketWrapper>
  );
}
