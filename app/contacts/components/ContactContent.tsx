'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Pencil,
  Trash2,
  User,
  Star,
  CheckCircle,
} from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { ResizablePanel } from '@/app/components/ResizablePanel';
import { ContactForm } from './ContactForm';
import { Timeline } from '@/app/components/Timeline';
import { Badge } from '@/components/ui/Badge';

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
  isVerified: boolean;
  isSubscribed: boolean;
}

interface ContactType {
  id: string;
  name: string;
  color?: string;
}

interface Owner {
  id: string;
  name: string;
  email: string;
}

interface Contact {
  id: string;
  name: string;
  emails: Email[];
  phones: Phone[];
  company?: string;
  position?: string;
  notes?: string;
  contactType?: ContactType | null;
  source?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface OpportunityStage {
  id: string;
  name: string;
  color: string;
}

interface OpportunityPipeline {
  id: string;
  name: string;
}

interface OpportunityPriority {
  id: string;
  name: string;
  color?: string;
}

interface Opportunity {
  id: string;
  name?: string;
  amount?: number;
  closingDate?: string;
  stage?: OpportunityStage | null;
  pipeline?: OpportunityPipeline | null;
  priority?: OpportunityPriority | null;
  createdAt: string;
}

interface ContactContentProps {
  contactId: string;
  onDeleted?: () => void;
  isPreview?: boolean;
}

export function ContactContent({
  contactId,
  onDeleted,
  isPreview = false,
}: ContactContentProps) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contacts/${contactId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Контакт не найден');
          return;
        }
        throw new Error('Failed to fetch contact');
      }
      const data = await response.json();
      setContact(data);

      if (data.ownerId) {
        const ownerResponse = await fetch(`/api/users/${data.ownerId}`);
        if (ownerResponse.ok) {
          const ownerData = await ownerResponse.json();
          setOwner(ownerData);
        }
      }

      // Fetch opportunities for this contact
      const oppsResponse = await fetch(`/api/contacts/${contactId}/opportunities`);
      if (oppsResponse.ok) {
        const oppsData = await oppsResponse.json();
        setOpportunities(oppsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  const handleEditSuccess = () => {
    setIsEditing(false);
    fetchContact();
    window.dispatchEvent(new CustomEvent('contactUpdated'));
  };

  const handleDeleteConfirm = async () => {
    if (!contact) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      window.dispatchEvent(new CustomEvent('contactUpdated'));

      if (onDeleted) {
        onDeleted();
      } else {
        router.push('/contacts');
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-zinc-500 dark:text-zinc-400 text-center">Загрузка...</p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="p-8">
        <p className="text-red-500 text-center">{error || 'Контакт не найден'}</p>
        <div className="mt-4 text-center">
          <Link
            href="/contacts"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Вернуться к списку контактов
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Side - Contact Info */}
        <div className="flex-1 min-h-0 px-6 py-6 overflow-y-auto">
          {/* Header with avatar, name, type and action buttons */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-zinc-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {contact.name}
                </h1>
                {contact.contactType && (
                  <Badge className="mt-1" color={contact.contactType.color || '#71717a'}>
                    {contact.contactType.name}
                  </Badge>
                )}
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

          {/* Contact Info and Notes */}
          <div className="flex gap-6">
            {/* Contact Info Table */}
            <table className="text-sm flex-shrink-0">
              <tbody>
              {/* Emails */}
              <tr>
                <td className="py-1 pr-4 text-zinc-500 dark:text-zinc-400 align-top w-32">
                  Email
                </td>
                <td className="py-1 text-zinc-900 dark:text-zinc-100">
                  {contact.emails.length > 0 ? (
                    <div className="space-y-1">
                      {contact.emails.map((email, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <a
                            href={`mailto:${email.address}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {email.address}
                          </a>
                          {email.isVerified && (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          )}
                          {!email.isSubscribed && (
                            <span className="text-xs text-zinc-400">(отписан)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
              </tr>

              {/* Phones */}
              <tr>
                <td className="py-1 pr-4 text-zinc-500 dark:text-zinc-400 align-top">
                  Телефон
                </td>
                <td className="py-1 text-zinc-900 dark:text-zinc-100">
                  {contact.phones.length > 0 ? (
                    <div className="space-y-1">
                      {contact.phones.map((phone, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <a
                            href={`tel:${phone.e164}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {phone.international}
                          </a>
                          {phone.isPrimary && (
                            <Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
                          )}
                          {phone.isVerified && (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          )}
                          {!phone.isSubscribed && (
                            <span className="text-xs text-zinc-400">(отписан)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
              </tr>

              {/* Company */}
              <tr>
                <td className="py-1 pr-4 text-zinc-500 dark:text-zinc-400">
                  Компания
                </td>
                <td className="py-1 text-zinc-900 dark:text-zinc-100">
                  {contact.company || <span className="text-zinc-400">—</span>}
                </td>
              </tr>

              {/* Position */}
              <tr>
                <td className="py-1 pr-4 text-zinc-500 dark:text-zinc-400">
                  Должность
                </td>
                <td className="py-1 text-zinc-900 dark:text-zinc-100">
                  {contact.position || <span className="text-zinc-400">—</span>}
                </td>
              </tr>

              {/* Source */}
              <tr>
                <td className="py-1 pr-4 text-zinc-500 dark:text-zinc-400">
                  Источник
                </td>
                <td className="py-1 text-zinc-900 dark:text-zinc-100">
                  {contact.source || <span className="text-zinc-400">—</span>}
                </td>
              </tr>

              {/* Owner / Manager */}
              <tr>
                <td className="py-1 pr-4 text-zinc-500 dark:text-zinc-400">
                  Менеджер
                </td>
                <td className="py-1 text-zinc-900 dark:text-zinc-100">
                  {owner ? (
                    <span>{owner.name || owner.email}</span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
              </tr>

              {/* Created */}
              <tr>
                <td className="py-1 pr-4 text-zinc-500 dark:text-zinc-400">
                  Создан
                </td>
                <td className="py-1 text-zinc-900 dark:text-zinc-100">
                  {formatDate(contact.createdAt)}
                </td>
              </tr>

              {/* Updated */}
              <tr>
                <td className="py-1 pr-4 text-zinc-500 dark:text-zinc-400">
                  Обновлён
                </td>
                <td className="py-1 text-zinc-900 dark:text-zinc-100">
                  {formatDate(contact.updatedAt)}
                </td>
              </tr>
            </tbody>
          </table>

            {/* Notes Column */}
            {contact.notes && (
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                  Заметки
                </div>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                  {contact.notes}
                </p>
              </div>
            )}
          </div>

          {/* Opportunities */}
          {opportunities.length > 0 && (
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                Сделки ({opportunities.length})
              </div>
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
                          Воронка
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.map((opp) => (
                        <tr
                          key={opp.id}
                          className="border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="px-4 py-1.5">
                            <button
                              onClick={() => router.push(`/opportunities/${opp.id}`)}
                              className="text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left"
                            >
                              {opp.name || 'Без названия'}
                            </button>
                          </td>
                          <td className="px-4 py-1.5">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {opp.amount ? `$${new Intl.NumberFormat('en-US').format(opp.amount)}` : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-1.5">
                            {opp.priority ? (
                              <Badge color={opp.priority.color || '#71717a'}>
                                {opp.priority.name}
                              </Badge>
                            ) : (
                              <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-1.5">
                            {opp.stage ? (
                              <Badge color={opp.stage.color || '#71717a'}>
                                {opp.stage.name}
                              </Badge>
                            ) : (
                              <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-1.5">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {opp.pipeline?.name || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side - Timeline (resizable) */}
        <ResizablePanel
          minColumns={4}
          maxColumns="50%"
          defaultColumns={5}
          resizeFrom="left"
          storageKey={isPreview ? "contact-preview-timeline-width" : "contact-timeline-width"}
          className="flex-col min-h-0"
        >
          <Timeline contactId={contactId} />
        </ResizablePanel>
      </div>

      {/* Edit Slide-over */}
      <SlideOver
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Редактирование контакта"
      >
        <ContactForm
          contact={contact}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      </SlideOver>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Удаление контакта"
        message={`Вы уверены, что хотите удалить контакт "${contact.name}"? Это действие нельзя отменить.`}
        confirmLabel="Подтверждаю"
        cancelLabel="Отменяю"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isDeleting}
      />
    </>
  );
}
