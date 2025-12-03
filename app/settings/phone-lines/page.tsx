import { PhoneLinesList } from './components/PhoneLinesList';

export default function PhoneLinesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Телефонные линии
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Управление телефонными номерами и настройками переадресации
          </p>
        </div>
      </div>
      <PhoneLinesList />
    </div>
  );
}
