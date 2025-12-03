'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus, GripVertical, ArrowLeft, Trophy } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { StageForm } from './StageForm';
import { Badge } from '@/components/ui/Badge';

interface Stage {
  id: string;
  pipelineId: string;
  name: string;
  code: string;
  color: string;
  order: number;
  probability: number;
  isInitial: boolean;
  isFinal: boolean;
  isWon: boolean;
  isActive: boolean;
}

interface Pipeline {
  id: string;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  stages: Stage[];
}

interface StagesListProps {
  pipelineId: string;
}

export function StagesList({ pipelineId }: StagesListProps) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [deletingStage, setDeletingStage] = useState<Stage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const fetchPipeline = useCallback(async () => {
    try {
      const response = await fetch(`/api/pipelines/${pipelineId}`);
      if (!response.ok) throw new Error('Not found');
      const data = await response.json();
      setPipeline(data);
    } catch (error) {
      console.error('Error fetching pipeline:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchPipeline();
  };

  const handleEditSuccess = () => {
    setEditingStage(null);
    fetchPipeline();
  };

  const handleDelete = async () => {
    if (!deletingStage) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/pipelines/${pipelineId}/stages/${deletingStage.id}`, { method: 'DELETE' });
      setDeletingStage(null);
      fetchPipeline();
    } catch (error) {
      console.error('Error deleting stage:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }

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

  const handleDragEnd = async () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }

    if (draggedIndex === null || dropTargetIndex === null || draggedIndex === dropTargetIndex) {
      setDraggedIndex(null);
      setDropTargetIndex(null);
      return;
    }

    const stages = [...(pipeline?.stages || [])];
    const [draggedItem] = stages.splice(draggedIndex, 1);
    stages.splice(dropTargetIndex, 0, draggedItem);

    // Optimistic update
    if (pipeline) {
      setPipeline({ ...pipeline, stages });
    }

    setDraggedIndex(null);
    setDropTargetIndex(null);

    // Save new order
    try {
      const response = await fetch(`/api/pipelines/${pipelineId}/stages/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageIds: stages.map((s) => s.id) }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder');
      }
    } catch (error) {
      console.error('Error reordering stages:', error);
      fetchPipeline(); // Revert on error
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">Воронка не найдена</p>
        <Link
          href="/settings/pipelines"
          className="mt-4 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const stages = pipeline.stages || [];

  return (
    <>
      <div className="mb-6">
        <Link
          href="/settings/pipelines"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Все воронки
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {pipeline.name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              {pipeline.code}
            </p>
            {pipeline.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{pipeline.description}</p>
            )}
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Добавить этап
          </button>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
          <p>Этапы пока не созданы</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-sm text-zinc-900 dark:text-zinc-50 underline"
          >
            Создать первый этап
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Визуальное представление воронки */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex-1 min-w-[120px] text-center py-2 px-3 rounded text-sm font-medium text-white"
                style={{ backgroundColor: stage.color }}
              >
                <div className="truncate">{stage.name}</div>
                <div className="text-xs opacity-75 mt-0.5">{stage.probability}%</div>
              </div>
            ))}
          </div>

          {/* Список этапов с drag-and-drop */}
          <div className="grid gap-2">
            {stages.map((stage, index) => (
              <div key={stage.id} className="relative">
                {/* Drop indicator - shows above the item */}
                {dropTargetIndex === index && draggedIndex !== null && draggedIndex > index && (
                  <div className="absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded-full z-10 transition-all duration-200" />
                )}

                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`border rounded-lg p-3 transition-all duration-200 cursor-move ${
                    stage.isActive
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
                  <div className="flex items-center gap-3">
                    {/* Drag handle */}
                    <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-5 h-5 text-zinc-400" />
                    </div>

                    {/* Color indicator */}
                    <div
                      className="w-4 h-4 rounded flex-shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />

                    {/* Stage info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">
                          {stage.name}
                        </span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                          {stage.code}
                        </span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {stage.probability}%
                        </span>
                      </div>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {stage.isInitial && (
                          <Badge variant="info" rounded="full">
                            Начальный
                          </Badge>
                        )}
                        {stage.isFinal && (
                          <Badge variant="default" rounded="full">
                            Финальный
                          </Badge>
                        )}
                        {stage.isWon && (
                          <Badge variant="success" rounded="full">
                            <Trophy className="w-3 h-3 mr-0.5" />
                            Успех
                          </Badge>
                        )}
                        {!stage.isActive && (
                          <Badge variant="error" rounded="full">
                            Неактивен
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStage(stage);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                        title="Редактировать"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingStage(stage);
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
        </div>
      )}

      {/* Создание этапа */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Добавить этап"
      >
        <StageForm
          pipelineId={pipelineId}
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateOpen(false)}
        />
      </SlideOver>

      {/* Редактирование этапа */}
      <SlideOver
        isOpen={!!editingStage}
        onClose={() => setEditingStage(null)}
        title="Редактировать этап"
      >
        {editingStage && (
          <StageForm
            pipelineId={pipelineId}
            stage={editingStage}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingStage(null)}
          />
        )}
      </SlideOver>

      {/* Подтверждение удаления */}
      <ConfirmDialog
        isOpen={!!deletingStage}
        title="Удалить этап?"
        message={`Вы уверены, что хотите удалить этап "${deletingStage?.name}"? Сделки на этом этапе потеряют привязку. Это действие необратимо.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeletingStage(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
