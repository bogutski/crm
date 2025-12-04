'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SquareKanban, Table } from 'lucide-react';
import { OpportunitiesTable } from './OpportunitiesTable';
import { KanbanBoard } from './KanbanBoard';
import { OpportunitiesSearch } from './OpportunitiesSearch';
import { CreateOpportunityButton } from './CreateOpportunityButton';
import { OpportunitiesFilters } from './OpportunitiesFilters';

interface Pipeline {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
  stages: Stage[];
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  probability: number;
  isInitial: boolean;
  isFinal: boolean;
  isWon: boolean;
}

type ViewMode = 'table' | 'kanban';

interface OpportunitiesPageContentProps {
  initialPage?: number;
  initialSearch?: string;
  initialView?: ViewMode;
}

export function OpportunitiesPageContent({ initialPage = 1, initialSearch = '', initialView }: OpportunitiesPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stages, setStages] = useState<Stage[]>([]);
  const [filters, setFilters] = useState({
    ownerId: searchParams.get('ownerId') || undefined,
    priorityId: searchParams.get('priorityId') || undefined,
    stageId: searchParams.get('stageId') || undefined,
  });

  // Read viewMode from URL
  const viewModeFromUrl = (searchParams.get('view') || initialView || 'table') as ViewMode;
  const viewMode = viewModeFromUrl;

  // Load pipelines
  useEffect(() => {
    async function fetchPipelines() {
      try {
        const response = await fetch('/api/pipelines');
        if (response.ok) {
          const data = await response.json();
          setPipelines(data.pipelines || []);

          if (data.pipelines?.length > 0) {
            const defaultPipeline = data.pipelines.find((p: Pipeline) => p.isDefault);
            const pipelineFromUrl = searchParams.get('pipeline');

            if (pipelineFromUrl) {
              const found = data.pipelines.find((p: Pipeline) => p.id === pipelineFromUrl);
              if (found) {
                setSelectedPipelineId(found.id);
              } else {
                setSelectedPipelineId(defaultPipeline?.id || data.pipelines[0].id);
              }
            } else {
              setSelectedPipelineId(defaultPipeline?.id || data.pipelines[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching pipelines:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPipelines();
  }, [searchParams]);

  // Load stages for selected pipeline
  useEffect(() => {
    async function fetchStages() {
      if (!selectedPipelineId) return;

      try {
        const response = await fetch(`/api/pipelines/${selectedPipelineId}`);
        if (response.ok) {
          const data = await response.json();
          setStages(data.stages || []);
        }
      } catch (error) {
        console.error('Error fetching stages:', error);
      }
    }

    fetchStages();
  }, [selectedPipelineId]);

  const handlePipelineChange = useCallback((pipelineId: string) => {
    setSelectedPipelineId(pipelineId);

    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('pipeline', pipelineId);
    newParams.delete('page');
    router.push(`?${newParams.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (mode === 'table') {
      newParams.delete('view');
    } else {
      newParams.set('view', mode);
    }
    router.push(`?${newParams.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleFilterChange = useCallback((newFilters: {
    ownerId: string | undefined;
    priorityId: string | undefined;
    stageId: string | undefined;
  }) => {
    setFilters(newFilters);

    // Update URL
    const newParams = new URLSearchParams(searchParams.toString());

    if (newFilters.ownerId) {
      newParams.set('ownerId', newFilters.ownerId);
    } else {
      newParams.delete('ownerId');
    }

    if (newFilters.priorityId) {
      newParams.set('priorityId', newFilters.priorityId);
    } else {
      newParams.delete('priorityId');
    }

    if (newFilters.stageId) {
      newParams.set('stageId', newFilters.stageId);
    } else {
      newParams.delete('stageId');
    }

    newParams.delete('page'); // Reset page when changing filters
    router.push(`?${newParams.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  const currentSearch = searchParams.get('search') || initialSearch;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header row: Title + Pipeline tabs + View toggle + Search + Create button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Сделки
          </h2>

          {/* Pipeline Tabs + View Toggle */}
          {pipelines.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Pipeline Tabs */}
              <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                {pipelines.map((pipeline) => (
                  <button
                    key={pipeline.id}
                    onClick={() => handlePipelineChange(pipeline.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      selectedPipelineId === pipeline.id
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
                    }`}
                  >
                    {pipeline.name}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                <button
                  onClick={() => handleViewModeChange('table')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
                  }`}
                  title="Таблица"
                >
                  <Table className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
                  }`}
                  title="Kanban"
                >
                  <SquareKanban className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {viewMode === 'table' && (
            <OpportunitiesFilters
              pipelineId={selectedPipelineId}
              stages={stages}
              ownerId={filters.ownerId}
              priorityId={filters.priorityId}
              stageId={filters.stageId}
              onFilterChange={handleFilterChange}
            />
          )}
          <OpportunitiesSearch initialSearch={currentSearch} />
          <CreateOpportunityButton />
        </div>
      </div>

      {/* Empty state for no pipelines */}
      {pipelines.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <p>Воронки не настроены</p>
          <Link
            href="/settings/pipelines"
            className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Настроить воронки
          </Link>
        </div>
      ) : (
        /* Content */
        <>
          {viewMode === 'table' ? (
            <OpportunitiesTable
              initialPage={initialPage}
              initialSearch={currentSearch}
              pipelineId={selectedPipelineId}
              ownerId={filters.ownerId}
              priorityId={filters.priorityId}
              stageId={filters.stageId}
            />
          ) : (
            <div className="h-[calc(100vh-168px)] flex flex-col min-h-0">
              <KanbanBoard
                pipelineId={selectedPipelineId!}
                stages={stages}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
