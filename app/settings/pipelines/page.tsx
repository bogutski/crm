import { PipelinesList } from './components/PipelinesList';

export default function PipelinesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Воронки продаж
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Управление воронками и этапами сделок
          </p>
        </div>
      </div>
      <PipelinesList />
    </div>
  );
}
