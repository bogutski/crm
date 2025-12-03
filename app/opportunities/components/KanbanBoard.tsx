'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Pencil, Calendar, DollarSign, Loader2, ScanEye } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { OpportunityForm } from './OpportunityForm';
import { OpportunityPreviewPanel } from './OpportunityPreviewPanel';

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

interface Priority {
  id: string;
  name: string;
  color?: string;
}

interface Contact {
  id: string;
  name: string;
}

interface OpportunityStage {
  id: string;
  name: string;
  color: string;
  pipelineId?: string;
  isInitial?: boolean;
}

interface Opportunity {
  id: string;
  name?: string;
  amount?: number;
  closingDate?: string;
  description?: string;
  archived: boolean;
  priority?: Priority | null;
  stage?: OpportunityStage | null;
  pipeline?: { id: string; name: string; code: string } | null;
  contact?: Contact | null;
  createdAt: string;
}

interface StageData {
  opportunities: Opportunity[];
  total: number;
  totalAmount: number;
  page: number;
  loading: boolean;
  hasMore: boolean;
}

interface KanbanBoardProps {
  pipelineId: string;
  stages: Stage[];
}

const PAGE_SIZE = 20;

export function KanbanBoard({ pipelineId, stages }: KanbanBoardProps) {
  const [stageData, setStageData] = useState<Record<string, StageData>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [previewOpportunityId, setPreviewOpportunityId] = useState<string | null>(null);
  const [draggedOpportunity, setDraggedOpportunity] = useState<Opportunity | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stageDataRef = useRef<Record<string, StageData>>({});

  // Keep ref in sync with state
  useEffect(() => {
    stageDataRef.current = stageData;
  }, [stageData]);

  // Fetch opportunities for a specific stage
  const fetchStageOpportunities = useCallback(async (stageId: string, page: number = 1, append: boolean = false) => {
    // Mark as loading
    setStageData(prev => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        loading: true,
      },
    }));

    try {
      const response = await fetch('/api/opportunities/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId,
          stageId,
          page,
          limit: PAGE_SIZE,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newOpportunities: Opportunity[] = data.opportunities || [];
        const total = data.total || 0;
        const totalAmount = data.totalAmount || 0;

        setStageData(prev => {
          const existingOpps = prev[stageId]?.opportunities || [];

          // When appending, filter out duplicates by id
          let finalOpportunities: Opportunity[];
          if (append) {
            const existingIds = new Set(existingOpps.map(o => o.id));
            const uniqueNew = newOpportunities.filter(o => !existingIds.has(o.id));
            finalOpportunities = [...existingOpps, ...uniqueNew];
          } else {
            finalOpportunities = newOpportunities;
          }

          return {
            ...prev,
            [stageId]: {
              opportunities: finalOpportunities,
              total,
              totalAmount,
              page,
              loading: false,
              hasMore: page * PAGE_SIZE < total,
            },
          };
        });
      }
    } catch (error) {
      console.error(`Error fetching opportunities for stage ${stageId}:`, error);
      setStageData(prev => ({
        ...prev,
        [stageId]: {
          ...prev[stageId],
          loading: false,
        },
      }));
    }
  }, [pipelineId]);

  // Initial load - fetch first page for all stages
  useEffect(() => {
    if (!pipelineId || stages.length === 0) return;

    let isMounted = true;

    // Reset states via async to avoid cascading renders warning
    const loadData = async () => {
      // Initialize stage data
      const initialData: Record<string, StageData> = {};
      stages.forEach(stage => {
        initialData[stage.id] = {
          opportunities: [],
          total: 0,
          totalAmount: 0,
          page: 1,
          loading: true,
          hasMore: false,
        };
      });

      if (isMounted) {
        setStageData(initialData);
        setInitialLoading(true);
      }

      // Fetch all stages in parallel
      await Promise.all(stages.map(stage => fetchStageOpportunities(stage.id, 1, false)));

      if (isMounted) {
        setInitialLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [pipelineId, stages, fetchStageOpportunities]);

  // Listen for opportunity changes
  useEffect(() => {
    const handleChange = () => {
      // Refetch all stages
      stages.forEach(stage => fetchStageOpportunities(stage.id, 1, false));
    };
    window.addEventListener('opportunityCreated', handleChange);
    window.addEventListener('opportunityUpdated', handleChange);
    return () => {
      window.removeEventListener('opportunityCreated', handleChange);
      window.removeEventListener('opportunityUpdated', handleChange);
    };
  }, [stages, fetchStageOpportunities]);

  // Handle scroll for infinite loading
  const handleColumnScroll = useCallback((stageId: string) => {
    const column = columnRefs.current[stageId];
    if (!column) return;

    const data = stageDataRef.current[stageId];
    if (!data || data.loading || !data.hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = column;
    const scrollPercent = (scrollTop + clientHeight) / scrollHeight;

    // Load more when scrolled to 80% of the column
    if (scrollPercent >= 0.8) {
      fetchStageOpportunities(stageId, data.page + 1, true);
    }
  }, [fetchStageOpportunities]);

  const formatAmount = (amount?: number, withSymbol = true) => {
    if (amount === undefined || amount === null) return '';
    let formatted: string;
    if (amount >= 1000000) {
      formatted = `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      formatted = `${(amount / 1000).toFixed(0)}K`;
    } else {
      formatted = amount.toString();
    }
    return withSymbol ? `$${formatted}` : formatted;
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, opportunity: Opportunity) => {
    setDraggedOpportunity(opportunity);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStageId(stageId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the column entirely (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setDragOverStageId(null);

    if (!draggedOpportunity || draggedOpportunity.stage?.id === targetStageId) {
      setDraggedOpportunity(null);
      return;
    }

    const sourceStageId = draggedOpportunity.stage?.id;

    // Optimistic update - move opportunity between columns
    setStageData(prev => {
      const newData = { ...prev };

      // Remove from source
      if (sourceStageId && newData[sourceStageId]) {
        newData[sourceStageId] = {
          ...newData[sourceStageId],
          opportunities: newData[sourceStageId].opportunities.filter(o => o.id !== draggedOpportunity.id),
          total: newData[sourceStageId].total - 1,
        };
      }

      // Add to target
      if (newData[targetStageId]) {
        const updatedOpportunity = {
          ...draggedOpportunity,
          stage: stages.find(s => s.id === targetStageId) || draggedOpportunity.stage,
        };
        newData[targetStageId] = {
          ...newData[targetStageId],
          opportunities: [updatedOpportunity, ...newData[targetStageId].opportunities],
          total: newData[targetStageId].total + 1,
        };
      }

      return newData;
    });

    try {
      const response = await fetch(`/api/opportunities/${draggedOpportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: targetStageId }),
      });

      if (!response.ok) {
        // Revert on error - refetch both columns
        if (sourceStageId) fetchStageOpportunities(sourceStageId, 1, false);
        fetchStageOpportunities(targetStageId, 1, false);
      } else {
        window.dispatchEvent(new CustomEvent('opportunityUpdated'));
      }
    } catch (error) {
      console.error('Error moving opportunity:', error);
      if (sourceStageId) fetchStageOpportunities(sourceStageId, 1, false);
      fetchStageOpportunities(targetStageId, 1, false);
    }

    setDraggedOpportunity(null);
  };

  const handleDragEnd = () => {
    setDraggedOpportunity(null);
    setDragOverStageId(null);
  };

  const handleEditClick = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
  };

  const handleEditSuccess = () => {
    setEditingOpportunity(null);
    // Refetch all stages to get updated data
    stages.forEach(stage => fetchStageOpportunities(stage.id, 1, false));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto -mx-6 px-6 flex-1 min-h-0">
        <div className="flex gap-3 min-w-max h-full">
          {stages.map((stage) => {
            const data = stageData[stage.id] || { opportunities: [], total: 0, totalAmount: 0, loading: false, hasMore: false };
            const isDropTarget = dragOverStageId === stage.id;

            return (
              <div
                key={stage.id}
                className={`w-72 flex-shrink-0 rounded-xl transition-all flex flex-col ${
                  isDropTarget
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-[#f1f2f4] dark:bg-zinc-800/80'
                }`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={(e) => handleDragLeave(e)}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header - Trello style */}
                <div className="px-3 py-2.5 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-6 rounded-full flex-shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="font-semibold text-sm text-zinc-700 dark:text-zinc-200">
                        {stage.name}
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-700/50 px-2 py-0.5 rounded-full">
                      {data.total}
                    </span>
                  </div>
                  {data.totalAmount > 0 && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-4">
                      {formatAmount(data.totalAmount)}
                    </p>
                  )}
                </div>

                {/* Cards with scroll - Trello style */}
                <div
                  ref={(el) => { columnRefs.current[stage.id] = el; }}
                  onScroll={() => handleColumnScroll(stage.id)}
                  className="px-2 pt-1 pb-2 space-y-2 flex-1 overflow-y-auto"
                >
                  {data.opportunities.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, opportunity)}
                      onDragEnd={handleDragEnd}
                      className={`group bg-white dark:bg-zinc-900 rounded-lg shadow-sm hover:shadow-md border-0 hover:ring-2 hover:ring-blue-400/50 cursor-pointer transition-all ${
                        draggedOpportunity?.id === opportunity.id ? 'opacity-50 rotate-2 scale-105' : ''
                      }`}
                    >
                      <div className="p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setPreviewOpportunityId(opportunity.id);
                            }}
                            className="font-medium text-sm text-zinc-800 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 flex-1 text-left"
                          >
                            {opportunity.name || 'Без названия'}
                          </button>

                          <Link
                            href={`/opportunities/${opportunity.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                            title="Открыть страницу"
                          >
                            <ScanEye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleEditClick(opportunity);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                            title="Редактировать"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Badges row - Trello style */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {opportunity.amount && (
                            <span className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              <DollarSign className="w-3 h-3" />
                              {formatAmount(opportunity.amount)}
                            </span>
                          )}
                          {opportunity.closingDate && (
                            <span className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              <Calendar className="w-3 h-3" />
                              {formatDate(opportunity.closingDate)}
                            </span>
                          )}
                          {opportunity.priority && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{
                                backgroundColor: opportunity.priority.color || '#71717a',
                                color: 'white',
                              }}
                            >
                              {opportunity.priority.name}
                            </span>
                          )}
                        </div>

                        {/* Contact - bottom */}
                        {opportunity.contact && (
                          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                              {opportunity.contact.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                              {opportunity.contact.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {data.loading && (
                    <div className="flex justify-center py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    </div>
                  )}

                  {/* Empty state - Trello style */}
                  {!data.loading && data.opportunities.length === 0 && (
                    <div className="text-center py-6 text-xs text-zinc-400 dark:text-zinc-500">
                      Пусто
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Opportunity Slide-over */}
      <SlideOver
        isOpen={!!editingOpportunity}
        onClose={() => setEditingOpportunity(null)}
        title="Редактирование сделки"
      >
        {editingOpportunity && (
          <OpportunityForm
            opportunity={editingOpportunity}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingOpportunity(null)}
          />
        )}
      </SlideOver>

      {/* Opportunity Preview Panel */}
      <OpportunityPreviewPanel
        opportunityId={previewOpportunityId}
        isOpen={!!previewOpportunityId}
        onClose={() => setPreviewOpportunityId(null)}
        onDeleted={() => stages.forEach(stage => fetchStageOpportunities(stage.id, 1, false))}
      />
    </>
  );
}
