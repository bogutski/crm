'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  ExternalLink,
  Star,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface Email {
  address: string;
  isVerified: boolean;
  isSubscribed: boolean;
}

interface PhoneInfo {
  e164: string;
  international: string;
  country: string;
  type: string;
  isPrimary: boolean;
  isVerified: boolean;
  isSubscribed: boolean;
}

interface ContactType {
  id: string;
  name: string;
  color?: string;
}

interface Contact {
  id: string;
  name: string;
  emails: Email[];
  phones: PhoneInfo[];
  company?: string;
  position?: string;
  notes?: string;
  contactType?: ContactType | null;
  source?: string;
  createdAt: string;
}

interface Opportunity {
  id: string;
  name?: string;
  amount?: number;
  stage?: {
    name: string;
    color: string;
  };
}

interface ChatContactInfoProps {
  contactId: string;
}

export function ChatContactInfo({ contactId }: ChatContactInfoProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        setLoading(true);

        const [contactRes, oppsRes] = await Promise.all([
          fetch(`/api/contacts/${contactId}`),
          fetch(`/api/contacts/${contactId}/opportunities`)
        ]);

        if (contactRes.ok) {
          const contactData = await contactRes.json();
          setContact(contactData);
        }

        if (oppsRes.ok) {
          const oppsData = await oppsRes.json();
          setOpportunities(oppsData || []);
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
      } finally {
        setLoading(false);
      }
    };

    if (contactId) {
      fetchContactInfo();
    }
  }, [contactId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Загрузка...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Контакт не найден</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-700 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-50 truncate">
              {contact.name}
            </h3>
            {contact.contactType && (
              <Badge className="mt-1" color={contact.contactType.color || '#71717a'}>
                {contact.contactType.name}
              </Badge>
            )}
          </div>
        </div>
        <Link
          href={`/contacts/${contact.id}`}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          <span>Открыть карточку</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Info sections */}
      <div className="flex-1 p-4 space-y-4">
        {/* Company & Position */}
        {(contact.company || contact.position) && (
          <div className="space-y-2">
            {contact.company && (
              <div className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300 truncate">{contact.company}</span>
              </div>
            )}
            {contact.position && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300 truncate">{contact.position}</span>
              </div>
            )}
          </div>
        )}

        {/* Emails */}
        {contact.emails.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Email
            </p>
            {contact.emails.map((email, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <a
                  href={`mailto:${email.address}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                >
                  {email.address}
                </a>
                {email.isVerified && (
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Phones */}
        {contact.phones.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Телефон
            </p>
            {contact.phones.map((phone, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {phone.isPrimary && (
                  <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" fill="currentColor" />
                )}
                <Phone className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <a
                  href={`tel:${phone.e164}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {phone.international}
                </a>
                {phone.isVerified && (
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Сделки ({opportunities.length})
            </p>
            <div className="space-y-2">
              {opportunities.slice(0, 3).map((opp) => (
                <Link
                  key={opp.id}
                  href={`/opportunities/${opp.id}`}
                  className="block p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {opp.name || 'Без названия'}
                    </span>
                    {opp.amount && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                        ${new Intl.NumberFormat('en-US').format(opp.amount)}
                      </span>
                    )}
                  </div>
                  {opp.stage && (
                    <Badge className="mt-1" color={opp.stage.color}>
                      {opp.stage.name}
                    </Badge>
                  )}
                </Link>
              ))}
              {opportunities.length > 3 && (
                <Link
                  href={`/contacts/${contact.id}`}
                  className="block text-xs text-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + ещё {opportunities.length - 3}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Заметки
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap line-clamp-4">
              {contact.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
