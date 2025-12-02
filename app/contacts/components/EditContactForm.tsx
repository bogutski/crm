'use client';

import { useState, useEffect } from 'react';

interface EmailField {
  address: string;
}

interface PhoneField {
  e164: string;
  international: string;
  country: string;
  type: 'MOBILE' | 'FIXED_LINE' | 'UNKNOWN';
  isPrimary: boolean;
}

interface Contact {
  id: string;
  name: string;
  emails: EmailField[];
  phones: PhoneField[];
  company?: string;
  position?: string;
  notes?: string;
  contactType?: string;
  source?: string;
}

interface DictionaryItem {
  id: string;
  code?: string;
  name: string;
  properties: Record<string, unknown>;
}

interface EditContactFormProps {
  contact: Contact;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditContactForm({ contact, onSuccess, onCancel }: EditContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(contact.name);
  const [company, setCompany] = useState(contact.company || '');
  const [position, setPosition] = useState(contact.position || '');
  const [notes, setNotes] = useState(contact.notes || '');
  const [contactType, setContactType] = useState(contact.contactType || '');
  const [source, setSource] = useState(contact.source || '');

  const [emails, setEmails] = useState<EmailField[]>(
    contact.emails.length > 0 ? contact.emails : [{ address: '' }]
  );
  const [phones, setPhones] = useState<PhoneField[]>(
    contact.phones.length > 0
      ? contact.phones
      : [{ e164: '', international: '', country: 'RU', type: 'MOBILE', isPrimary: true }]
  );

  // Словари
  const [contactTypes, setContactTypes] = useState<DictionaryItem[]>([]);
  const [sources, setSources] = useState<DictionaryItem[]>([]);

  useEffect(() => {
    // Загрузка словарей
    Promise.all([
      fetch('/api/dictionaries/contact_types/items').then(r => r.ok ? r.json() : { items: [] }),
      fetch('/api/dictionaries/sources/items').then(r => r.ok ? r.json() : { items: [] }),
    ]).then(([typesData, sourcesData]) => {
      setContactTypes(typesData.items || []);
      setSources(sourcesData.items || []);
    });
  }, []);

  useEffect(() => {
    setName(contact.name);
    setCompany(contact.company || '');
    setPosition(contact.position || '');
    setNotes(contact.notes || '');
    setContactType(contact.contactType || '');
    setSource(contact.source || '');
    setEmails(contact.emails.length > 0 ? contact.emails : [{ address: '' }]);
    setPhones(
      contact.phones.length > 0
        ? contact.phones
        : [{ e164: '', international: '', country: 'RU', type: 'MOBILE', isPrimary: true }]
    );
  }, [contact]);

  const addEmail = () => {
    setEmails([...emails, { address: '' }]);
  };

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, value: string) => {
    const updated = [...emails];
    updated[index].address = value;
    setEmails(updated);
  };

  const addPhone = () => {
    setPhones([
      ...phones,
      { e164: '', international: '', country: 'RU', type: 'MOBILE', isPrimary: false },
    ]);
  };

  const removePhone = (index: number) => {
    if (phones.length > 1) {
      setPhones(phones.filter((_, i) => i !== index));
    }
  };

  const updatePhone = (index: number, value: string) => {
    const updated = [...phones];
    const cleaned = value.replace(/[^\d+\s\-()]/g, '');
    updated[index].e164 = cleaned.replace(/[\s\-()]/g, '');
    updated[index].international = cleaned;
    setPhones(updated);
  };

  const setPhonePrimary = (index: number) => {
    const updated = phones.map((phone, i) => ({
      ...phone,
      isPrimary: i === index,
    }));
    setPhones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const validEmails = emails
        .filter((email) => email.address.trim())
        .map((email) => ({ address: email.address.trim() }));

      const validPhones = phones
        .filter((phone) => phone.e164.trim())
        .map((phone) => ({
          e164: phone.e164.startsWith('+') ? phone.e164 : `+${phone.e164}`,
          international: phone.international || phone.e164,
          country: phone.country,
          type: phone.type,
          isPrimary: phone.isPrimary,
        }));

      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          emails: validEmails,
          phones: validPhones,
          company: company.trim() || undefined,
          position: position.trim() || undefined,
          notes: notes.trim() || undefined,
          contactType: contactType || null,
          source: source || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update contact');
      }

      window.dispatchEvent(new CustomEvent('contactUpdated'));
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Name field */}
      <div>
        <label htmlFor="edit-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Имя *
        </label>
        <input
          id="edit-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Emails */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <button
            type="button"
            onClick={addEmail}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            + Добавить
          </button>
        </div>
        <div className="space-y-2">
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="email"
                value={email.address}
                onChange={(e) => updateEmail(index, e.target.value)}
                placeholder="email@example.com"
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {emails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEmail(index)}
                  className="px-2 py-2 text-zinc-400 hover:text-red-500"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
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
            onClick={addPhone}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            + Добавить
          </button>
        </div>
        <div className="space-y-2">
          {phones.map((phone, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="tel"
                value={phone.international}
                onChange={(e) => updatePhone(index, e.target.value)}
                placeholder="+7 999 123-45-67"
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setPhonePrimary(index)}
                className={`px-2 py-2 rounded ${
                  phone.isPrimary
                    ? 'text-yellow-500'
                    : 'text-zinc-300 dark:text-zinc-600 hover:text-yellow-500'
                }`}
                title={phone.isPrimary ? 'Основной' : 'Сделать основным'}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
              {phones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhone(index)}
                  className="px-2 py-2 text-zinc-400 hover:text-red-500"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Type & Source */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-contactType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Тип контакта
          </label>
          <select
            id="edit-contactType"
            value={contactType}
            onChange={(e) => setContactType(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Не указан</option>
            {contactTypes.map((type) => (
              <option key={type.id} value={type.code || type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="edit-source" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Источник
          </label>
          <select
            id="edit-source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Не указан</option>
            {sources.map((src) => (
              <option key={src.id} value={src.code || src.id}>
                {src.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Company & Position */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-company" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Компания
          </label>
          <input
            id="edit-company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="edit-position" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Должность
          </label>
          <input
            id="edit-position"
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="edit-notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Заметки
        </label>
        <textarea
          id="edit-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium rounded-md transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
