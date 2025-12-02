'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pencil, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { EditContactForm } from './EditContactForm';

interface Email {
  address: string;
  isVerified: boolean;
  isSubscribed: boolean;
}

interface Phone {
  e164: string;
  international: string;
  country: string;
  type: 'MOBILE' | 'FIXED_LINE' | 'UNKNOWN';
  isPrimary: boolean;
}

interface Contact {
  id: string;
  name: string;
  emails: Email[];
  phones: Phone[];
  company?: string;
  position?: string;
  notes?: string;
  createdAt: string;
}

interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
}

interface ContactsTableProps {
  initialPage?: number;
  initialSearch?: string;
}

export function ContactsTable({ initialPage = 1, initialSearch = '' }: ContactsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<ContactsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get current values from URL or use initial values
  const currentPage = parseInt(searchParams.get('page') || String(initialPage), 10);
  const currentSearch = searchParams.get('search') || '';

  // Update URL with new params
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
    router.push(queryString ? `?${queryString}` : '/contacts', { scroll: false });
  }, [router, searchParams]);

  const fetchContacts = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (search) {
        params.set('search', search);
      }
      const response = await fetch(`/api/contacts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts(currentPage, currentSearch);
  }, [currentPage, currentSearch, fetchContacts]);

  // Listen for contact creation/update events
  useEffect(() => {
    const handleContactChange = () => {
      fetchContacts(currentPage, currentSearch);
    };
    window.addEventListener('contactCreated', handleContactChange);
    window.addEventListener('contactUpdated', handleContactChange);
    return () => {
      window.removeEventListener('contactCreated', handleContactChange);
      window.removeEventListener('contactUpdated', handleContactChange);
    };
  }, [currentPage, currentSearch, fetchContacts]);

  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact);
  };

  const handleEditSuccess = () => {
    setEditingContact(null);
  };

  const handleEditCancel = () => {
    setEditingContact(null);
  };

  const handleDeleteClick = (contact: Contact) => {
    setDeletingContact(contact);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingContact) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/contacts/${deletingContact.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      setDeletingContact(null);
      fetchContacts(currentPage, currentSearch);
    } catch (err) {
      console.error('Error deleting contact:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingContact(null);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      updateUrl({ page });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
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

  if (!data || data.contacts.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8">
        <p className="text-zinc-500 dark:text-zinc-400 text-center">
          {currentSearch ? 'Контакты не найдены' : 'Нет контактов'}
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
                  Имя
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Email
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Телефон
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Компания
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Создан
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className={loading ? 'opacity-50' : ''}>
              {data.contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-1.5">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {contact.name}
                    </span>
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="flex flex-col">
                      {contact.emails.length > 0 ? (
                        contact.emails.map((email, idx) => (
                          <span key={idx} className="text-sm text-zinc-600 dark:text-zinc-400">
                            {email.address}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="flex flex-col">
                      {contact.phones.length > 0 ? (
                        contact.phones.map((phone, idx) => (
                          <span key={idx} className="text-sm text-zinc-600 dark:text-zinc-400">
                            {phone.international}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-1.5">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {contact.company || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-1.5">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(contact.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(contact)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(contact)}
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
              {/* Previous button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="Предыдущая страница"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Page numbers */}
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

              {/* Next button */}
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

      {/* Edit Contact Slide-over */}
      <SlideOver
        isOpen={!!editingContact}
        onClose={handleEditCancel}
        title="Редактирование контакта"
      >
        {editingContact && (
          <EditContactForm
            contact={editingContact}
            onSuccess={handleEditSuccess}
            onCancel={handleEditCancel}
          />
        )}
      </SlideOver>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingContact}
        title="Удаление контакта"
        message={`Вы уверены, что хотите удалить контакт "${deletingContact?.name}"? Это действие нельзя отменить.`}
        confirmLabel="Подтверждаю"
        cancelLabel="Отменяю"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </>
  );
}
