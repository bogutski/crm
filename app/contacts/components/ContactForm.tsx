'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2, Star } from 'lucide-react';
import { contactFormSchema, type ContactFormData } from '@/modules/contact/validation';
import { ColorSelect, type ColorOption } from '@/components/ui/ColorSelect';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Button } from '@/components/ui/Button';

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
  emails: { address: string }[];
  phones: {
    e164: string;
    international: string;
    country: string;
    type: 'MOBILE' | 'FIXED_LINE' | 'UNKNOWN';
    isPrimary: boolean;
  }[];
  company?: string;
  position?: string;
  notes?: string;
  contactType?: ContactType | null;
  source?: string;
  owner?: Owner | null;
}

interface DictionaryItem {
  id: string;
  code?: string;
  name: string;
  properties: Record<string, unknown>;
}

interface ContactFormProps {
  contact?: Contact;
  onSuccess: () => void;
  onCancel: () => void;
}

const getDefaultValues = (contact?: Contact): ContactFormData => {
  if (contact) {
    return {
      name: contact.name,
      emails: contact.emails.length > 0
        ? contact.emails.map(e => ({ address: e.address }))
        : [{ address: '' }],
      phones: contact.phones.length > 0
        ? contact.phones.map(p => ({ number: p.e164, isPrimary: p.isPrimary }))
        : [{ number: '', isPrimary: true }],
      company: contact.company || '',
      position: contact.position || '',
      notes: contact.notes || '',
      contactType: contact.contactType?.id || '',
      source: contact.source || '',
      ownerId: contact.owner?.id || '',
    };
  }

  return {
    name: '',
    emails: [{ address: '' }],
    phones: [{ number: '', isPrimary: true }],
    company: '',
    position: '',
    notes: '',
    contactType: '',
    source: '',
    ownerId: '',
  };
};

