import { AISettingsForm } from './components/AISettingsForm';

export default function AISettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          AI Ассистент
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Подключите AI провайдера для использования ассистента
        </p>
      </div>
      <AISettingsForm />
    </div>
  );
}
