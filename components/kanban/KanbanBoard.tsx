'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type {
  KanbanItem,
  KanbanColumn,
  KanbanColumnData,
  KanbanBoardProps,
} from './types';

const DEFAULT_PAGE_SIZE = 20;

export function KanbanBoard<T extends KanbanItem>({
  columns,
  fetchItems,
  getItemColumnId,
  onItemMove,
  renderCard,
  renderColumnSummary,
  refreshEvents = [],
  pageSize = DEFAULT_PAGE_SIZE,
  emptyText = 'Пусто',
}: KanbanBoardProps<T>) {
  const [columnData, setColumnData] = useState<Record<string, KanbanColumnData<T>>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<T | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const columnDataRef = useRef<Record<string, KanbanColumnData<T>>>({});

  // Keep ref in sync with state
  useEffect(() => {
    columnDataRef.current = columnData;
  }, [columnData]);

  // Fetch items for a specific column
  const fetchColumnItems = useCallback(async (columnId: string, page: number = 1, append: boolean = false) => {
    // Mark as loading
    setColumnData(prev => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        loading: true,
      },
    }));

    try {
      const result = await fetchItems(columnId, page, pageSize);
      const newItems = result.items || [];
      const total = result.total || 0;

      setColumnData(prev => {
        const existingItems = prev[columnId]?.items || [];

        // When appending, filter out duplicates by id
        let finalItems: T[];
        if (append) {
          const existingIds = new Set(existingItems.map(o => o.id));
          const uniqueNew = newItems.filter(o => !existingIds.has(o.id));
          finalItems = [...existingItems, ...uniqueNew];
        } else {
          finalItems = newItems;
        }

        return {
          ...prev,
          [columnId]: {
            items: finalItems,
            total,
            page,
            loading: false,
            hasMore: page * pageSize < total,
          },
        };
      });
    } catch (error) {
      console.error(`Error fetching items for column ${columnId}:`, error);
      setColumnData(prev => ({
        ...prev,
        [columnId]: {
          ...prev[columnId],
          loading: false,
        },
      }));
    }
  }, [fetchItems, pageSize]);

  // Initial load - fetch first page for all columns
  useEffect(() => {
    if (columns.length === 0) return;

    let isMounted = true;

    const loadData = async () => {
      // Initialize column data
      const initialData: Record<string, KanbanColumnData<T>> = {};
      columns.forEach(column => {
        initialData[column.id] = {
          items: [],
          total: 0,
          page: 1,
          loading: true,
          hasMore: false,
        };
      });

      if (isMounted) {
        setColumnData(initialData);
        setInitialLoading(true);
      }

      // Fetch all columns in parallel
      await Promise.all(columns.map(column => fetchColumnItems(column.id, 1, false)));

      if (isMounted) {
        setInitialLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [columns, fetchColumnItems]);

  // Listen for refresh events
  useEffect(() => {
    if (refreshEvents.length === 0) return;

    const handleChange = () => {
      columns.forEach(column => fetchColumnItems(column.id, 1, false));
    };

    refreshEvents.forEach(event => {
      window.addEventListener(event, handleChange);
    });

    return () => {
      refreshEvents.forEach(event => {
        window.removeEventListener(event, handleChange);
      });
    };
  }, [columns, refreshEvents, fetchColumnItems]);

  // Handle scroll for infinite loading
  const handleColumnScroll = useCallback((columnId: string) => {
    const column = columnRefs.current[columnId];
    if (!column) return;

    const data = columnDataRef.current[columnId];
    if (!data || data.loading || !data.hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = column;
    const scrollPercent = (scrollTop + clientHeight) / scrollHeight;

    // Load more when scrolled to 80% of the column
    if (scrollPercent >= 0.8) {
      fetchColumnItems(columnId, data.page + 1, true);
    }
  }, [fetchColumnItems]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, item: T) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumnId(columnId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDragOverColumnId(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);

    if (!draggedItem || !onItemMove) {
      setDraggedItem(null);
      return;
    }

    const sourceColumnId = getItemColumnId(draggedItem);
    if (sourceColumnId === targetColumnId) {
      setDraggedItem(null);
      return;
    }

    // Optimistic update - move item between columns
    setColumnData(prev => {
      const newData = { ...prev };

      // Remove from source
      if (sourceColumnId && newData[sourceColumnId]) {
        newData[sourceColumnId] = {
          ...newData[sourceColumnId],
          items: newData[sourceColumnId].items.filter(o => o.id !== draggedItem.id),
          total: newData[sourceColumnId].total - 1,
        };
      }

      // Add to target
      if (newData[targetColumnId]) {
        newData[targetColumnId] = {
          ...newData[targetColumnId],
          items: [draggedItem, ...newData[targetColumnId].items],
          total: newData[targetColumnId].total + 1,
        };
      }

      return newData;
    });

    try {
      const success = await onItemMove(draggedItem, sourceColumnId || '', targetColumnId);

      if (!success) {
        // Revert on error - refetch both columns
        if (sourceColumnId) fetchColumnItems(sourceColumnId, 1, false);
        fetchColumnItems(targetColumnId, 1, false);
      }
    } catch (error) {
      console.error('Error moving item:', error);
      if (sourceColumnId) fetchColumnItems(sourceColumnId, 1, false);
      fetchColumnItems(targetColumnId, 1, false);
    }

    setDraggedItem(null);
  }, [draggedItem, onItemMove, getItemColumnId, fetchColumnItems]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverColumnId(null);
  }, []);

  // Refresh function to expose to parent
  const refreshColumn = useCallback((columnId: string) => {
    fetchColumnItems(columnId, 1, false);
  }, [fetchColumnItems]);

  const refreshAllColumns = useCallback(() => {
    columns.forEach(column => fetchColumnItems(column.id, 1, false));
  }, [columns, fetchColumnItems]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  const isDragEnabled = !!onItemMove;

  return (
    <div className="overflow-x-auto -mx-6 px-6 flex-1 min-h-0">
      <div className="flex gap-3 min-w-max h-full">
        {columns.map((column) => {
          const data = columnData[column.id] || { items: [], total: 0, loading: false, hasMore: false };
          const isDropTarget = dragOverColumnId === column.id;

          return (
            <div
              key={column.id}
              className={`w-72 flex-shrink-0 rounded-xl transition-all flex flex-col ${
                isDropTarget
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-[#f1f2f4] dark:bg-zinc-800/80'
              }`}
              onDragOver={isDragEnabled ? (e) => handleDragOver(e, column.id) : undefined}
              onDragLeave={isDragEnabled ? handleDragLeave : undefined}
              onDrop={isDragEnabled ? (e) => handleDrop(e, column.id) : undefined}
            >
              {/* Column Header - Trello style */}
              <div className="px-3 py-2.5 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-6 rounded-full flex-shrink-0"
                      style={{ backgroundColor: column.color }}
                    />
                    <h3 className="font-semibold text-sm text-zinc-700 dark:text-zinc-200">
                      {column.name}
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-700/50 px-2 py-0.5 rounded-full">
                    {data.total}
                  </span>
                </div>
                {renderColumnSummary && (
                  <div className="mt-1 ml-4">
                    {renderColumnSummary(column.id, data.items, data.total)}
                  </div>
                )}
              </div>

              {/* Cards with scroll */}
              <div
                ref={(el) => { columnRefs.current[column.id] = el; }}
                onScroll={() => handleColumnScroll(column.id)}
                className="px-2 pt-1 pb-2 space-y-2 flex-1 overflow-y-auto"
              >
                {data.items.map((item) => {
                  const isDragging = draggedItem?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      draggable={isDragEnabled}
                      onDragStart={isDragEnabled ? (e) => handleDragStart(e, item) : undefined}
                      onDragEnd={isDragEnabled ? handleDragEnd : undefined}
                      className={`${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}`}
                    >
                      {renderCard(item, {
                        isDragging,
                        onDragStart: (e) => handleDragStart(e, item),
                        onDragEnd: handleDragEnd,
                      })}
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {data.loading && (
                  <div className="flex justify-center py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  </div>
                )}

                {/* Empty state */}
                {!data.loading && data.items.length === 0 && (
                  <div className="text-center py-6 text-xs text-zinc-400 dark:text-zinc-500">
                    {emptyText}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
