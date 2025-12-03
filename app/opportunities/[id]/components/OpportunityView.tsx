'use client';

import { OpportunityContent } from '@/app/opportunities/components/OpportunityContent';

interface OpportunityViewProps {
  opportunityId: string;
}

export function OpportunityView({ opportunityId }: OpportunityViewProps) {
  return <OpportunityContent opportunityId={opportunityId} />;
}
