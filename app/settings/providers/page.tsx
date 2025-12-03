import { ProvidersList } from './components/ProvidersList';

export default function ProvidersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Провайдеры
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Управление провайдерами телефонии и AI агентами
          </p>
        </div>
      </div>
      <ProvidersList />
    </div>
  );
}
