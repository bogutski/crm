import { getContacts } from '@/modules/contact/controller';
import { SearchContactsParams } from '../types';

export async function searchContacts(params: SearchContactsParams) {
  const { query, limit } = params;

  const result = await getContacts({
    search: query,
    page: 1,
    limit,
  });

  return {
    success: true,
    total: result.total,
    contacts: result.contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      company: contact.company,
      position: contact.position,
      emails: contact.emails?.map((e) => e.address).filter(Boolean) || [],
      phones: contact.phones?.map((p) => p.international || p.e164).filter(Boolean) || [],
      contactType: contact.contactType?.name,
      source: contact.source,
      owner: contact.owner?.name,
    })),
  };
}
