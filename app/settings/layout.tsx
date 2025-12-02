import { auth } from '@/modules/user';
import { redirect } from 'next/navigation';
import { Header } from '../components/Header';
import { SettingsNav } from './components/SettingsNav';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header userName={session?.user?.name || session?.user?.email} />
      <div className="flex">
        <SettingsNav />
        <main className="flex-1 p-6 bg-white dark:bg-black">{children}</main>
      </div>
    </div>
  );
}
