'use client';

import { useState, useCallback } from 'react';
import { SlideOver } from '@/app/components/SlideOver';
import { OpportunityForm } from './OpportunityForm';
import { OpportunityPreviewPanel } from './OpportunityPreviewPanel';
import { KanbanBoard as GenericKanbanBoard } from '@/components/kanban/KanbanBoard';
import { OpportunityCard, type Opportunity } from '@/components/kanban/cards/OpportunityCard';
import type { KanbanColumn, KanbanFetchResult } from '@/components/kanban/types';

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

interface KanbanBoardProps {
  pipelineId: string;
  stages: Stage[];
}

const PAGE_SIZE = 20;

const formatAmount = (amount?: number) => {
  if (amount === undefined || amount === null) return '';
  let formatted: string;
  if (amount >= 1000000) {
    formatted = `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    formatted = `${(amount / 1000).toFixed(0)}K`;
  } else {
    formatted = amount.toString();
  }
  return `$${formatted}`;
};

export function KanbanBoard({ pipelineId, stages }: KanbanBoardProps) {
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [previewOpportunityId, setPreviewOpportunityId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Convert stages to kanban columns
  const columns: KanbanColumn[] = stages.map(stage => ({
    id: stage.id,
    name: stage.name,
    color: stage.color,
    order: stage.order,
  }));

  // Fetch opportunities for a specific stage
  const fetchItems = useCallback(async (
    stageId: string,
    page: number,
    pageSize: number
  ): Promise<KanbanFetchResult<Opportunity>> => {
    try {
      const response = await fetch('/api/opportunities/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId,
          stageId,
          page,
          limit: pageSize,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          items: data.opportunities || [],
          total: data.total || 0,
        };
      }
    } catch (error) {
      console.error(`Error fetching opportunities for stage ${stageId}:`, error);
    }

    return { items: [], total: 0 };
  }, [pipelineId]);

  // Get column id from opportunity
  const getItemColumnId = useCallback((opportunity: Opportunity) => {
    return opportunity.stage?.id;
  }, []);

  // Handle opportunity move between stages
  const handleItemMove = useCallback(async (
    opportunity: Opportunity,
    _fromColumnId: string,
    toColumnId: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: toColumnId }),
      });

      if (response.ok) {
        window.dispatchEvent(new CustomEvent('opportunityUpdated'));
        return true;
      }
    } catch (error) {
      console.error('Error moving opportunity:', error);
    }
    return false;
  }, []);

  // Render column summary (total amount)
  const renderColumnSummary = useCallback((
    _columnId: string,
    items: Opportunity[],
    _total: number
  ) => {
    const totalAmount = items.reduce((sum, opp) => sum + (opp.amount || 0), 0);
    if (totalAmount > 0) {
      return (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatAmount(totalAmount)}
        </p>
      );
    }
    return null;
  }, []);

  // Render opportunity card
  const renderCard = useCallback((opportunity: Opportunity) => {
    return (
      <OpportunityCard
        opportunity={opportunity}
        onEditClick={setEditingOpportunity}
        onPreviewClick={setPreviewOpportunityId}
      />
    );
  }, []);

  const handleEditSuccess = () => {
    setEditingOpportunity(null);
    setRefreshKey(k => k + 1);
  };

  const handleDeleted = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <>
      <GenericKanbanBoard
        key={`${pipelineId}-${refreshKey}`}
        columns={columns}
        fetchItems={fetchItems}
        getItemColumnId={getItemColumnId}
        onItemMove={handleItemMove}
        renderCard={renderCard}
        renderColumnSummary={renderColumnSummary}
        refreshEvents={['opportunityCreated', 'opportunityUpdated']}
        pageSize={PAGE_SIZE}
        emptyText="Пусто"
      />

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
        onDeleted={handleDeleted}
      />
    </>
  );
}
