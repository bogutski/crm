'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Pencil,
  Trash2,
  Briefcase,
  Archive,
} from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { ResizablePanel } from '@/app/components/ResizablePanel';
import { OpportunityForm } from '@/app/opportunities/components/OpportunityForm';
import { OpportunityTimeline } from './OpportunityTimeline';

interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

interface Priority {
  id: string;
  name: string;
  color?: string;
}

interface Status {
  id: string;
  name: string;
  color?: string;
}

interface Contact {
  id: string;
  name: string;
}

interface ContactEmail {
  address: string;
  isVerified?: boolean;
  isSubscribed?: boolean;
}

interface ContactPhone {
  e164: string;
  international: string;
  country: string;
  type?: string;
  isPrimary?: boolean;
}

interface ContactType {
  id: string;
  name: string;
  color?: string;
}

interface FullContact {
  id: string;
  name: string;
  emails: ContactEmail[];
  phones: ContactPhone[];
  company?: string;
  position?: string;
  notes?: string;
  contactType?: ContactType | null;
  source?: string;
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
  utm?: Utm;
  description?: string;
  externalId?: string;
  archived: boolean;
  contact?: Contact | null;
  owner?: Owner | null;
  priority?: Priority | null;
  status?: Status | null;
  createdAt: string;
  updatedAt: string;
}

interface OpportunityViewProps {
  opportunityId: string;
}

