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
import { ContactForm } from '@/app/contacts/components/ContactForm';
import { ContactTimeline } from './ContactTimeline';
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

interface ContactViewProps {
  contactId: string;
}

export function ContactView({ contactId }: ContactViewProps) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
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

      // Fetch owner info
      if (data.ownerId) {
        const ownerResponse = await fetch(`/api/users/${data.ownerId}`);
        if (ownerResponse.ok) {
          const ownerData = await ownerResponse.json();
          setOwner(ownerData);
        }
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

      router.push('/contacts');
    } catch (err) {
      console.error('Error deleting contact:', err);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="flex flex-1 min-h-0">
        {/* Left Side - Contact Info (2/3) */}
        <div className="flex-1 px-6 py-6 overflow-y-auto">
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
                  <Badge
                    className="mt-1"
                    style={{
                      backgroundColor: contact.contactType.color
                        ? `${contact.contactType.color}20`
                        : '#71717a20',
                      color: contact.contactType.color || '#71717a',
                    }}
                  >
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

          {/* Contact Info Table */}
          <table className="w-full text-sm">
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
                          {phone.isPrimary && (
                            <Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
                          )}
                          <a
                            href={`tel:${phone.e164}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {phone.international}
                          </a>
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

          {/* Notes */}
          {contact.notes && (
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                Заметки
              </div>
              <p className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                {contact.notes}
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
          storageKey="contact-timeline-width"
          className="flex-col min-h-0"
        >
          <ContactTimeline contactId={contactId} />
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
