import { GeneralSettingsForm } from './components/GeneralSettingsForm';

export default function GeneralSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Общие настройки
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Основные настройки системы
        </p>
      </div>
      <GeneralSettingsForm />
    </div>
  );
}
