import { TelephonyProvidersForm } from './components/TelephonyProvidersForm';

export default function TelephonySettingsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Телефония
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Подключите провайдера телефонии для совершения и приёма звонков
        </p>
      </div>
      <TelephonyProvidersForm />
    </div>
  );
}
