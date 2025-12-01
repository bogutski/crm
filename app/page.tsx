import { auth } from '@/modules/user';
import { LogoutButton } from './components/LogoutButton';

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          CRM Proto
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {session?.user?.name || session?.user?.email}
          </span>
          <LogoutButton />
        </div>
      </header>

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
