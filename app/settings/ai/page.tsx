import { AISettingsForm } from './components/AISettingsForm';

export default function AISettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Настройки AI Ассистента
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Подключите AI провайдера для использования ассистента
        </p>
      </div>
      <AISettingsForm />
    </div>
  );
}
