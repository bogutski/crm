import { UsersList } from './components/UsersList';

export default function UsersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Пользователи
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Управление пользователями системы
          </p>
        </div>
      </div>
      <UsersList />
    </div>
  );
}
