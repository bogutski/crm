'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OpportunitiesTable } from './OpportunitiesTable';
import { KanbanBoard } from './KanbanBoard';
import { PipelineTabs } from './PipelineTabs';

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

interface OpportunitiesViewProps {
  initialPage?: number;
  initialSearch?: string;
}

export function OpportunitiesView({ initialPage = 1, initialSearch = '' }: OpportunitiesViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isLoading, setIsLoading] = useState(true);

  // Load pipelines
  useEffect(() => {
    async function fetchPipelines() {
      try {
        const response = await fetch('/api/pipelines');
        if (response.ok) {
          const data = await response.json();
          setPipelines(data.pipelines || []);

          // Select default pipeline or first one
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
  const [stages, setStages] = useState<Stage[]>([]);

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

    // Update URL
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('pipeline', pipelineId);
    newParams.delete('page'); // Reset page when changing pipeline
    router.push(`?${newParams.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  if (pipelines.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        <p>Воронки не настроены</p>
        <Link
          href="/settings/pipelines"
          className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Настроить воронки
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline tabs + View toggle - on header level */}
      <div className="flex items-center gap-4">
        <PipelineTabs
          pipelines={pipelines}
          selectedPipelineId={selectedPipelineId}
          onPipelineChange={handlePipelineChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <OpportunitiesTable
          initialPage={initialPage}
          initialSearch={initialSearch}
          pipelineId={selectedPipelineId}
        />
      ) : (
        <KanbanBoard
          pipelineId={selectedPipelineId!}
          stages={stages}
        />
      )}
    </div>
  );
}
