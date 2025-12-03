import { IOpportunity, IUtm } from './model';

export type { IOpportunity, IUtm };

// Priority from dictionary
export interface OpportunityPriority {
  id: string;
  name: string;
  color?: string;
}

// Pipeline reference
export interface OpportunityPipeline {
  id: string;
  name: string;
  code: string;
}

// Stage reference
export interface OpportunityStage {
  id: string;
  name: string;
  color: string;
  order: number;
  probability: number;
  isInitial: boolean;
  isFinal: boolean;
  isWon: boolean;
}

// Contact reference
export interface OpportunityContact {
  id: string;
  name: string;
}

// Owner reference
export interface OpportunityOwner {
  id: string;
  name: string;
  email: string;
}

export interface CreateOpportunityDTO {
  name?: string;
  amount?: number;
  closingDate?: Date | string;
  utm?: IUtm;
  description?: string;
  externalId?: string;
  archived?: boolean;
  contactId?: string;
  ownerId?: string;
  priorityId?: string;
  pipelineId?: string;
  stageId?: string;
}

export interface UpdateOpportunityDTO {
  name?: string | null;
  amount?: number | null;
  closingDate?: Date | string | null;
  utm?: IUtm | null;
  description?: string | null;
  externalId?: string | null;
  archived?: boolean;
  contactId?: string | null;
  ownerId?: string | null;
  priorityId?: string | null;
  pipelineId?: string | null;
  stageId?: string | null;
}

export interface OpportunityResponse {
  id: string;
  name?: string;
  amount?: number;
  closingDate?: Date;
  utm?: IUtm;
  description?: string;
  externalId?: string;
  archived: boolean;
  contact?: OpportunityContact | null;
  owner?: OpportunityOwner | null;
  priority?: OpportunityPriority | null;
  pipeline?: OpportunityPipeline | null;
  stage?: OpportunityStage | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunitiesListResponse {
  opportunities: OpportunityResponse[];
  total: number;
  totalAmount: number;
  page: number;
  limit: number;
}

export interface OpportunityFilters {
  search?: string;
  archived?: boolean;
  ownerId?: string;
  contactId?: string;
  priorityId?: string;
  pipelineId?: string;
  stageId?: string;
  minAmount?: number;
  maxAmount?: number;
  closingDateFrom?: Date | string;
  closingDateTo?: Date | string;
  page?: number;
  limit?: number;
}
