'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus, GripVertical, ArrowLeft, Check, Trophy } from 'lucide-react';
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
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const stages = [...(pipeline?.stages || [])];
    const [draggedItem] = stages.splice(draggedIndex, 1);
    stages.splice(dragOverIndex, 0, draggedItem);

    // Optimistic update
    if (pipeline) {
      setPipeline({ ...pipeline, stages });
    }

    // Save new order
    try {
      await fetch(`/api/pipelines/${pipelineId}/stages/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageIds: stages.map((s) => s.id) }),
      });
    } catch (error) {
      console.error('Error reordering stages:', error);
      fetchPipeline(); // Revert on error
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
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
        <div className="space-y-2">
          {/* Визуальное представление воронки */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
            {stages.map((stage, index) => (
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
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="w-10 px-2 py-3"></th>
                  <th className="w-12 px-2 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Код
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Вероятность
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Флаги
                  </th>
                  <th className="w-24 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {stages.map((stage, index) => (
                  <tr
                    key={stage.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white dark:bg-zinc-900 transition-colors ${
                      draggedIndex === index ? 'opacity-50' : ''
                    } ${
                      dragOverIndex === index && draggedIndex !== index
                        ? 'border-t-2 border-blue-500'
                        : ''
                    } ${!stage.isActive ? 'opacity-50' : ''}`}
                  >
                    <td className="px-2 py-3 cursor-move">
                      <GripVertical className="w-4 h-4 text-zinc-400" />
                    </td>
                    <td className="px-2 py-3">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: stage.color }}
                      ></div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {stage.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                      {stage.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {stage.probability}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
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
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => setEditingStage(stage)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStage(stage)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
