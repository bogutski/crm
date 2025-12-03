'use client';

import { LayoutGrid, Table2 } from 'lucide-react';

interface Pipeline {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
}

type ViewMode = 'table' | 'kanban';

interface PipelineTabsProps {
  pipelines: Pipeline[];
  selectedPipelineId: string | null;
  onPipelineChange: (pipelineId: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function PipelineTabs({
  pipelines,
  selectedPipelineId,
  onPipelineChange,
  viewMode,
  onViewModeChange,
}: PipelineTabsProps) {
  if (pipelines.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Pipeline Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
        {pipelines.map((pipeline) => (
          <button
            key={pipeline.id}
            onClick={() => onPipelineChange(pipeline.id)}
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
          onClick={() => onViewModeChange('table')}
          className={`p-1.5 rounded-md transition-colors ${
            viewMode === 'table'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
          }`}
          title="Таблица"
        >
          <Table2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('kanban')}
          className={`p-1.5 rounded-md transition-colors ${
            viewMode === 'kanban'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
          }`}
          title="Kanban"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
