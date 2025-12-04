'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ContactsTable } from './ContactsTable';
import { ContactsSearch } from './ContactsSearch';
import { CreateContactButton } from './CreateContactButton';
import { ContactsFilters } from './ContactsFilters';

interface ContactsPageContentProps {
  initialPage?: number;
  initialSearch?: string;
  initialOwnerId?: string;
  initialContactType?: string;
  initialSource?: string;
}

export function ContactsPageContent({
  initialPage = 1,
  initialSearch = '',
  initialOwnerId,
  initialContactType,
  initialSource,
}: ContactsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read current values from URL
  const currentSearch = searchParams.get('search') || initialSearch;
  const currentOwnerId = searchParams.get('ownerId') || initialOwnerId;
  const currentContactType = searchParams.get('contactType') || initialContactType;
  const currentSource = searchParams.get('source') || initialSource;

  const handleFilterChange = useCallback((filters: {
    ownerId?: string;
    contactType?: string;
    source?: string;
  }) => {
    const newParams = new URLSearchParams(searchParams.toString());

    // Update filter params
    if (filters.ownerId) {
      newParams.set('ownerId', filters.ownerId);
    } else {
      newParams.delete('ownerId');
    }

    if (filters.contactType) {
      newParams.set('contactType', filters.contactType);
    } else {
      newParams.delete('contactType');
    }

    if (filters.source) {
      newParams.set('source', filters.source);
    } else {
      newParams.delete('source');
    }

    // Reset to page 1 when filters change
    newParams.delete('page');

    router.push(`?${newParams.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <div>
      {/* Header row: Title + Filters + Search + Create button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Контакты
        </h2>
        <div className="flex items-center gap-4">
          <ContactsFilters
            ownerId={currentOwnerId}
            contactType={currentContactType}
            source={currentSource}
            onFilterChange={handleFilterChange}
          />
          <ContactsSearch initialSearch={currentSearch} />
          <CreateContactButton />
        </div>
      </div>

      {/* Table */}
      <ContactsTable
        initialPage={initialPage}
        initialSearch={currentSearch}
        ownerId={currentOwnerId}
        contactType={currentContactType}
        source={currentSource}
      />
    </div>
  );
}
