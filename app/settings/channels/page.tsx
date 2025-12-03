import { ChannelsList } from './components/ChannelsList';

export default function ChannelsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Каналы коммуникации
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Управление каналами для взаимодействия с контактами
          </p>
        </div>
      </div>
      <ChannelsList />
    </div>
  );
}