export function ContactForm({ contact, onSuccess, onCancel }: ContactFormProps) {
  const isEditMode = Boolean(contact);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Словари
  const [contactTypes, setContactTypes] = useState<DictionaryItem[]>([]);
  const [sources, setSources] = useState<DictionaryItem[]>([]);
  const [users, setUsers] = useState<Owner[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: getDefaultValues(contact),
  });

  const {
    fields: emailFields,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({ control, name: 'emails' });

  const {
    fields: phoneFields,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({ control, name: 'phones' });

  const phones = watch('phones');

  useEffect(() => {
    Promise.all([
      fetch('/api/dictionaries/contact_types/items').then(r => r.ok ? r.json() : { items: [] }),
      fetch('/api/dictionaries/sources/items').then(r => r.ok ? r.json() : { items: [] }),
      fetch('/api/users/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 100 }),
      }).then(r => r.ok ? r.json() : { users: [] }),
    ]).then(([typesData, sourcesData, usersData]) => {
      setContactTypes(typesData.items || []);
      setSources(sourcesData.items || []);
      setUsers(usersData.users || []);
    });
  }, []);

  // Обновляем форму при изменении контакта (для режима редактирования)
  useEffect(() => {
    if (contact) {
      reset(getDefaultValues(contact));
    }
  }, [contact, reset]);

  const setPhonePrimary = (index: number) => {
    phones.forEach((_, i) => {
      setValue(`phones.${i}.isPrimary`, i === index);
    });
  };

  const onSubmit = async (data: ContactFormData) => {
    setSubmitError(null);

    try {
      // Фильтруем пустые emails и phones
      const validEmails = data.emails
        .filter(e => e.address.trim())
        .map(e => ({ address: e.address.trim() }));

      // Отправляем только e164 и isPrimary - бэкенд сам заполнит остальные поля
      const validPhones = data.phones
        .filter(p => p.number.trim())
        .map(p => ({
          e164: p.number,
          isPrimary: p.isPrimary,
        }));

      const payload = {
        name: data.name.trim(),
        emails: validEmails,
        phones: validPhones,
        company: data.company?.trim() || undefined,
        position: data.position?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        contactType: isEditMode ? (data.contactType || null) : (data.contactType || undefined),
        source: isEditMode ? (data.source || null) : (data.source || undefined),
        ownerId: isEditMode ? (data.ownerId || null) : (data.ownerId || undefined),
      };

      const url = isEditMode ? `/api/contacts/${contact!.id}` : '/api/contacts';
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} contact`);
      }

      window.dispatchEvent(new CustomEvent(isEditMode ? 'contactUpdated' : 'contactCreated'));
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    }
  };

  // Преобразуем типы контактов в формат ColorSelect
  const contactTypeOptions: ColorOption[] = useMemo(() =>
    contactTypes.map(type => ({
      value: type.id,
      label: type.name,
      color: type.properties.color as string | undefined,
    })),
    [contactTypes]
  );

  // Преобразуем источники в формат ColorSelect
  const sourceOptions: ColorOption[] = useMemo(() =>
    sources.map(src => ({
      value: src.id,
      label: src.name,
      color: src.properties.color as string | undefined,
    })),
    [sources]
  );

  // Преобразуем пользователей в формат ColorSelect
  const ownerOptions: ColorOption[] = useMemo(() => [
    { value: '', label: 'Не назначен' },
    ...users.map(u => ({
      value: u.id,
      label: u.name,
    })),
  ], [users]);

  const idPrefix = isEditMode ? 'edit-' : '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor={`${idPrefix}name`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Имя *
        </label>
        <input
          id={`${idPrefix}name`}
          type="text"
          {...register('name')}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Emails */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <button
            type="button"
            onClick={() => appendEmail({ address: '' })}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            + Добавить
          </button>
        </div>
        <div className="space-y-2">
          {emailFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <input
                type="email"
                {...register(`emails.${index}.address`)}
                placeholder="email@example.com"
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {emailFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEmail(index)}
                  className="px-2 py-2 text-zinc-400 hover:text-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Phones */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Телефон
          </label>
          <button
            type="button"
            onClick={() => appendPhone({ number: '', isPrimary: false })}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            + Добавить
          </button>
        </div>
        <div className="space-y-2">
          {phoneFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-center">
              <div className="flex-1">
                <Controller
                  control={control}
                  name={`phones.${index}.number`}
                  render={({ field: phoneField }) => (
                    <PhoneInput
                      value={phoneField.value}
                      onChange={phoneField.onChange}
                      defaultCountry="us"
                    />
                  )}
                />
              </div>
              <Controller
                control={control}
                name={`phones.${index}.isPrimary`}
                render={({ field: primaryField }) => (
                  <button
                    type="button"
                    onClick={() => setPhonePrimary(index)}
                    className={`px-2 py-2 rounded ${
                      primaryField.value
                        ? 'text-yellow-500'
                        : 'text-zinc-300 dark:text-zinc-600 hover:text-yellow-500'
                    }`}
                    title={primaryField.value ? 'Основной' : 'Сделать основным'}
                  >
                    <Star className="w-5 h-5" fill={primaryField.value ? 'currentColor' : 'none'} />
                  </button>
                )}
              />
              {phoneFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhone(index)}
                  className="px-2 py-2 text-zinc-400 hover:text-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Owner */}
      <div>
        <label htmlFor={`${idPrefix}ownerId`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Владелец
        </label>
        <Controller
          control={control}
          name="ownerId"
          render={({ field }) => (
            <ColorSelect
              id={`${idPrefix}ownerId`}
              options={ownerOptions}
              value={field.value || ''}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Contact Type & Source */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}contactType`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Тип контакта
          </label>
          <Controller
            control={control}
            name="contactType"
            render={({ field }) => (
              <ColorSelect
                id={`${idPrefix}contactType`}
                options={contactTypeOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Не указан"
              />
            )}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}source`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Источник
          </label>
          <Controller
            control={control}
            name="source"
            render={({ field }) => (
              <ColorSelect
                id={`${idPrefix}source`}
                options={sourceOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Не указан"
              />
            )}
          />
        </div>
      </div>

      {/* Company & Position */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}company`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Компания
          </label>
          <input
            id={`${idPrefix}company`}
            type="text"
            {...register('company')}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}position`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Должность
          </label>
          <input
            id={`${idPrefix}position`}
            type="text"
            {...register('position')}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor={`${idPrefix}notes`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Заметки
        </label>
        <textarea
          id={`${idPrefix}notes`}
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {isEditMode ? 'Сохранить' : 'Создать контакт'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
