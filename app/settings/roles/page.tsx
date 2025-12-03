import { RolesList } from './components/RolesList';

export default function RolesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Роли
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Системные роли и уровни доступа
          </p>
        </div>
      </div>
      <RolesList />
    </div>
  );
}
