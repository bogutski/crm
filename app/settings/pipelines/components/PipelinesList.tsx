'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus, Star, ChevronRight, GripVertical } from 'lucide-react';
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;

    // Set drag image
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }

    // Delay to allow the drag image to be captured before adding opacity
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setDropTargetIndex(index);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setDropTargetIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if we're leaving the container entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      // Don't reset here - we'll handle it in dragEnd
    }
  };

  const handleDragEnd = async () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }

    if (draggedIndex === null || dropTargetIndex === null || draggedIndex === dropTargetIndex) {
      setDraggedIndex(null);
      setDropTargetIndex(null);
      return;
    }

    // Calculate new order
    const newPipelines = [...pipelines];
    const [draggedItem] = newPipelines.splice(draggedIndex, 1);
    newPipelines.splice(dropTargetIndex, 0, draggedItem);

    // Optimistic update
    setPipelines(newPipelines);

    setDraggedIndex(null);
    setDropTargetIndex(null);

    // Save to server
    try {
      const response = await fetch('/api/pipelines/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineIds: newPipelines.map((p) => p.id) }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder');
      }
    } catch (error) {
      console.error('Error reordering pipelines:', error);
      // Revert on error
      fetchPipelines();
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
        <div className="grid gap-2">
          {pipelines.map((pipeline, index) => (
            <div key={pipeline.id} className="relative">
              {/* Drop indicator - shows above the item */}
              {dropTargetIndex === index && draggedIndex !== null && draggedIndex > index && (
                <div className="absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded-full z-10 transition-all duration-200" />
              )}

              <div
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                className={`border rounded-lg p-4 transition-all duration-200 cursor-move ${
                  pipeline.isActive
                    ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 opacity-60'
                } ${
                  draggedIndex === index
                    ? 'opacity-50 scale-[0.98] shadow-lg'
                    : ''
                } ${
                  dropTargetIndex === index && draggedIndex !== null && draggedIndex !== index
                    ? 'transform translate-y-2'
                    : ''
                } hover:border-zinc-300 dark:hover:border-zinc-700`}
              >
                <div className="flex items-start gap-3">
                  {/* Drag handle */}
                  <div className="flex-shrink-0 pt-1 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5 text-zinc-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/settings/pipelines/${pipeline.id}`}
                        className="text-lg font-medium text-zinc-900 dark:text-zinc-50 hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
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

                  <div className="flex gap-1 flex-shrink-0">
                    {!pipeline.isDefault && pipeline.isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(pipeline);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        title="Сделать по умолчанию"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPipeline(pipeline);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                      title="Редактировать"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingPipeline(pipeline);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Drop indicator - shows below the item */}
              {dropTargetIndex === index && draggedIndex !== null && draggedIndex < index && (
                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-blue-500 rounded-full z-10 transition-all duration-200" />
              )}
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
