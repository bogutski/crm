import { auth } from '@/modules/user';
import { Header } from './components/Header';

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header userName={session?.user?.name || session?.user?.email} />

      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Добро пожаловать!
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Вы успешно вошли в систему.
          </p>
        </div>
      </main>
    </div>
  );
}
