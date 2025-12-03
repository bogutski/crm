'use client';

import { ContactContent } from '@/app/contacts/components/ContactContent';

interface ContactViewProps {
  contactId: string;
}

export function ContactView({ contactId }: ContactViewProps) {
  return <ContactContent contactId={contactId} />;
}
