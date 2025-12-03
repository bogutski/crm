import { auth } from '@/modules/user';
import { redirect } from 'next/navigation';
import { Header } from '../components/Header';
import { ChatPageContent } from './components/ChatPageContent';

export default async function ChatPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-black">
      <Header userName={session?.user?.name || session?.user?.email} />
      <ChatPageContent />
    </div>
  );
}
