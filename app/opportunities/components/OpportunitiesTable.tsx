'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Pencil, ChevronLeft, ChevronRight, Trash2, ScanEye } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { OpportunityForm } from './OpportunityForm';
import { OpportunityPreviewPanel } from './OpportunityPreviewPanel';
import { ContactPreviewPanel } from '@/app/contacts/components/ContactPreviewPanel';
import { Badge } from '@/components/ui/Badge';

interface Priority {
  id: string;
  name: string;
  color?: string;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  pipelineId?: string;
  isInitial?: boolean;
}

interface Contact {
  id: string;
  name: string;
}

interface Owner {
  id: string;
  name: string;
  email: string;
}

interface Opportunity {
  id: string;
  name?: string;
  amount?: number;
  closingDate?: string;
  description?: string;
  externalId?: string;
  archived: boolean;
  priority?: Priority | null;
  stage?: Stage | null;
  pipeline?: { id: string; name: string; code: string } | null;
  contact?: Contact | null;
  owner?: Owner | null;
  createdAt: string;
}

interface OpportunitiesResponse {
  opportunities: Opportunity[];
  total: number;
  page: number;
  limit: number;
}

interface OpportunitiesTableProps {
  initialPage?: number;
  initialSearch?: string;
  pipelineId?: string | null;
  ownerId?: string;
  priorityId?: string;
  stageId?: string;
}

export function OpportunitiesTable({
  initialPage = 1,
  initialSearch = '',
  pipelineId,
  ownerId,
  priorityId,
  stageId,
}: OpportunitiesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<OpportunitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [deletingOpportunity, setDeletingOpportunity] = useState<Opportunity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewOpportunityId, setPreviewOpportunityId] = useState<string | null>(null);
  const [previewContactId, setPreviewContactId] = useState<string | null>(null);

  const currentPage = parseInt(searchParams.get('page') || String(initialPage), 10);
  const currentSearch = searchParams.get('search') || '';

  const updateUrl = useCallback((params: { page?: number; search?: string }) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (params.page !== undefined) {
      if (params.page === 1) {
        newParams.delete('page');
      } else {
        newParams.set('page', String(params.page));
      }
    }

    if (params.search !== undefined) {
      if (params.search === '') {
        newParams.delete('search');
      } else {
        newParams.set('search', params.search);
      }
    }

    const queryString = newParams.toString();
    router.push(queryString ? `?${queryString}` : '/opportunities', { scroll: false });
  }, [router, searchParams]);

  const fetchOpportunities = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/opportunities/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          ...(search && { search }),
          ...(pipelineId && { pipelineId }),
          ...(ownerId && { ownerId }),
          ...(priorityId && { priorityId }),
          ...(stageId && { stageId }),
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch opportunities');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [pipelineId, ownerId, priorityId, stageId]);

  useEffect(() => {
    fetchOpportunities(currentPage, currentSearch);
  }, [currentPage, currentSearch, fetchOpportunities]);

  useEffect(() => {
    const handleOpportunityChange = () => {
      fetchOpportunities(currentPage, currentSearch);
    };
    window.addEventListener('opportunityCreated', handleOpportunityChange);
    window.addEventListener('opportunityUpdated', handleOpportunityChange);
    return () => {
      window.removeEventListener('opportunityCreated', handleOpportunityChange);
      window.removeEventListener('opportunityUpdated', handleOpportunityChange);
    };
  }, [currentPage, currentSearch, fetchOpportunities]);

  const handleEditClick = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
  };

  const handleEditSuccess = () => {
    setEditingOpportunity(null);
  };

  const handleEditCancel = () => {
    setEditingOpportunity(null);
  };

  const handleDeleteClick = (opportunity: Opportunity) => {
    setDeletingOpportunity(opportunity);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOpportunity) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/opportunities/${deletingOpportunity.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete opportunity');
      }

      setDeletingOpportunity(null);
      fetchOpportunities(currentPage, currentSearch);
    } catch (err) {
      console.error('Error deleting opportunity:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingOpportunity(null);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      updateUrl({ page });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const formatAmount = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
    return `$${formatted}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ru-RU');
  };

  if (loading && !data) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8">
        <p className="text-zinc-500 dark:text-zinc-400 text-center">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (!data || data.opportunities.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8">
        <p className="text-zinc-500 dark:text-zinc-400 text-center">
          {currentSearch ? 'Сделки не найдены' : 'Нет сделок'}
        </p>
      </div>
    );
  }

  const startRecord = (data.page - 1) * data.limit + 1;
  const endRecord = Math.min(data.page * data.limit, data.total);

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Название
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Сумма
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Приоритет
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Этап
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Контакт
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Владелец
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Дата закрытия
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Создана
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className={loading ? 'opacity-50' : ''}>
              {data.opportunities.map((opportunity) => (
                <tr
                  key={opportunity.id}
                  className="border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-1.5">
                    <button
                      onClick={() => setPreviewOpportunityId(opportunity.id)}
                      className="text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left"
                    >
                      {opportunity.name || 'Без названия'}
                    </button>
                  </td>
                  <td className="px-4 py-1.5">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {formatAmount(opportunity.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-1.5">
                    {opportunity.priority ? (
                      <Badge color={opportunity.priority.color || '#71717a'}>
                        {opportunity.priority.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-1.5">
                    {opportunity.stage ? (
                      <Badge color={opportunity.stage.color || '#71717a'}>
                        {opportunity.stage.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-1.5">
                    {opportunity.contact ? (
                      <button
                        onClick={() => setPreviewContactId(opportunity.contact!.id)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {opportunity.contact.name}
                      </button>
                    ) : (
                      <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-1.5">
                    {opportunity.owner ? (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400" title={opportunity.owner.email}>
                        {opportunity.owner.name}
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-1.5">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {formatDate(opportunity.closingDate)}
                    </span>
                  </td>
                  <td className="px-4 py-1.5">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {formatDate(opportunity.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/opportunities/${opportunity.id}`}
                        className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        title="Открыть страницу"
                      >
                        <ScanEye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleEditClick(opportunity)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(opportunity)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Показано {startRecord}–{endRecord} из {data.total}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="Предыдущая страница"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {getPageNumbers().map((page, idx) =>
                page === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-sm text-zinc-400 dark:text-zinc-500"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`min-w-[32px] px-2 py-1 text-sm rounded transition-colors ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="Следующая страница"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Opportunity Slide-over */}
      <SlideOver
        isOpen={!!editingOpportunity}
        onClose={handleEditCancel}
        title="Редактирование сделки"
      >
        {editingOpportunity && (
          <OpportunityForm
            opportunity={editingOpportunity}
            onSuccess={handleEditSuccess}
            onCancel={handleEditCancel}
          />
        )}
      </SlideOver>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingOpportunity}
        title="Удаление сделки"
        message={`Вы уверены, что хотите удалить сделку "${deletingOpportunity?.name || 'Без названия'}"? Это действие нельзя отменить.`}
        confirmLabel="Подтверждаю"
        cancelLabel="Отменяю"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />

      {/* Opportunity Preview Panel */}
      <OpportunityPreviewPanel
        opportunityId={previewOpportunityId}
        isOpen={!!previewOpportunityId}
        onClose={() => setPreviewOpportunityId(null)}
        onDeleted={() => fetchOpportunities(currentPage, currentSearch)}
      />

      {/* Contact Preview Panel */}
      <ContactPreviewPanel
        contactId={previewContactId}
        isOpen={!!previewContactId}
        onClose={() => setPreviewContactId(null)}
      />
    </>
  );
}
