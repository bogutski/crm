import { ApiTokensList } from './components/ApiTokensList';

export default function ApiSettingsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            API Токены
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Управление токенами для доступа к API
          </p>
        </div>
      </div>
      <ApiTokensList />
    </div>
  );
}
