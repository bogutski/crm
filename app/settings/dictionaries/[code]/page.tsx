import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
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
          <ChevronLeft className="w-4 h-4" />
          Назад к словарям
        </Link>
      </div>
      <DictionaryItemsList dictionaryCode={code} />
    </div>
  );
}
