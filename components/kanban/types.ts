import { ReactNode } from 'react';

// Base interface for any kanban item - must have an id
export interface KanbanItem {
  id: string;
}

// Column definition
export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  order?: number;
}

// Column data state
export interface KanbanColumnData<T extends KanbanItem> {
  items: T[];
  total: number;
  page: number;
  loading: boolean;
  hasMore: boolean;
}

// Fetch result from API
export interface KanbanFetchResult<T extends KanbanItem> {
  items: T[];
  total: number;
}

// Props for the KanbanBoard component
export interface KanbanBoardProps<T extends KanbanItem> {
  // Columns to display
  columns: KanbanColumn[];

  // Function to fetch items for a specific column
  fetchItems: (columnId: string, page: number, pageSize: number) => Promise<KanbanFetchResult<T>>;

  // Function to get column id from an item
  getItemColumnId: (item: T) => string | undefined;

  // Callback when item is moved to a different column (optional - enables drag & drop)
  onItemMove?: (item: T, fromColumnId: string, toColumnId: string) => Promise<boolean>;

  // Render function for item card
  renderCard: (item: T, handlers: KanbanCardHandlers) => ReactNode;

  // Optional: render column header summary (e.g., total amount)
  renderColumnSummary?: (columnId: string, items: T[], total: number) => ReactNode;

  // Event name to listen for refreshing data (e.g., 'opportunityCreated')
  refreshEvents?: string[];

  // Page size for infinite scroll
  pageSize?: number;

  // Empty state text
  emptyText?: string;
}

// Handlers passed to card render function
export interface KanbanCardHandlers {
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

// Internal column state
export interface ColumnState<T extends KanbanItem> {
  data: Record<string, KanbanColumnData<T>>;
  initialLoading: boolean;
  draggedItem: T | null;
  dragOverColumnId: string | null;
}
