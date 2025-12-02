import Link from 'next/link';
import { DictionaryItemsList } from './components/DictionaryItemsList';

interface DictionaryPageProps {
  params: Promise<{ code: string }>;
}

export default async function DictionaryPage({ params }: DictionaryPageProps) {
  const { code } = await params;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/settings/dictionaries"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 mb-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Назад к словарям
        </Link>
      </div>
      <DictionaryItemsList dictionaryCode={code} />
    </div>
  );
}
