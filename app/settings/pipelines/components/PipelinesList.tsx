'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus, Star, ChevronRight } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { PipelineForm } from './PipelineForm';
import { Badge } from '@/components/ui/Badge';

interface Pipeline {
  id: string;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
  stagesCount?: number;
}

export function PipelinesList() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [deletingPipeline, setDeletingPipeline] = useState<Pipeline | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPipelines = useCallback(async () => {
    try {
      const response = await fetch('/api/pipelines/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setPipelines(data.pipelines || []);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchPipelines();
  };

  const handleEditSuccess = () => {
    setEditingPipeline(null);
    fetchPipelines();
  };

  const handleDelete = async () => {
    if (!deletingPipeline) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/pipelines/${deletingPipeline.id}`, { method: 'DELETE' });
      setDeletingPipeline(null);
      fetchPipelines();
    } catch (error) {
      console.error('Error deleting pipeline:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (pipeline: Pipeline) => {
    try {
      await fetch(`/api/pipelines/${pipeline.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      fetchPipelines();
    } catch (error) {
      console.error('Error setting default pipeline:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Создать воронку
        </button>
      </div>

      {pipelines.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <p>Воронки пока не созданы</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-sm text-zinc-900 dark:text-zinc-50 underline"
          >
            Создать первую воронку
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className={`border rounded-lg p-4 transition-colors ${
                pipeline.isActive
                  ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/settings/pipelines/${pipeline.id}`}
                      className="text-lg font-medium text-zinc-900 dark:text-zinc-50 hover:underline flex items-center gap-1"
                    >
                      {pipeline.name}
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </Link>
                    {pipeline.isDefault && (
                      <Badge variant="warning" rounded="full">
                        <Star className="w-3 h-3 mr-1" />
                        По умолчанию
                      </Badge>
                    )}
                    {!pipeline.isActive && (
                      <Badge variant="default" rounded="full">
                        Неактивна
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
                    {pipeline.code}
                  </p>
                  {pipeline.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                      {pipeline.description}
                    </p>
                  )}
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                    {pipeline.stagesCount || 0} этапов
                  </p>
                </div>
                <div className="flex gap-1">
                  {!pipeline.isDefault && pipeline.isActive && (
                    <button
                      onClick={() => handleSetDefault(pipeline)}
                      className="p-1.5 text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                      title="Сделать по умолчанию"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingPipeline(pipeline)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    title="Редактировать"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingPipeline(pipeline)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Создание воронки */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Создать воронку"
      >
        <PipelineForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateOpen(false)} />
      </SlideOver>

      {/* Редактирование воронки */}
      <SlideOver
        isOpen={!!editingPipeline}
        onClose={() => setEditingPipeline(null)}
        title="Редактировать воронку"
      >
        {editingPipeline && (
          <PipelineForm
            pipeline={editingPipeline}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingPipeline(null)}
          />
        )}
      </SlideOver>

      {/* Подтверждение удаления */}
      <ConfirmDialog
        isOpen={!!deletingPipeline}
        title="Удалить воронку?"
        message={`Вы уверены, что хотите удалить воронку "${deletingPipeline?.name}"? Все этапы воронки также будут удалены. Сделки в этой воронке потеряют привязку к этапам. Это действие необратимо.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeletingPipeline(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