export function OpportunityView({ opportunityId }: OpportunityViewProps) {
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [contact, setContact] = useState<FullContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/opportunities/${opportunityId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Сделка не найдена');
          return;
        }
        throw new Error('Failed to fetch opportunity');
      }
      const data = await response.json();
      setOpportunity(data);

      // Fetch full contact data if contact exists
      if (data.contact?.id) {
        fetchContact(data.contact.id);
      } else {
        setContact(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const fetchContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`);
      if (response.ok) {
        const data = await response.json();
        setContact(data);
      }
    } catch (err) {
      console.error('Failed to fetch contact:', err);
    }
  };

  useEffect(() => {
    fetchOpportunity();
  }, [opportunityId]);

  const handleEditSuccess = () => {
    setIsEditing(false);
    fetchOpportunity();
  };

  const handleDeleteConfirm = async () => {
    if (!opportunity) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete opportunity');
      }

      router.push('/opportunities');
    } catch (err) {
      console.error('Error deleting opportunity:', err);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-zinc-500 dark:text-zinc-400 text-center">Загрузка...</p>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="p-8">
        <p className="text-red-500 text-center">{error || 'Сделка не найдена'}</p>
        <div className="mt-4 text-center">
          <Link
            href="/opportunities"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Вернуться к списку сделок
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
    return `$${formatted}`;
  };

  return (
    <>
      <div className="flex flex-1 min-h-0">
        {/* Left Side - Opportunity Info (2/3) */}
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          {/* Header with icon, name, status and action buttons */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-zinc-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {opportunity.name || 'Без названия'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {opportunity.status && (
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: opportunity.status.color
                          ? `${opportunity.status.color}20`
                          : '#71717a20',
                        color: opportunity.status.color || '#71717a',
                      }}
                    >
                      {opportunity.status.name}
                    </span>
                  )}
                  {opportunity.priority && (
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: opportunity.priority.color
                          ? `${opportunity.priority.color}20`
                          : '#71717a20',
                        color: opportunity.priority.color || '#71717a',
                      }}
                    >
                      {opportunity.priority.name}
                    </span>
                  )}
                  {opportunity.archived && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                      <Archive className="w-3 h-3" />
                      Архив
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Редактировать
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </button>
            </div>
          </div>

          {/* Two-column info layout */}
          <div className="flex gap-12 items-start">
            {/* Left column - Opportunity Info + UTM */}
            <table className="text-sm">
              <tbody>
                {/* Amount */}
                <tr className="h-7">
                  <td className="pr-4 text-zinc-500 dark:text-zinc-400 w-32 align-middle">
                    Сумма
                  </td>
                  <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                    {opportunity.amount !== undefined ? (
                      formatAmount(opportunity.amount)
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>

                {/* Closing Date */}
                <tr className="h-7">
                  <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                    Дата закрытия
                  </td>
                  <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                    {opportunity.closingDate ? (
                      formatShortDate(opportunity.closingDate)
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>

                {/* Owner / Manager */}
                <tr className="h-7">
                  <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                    Менеджер
                  </td>
                  <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                    {opportunity.owner ? (
                      <span>{opportunity.owner.name || opportunity.owner.email}</span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>

                {/* External ID */}
                {opportunity.externalId && (
                  <tr className="h-7">
                    <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                      Внешний ID
                    </td>
                    <td className="text-zinc-900 dark:text-zinc-100 font-mono text-xs align-middle">
                      {opportunity.externalId}
                    </td>
                  </tr>
                )}

                {/* Created */}
                <tr className="h-7">
                  <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                    Создана
                  </td>
                  <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                    {formatDate(opportunity.createdAt)}
                  </td>
                </tr>

                {/* Updated */}
                <tr className="h-7">
                  <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                    Обновлена
                  </td>
                  <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                    {formatDate(opportunity.updatedAt)}
                  </td>
                </tr>

                {/* UTM fields */}
                {opportunity.utm?.source && (
                  <tr className="h-7">
                    <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                      utm_source
                    </td>
                    <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                      {opportunity.utm.source}
                    </td>
                  </tr>
                )}
                {opportunity.utm?.medium && (
                  <tr className="h-7">
                    <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                      utm_medium
                    </td>
                    <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                      {opportunity.utm.medium}
                    </td>
                  </tr>
                )}
                {opportunity.utm?.campaign && (
                  <tr className="h-7">
                    <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                      utm_campaign
                    </td>
                    <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                      {opportunity.utm.campaign}
                    </td>
                  </tr>
                )}
                {opportunity.utm?.term && (
                  <tr className="h-7">
                    <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                      utm_term
                    </td>
                    <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                      {opportunity.utm.term}
                    </td>
                  </tr>
                )}
                {opportunity.utm?.content && (
                  <tr className="h-7">
                    <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                      utm_content
                    </td>
                    <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                      {opportunity.utm.content}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Right column - Contact Info */}
            {contact && (
              <table className="text-sm">
                <tbody>
                  {/* Contact Name */}
                  <tr className="h-7">
                    <td className="pr-4 text-zinc-500 dark:text-zinc-400 w-32 align-middle">
                      Контакт
                    </td>
                    <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {contact.name}
                      </Link>
                    </td>
                  </tr>

                  {/* Company */}
                  {contact.company && (
                    <tr className="h-7">
                      <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                        Компания
                      </td>
                      <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                        {contact.company}
                      </td>
                    </tr>
                  )}

                  {/* Position */}
                  {contact.position && (
                    <tr className="h-7">
                      <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                        Должность
                      </td>
                      <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                        {contact.position}
                      </td>
                    </tr>
                  )}

                  {/* Email */}
                  {contact.emails.length > 0 && (
                    <tr className="h-7">
                      <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                        Email
                      </td>
                      <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                        <a
                          href={`mailto:${contact.emails[0].address}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {contact.emails[0].address}
                        </a>
                      </td>
                    </tr>
                  )}

                  {/* Phone */}
                  {contact.phones.length > 0 && (
                    <tr className="h-7">
                      <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                        Телефон
                      </td>
                      <td className="text-zinc-900 dark:text-zinc-100 align-middle">
                        <a
                          href={`tel:${contact.phones[0].e164}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {contact.phones[0].international}
                        </a>
                      </td>
                    </tr>
                  )}

                  {/* Contact Type */}
                  {contact.contactType && (
                    <tr className="h-7">
                      <td className="pr-4 text-zinc-500 dark:text-zinc-400 align-middle">
                        Тип
                      </td>
                      <td className="align-middle">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: contact.contactType.color
                              ? `${contact.contactType.color}20`
                              : '#71717a20',
                            color: contact.contactType.color || '#71717a',
                          }}
                        >
                          {contact.contactType.name}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Description */}
          {opportunity.description && (
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                Описание
              </div>
              <p className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                {opportunity.description}
              </p>
            </div>
          )}
        </div>

        {/* Right Side - Timeline (resizable) */}
        <ResizablePanel
          minColumns={4}
          maxColumns="50%"
          defaultColumns={5}
          resizeFrom="left"
          storageKey="opportunity-timeline-width"
          className="flex-col min-h-0"
        >
          <OpportunityTimeline
            opportunityId={opportunityId}
            contactId={opportunity.contact?.id}
          />
        </ResizablePanel>
      </div>

      {/* Edit Slide-over */}
      <SlideOver
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Редактирование сделки"
      >
        <OpportunityForm
          opportunity={opportunity}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      </SlideOver>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Удаление сделки"
        message={`Вы уверены, что хотите удалить сделку "${opportunity.name || 'Без названия'}"? Это действие нельзя отменить.`}
        confirmLabel="Подтверждаю"
        cancelLabel="Отменяю"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isDeleting}
      />
    </>
  );
}
