import { IOpportunity, OpportunityStage, OpportunityPriority } from './model';

export type { IOpportunity, OpportunityStage, OpportunityPriority };

export interface CreateOpportunityDTO {
  title: string;
  description?: string;
  value: number;
  currency?: string;
  stage?: OpportunityStage;
  priority?: OpportunityPriority;
  probability?: number;
  expectedCloseDate?: Date;
  contactId?: string;
  ownerId: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateOpportunityDTO {
  title?: string;
  description?: string;
  value?: number;
  currency?: string;
  stage?: OpportunityStage;
  priority?: OpportunityPriority;
  probability?: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  contactId?: string;
  notes?: string;
  tags?: string[];
}

export interface OpportunityResponse {
  id: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: OpportunityStage;
  priority: OpportunityPriority;
  probability: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  contactId?: string;
  ownerId: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunitiesListResponse {
  opportunities: OpportunityResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface OpportunityFilters {
  search?: string;
  stage?: OpportunityStage;
  priority?: OpportunityPriority;
  ownerId?: string;
  contactId?: string;
  minValue?: number;
  maxValue?: number;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface OpportunityStats {
  totalValue: number;
  totalCount: number;
  byStage: Record<OpportunityStage, { count: number; value: number }>;
  avgProbability: number;
}
