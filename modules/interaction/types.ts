// Взаимодействие с контактом

export type InteractionDirection = 'inbound' | 'outbound';
export type InteractionStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Interaction {
  id: string;
  channelId: string;
  contactId: string;
  opportunityId?: string;
  direction: InteractionDirection;
  status: InteractionStatus;
  subject?: string;
  content: string;
  duration?: number; // для voice/video в секундах
  recordingUrl?: string; // для voice/video
  metadata: Record<string, unknown>;
  createdAt: Date;
  createdBy?: string;
}

// DTOs
export interface CreateInteractionDTO {
  channelId: string;
  contactId: string;
  opportunityId?: string;
  direction: InteractionDirection;
  status?: InteractionStatus;
  subject?: string;
  content: string;
  duration?: number;
  recordingUrl?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
}

export interface UpdateInteractionDTO {
  status?: InteractionStatus;
  subject?: string;
  content?: string;
  duration?: number;
  recordingUrl?: string;
  metadata?: Record<string, unknown>;
}

// Response types
export interface InteractionResponse {
  id: string;
  channelId: string;
  contactId: string;
  opportunityId?: string;
  direction: InteractionDirection;
  status: InteractionStatus;
  subject?: string;
  content: string;
  duration?: number;
  recordingUrl?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  createdBy?: string;
  // Populated fields
  channel?: {
    id: string;
    code: string;
    name: string;
    icon: string;
    color: string;
  };
  contact?: {
    id: string;
    name: string;
  };
}

export interface InteractionListResponse {
  interactions: InteractionResponse[];
  total: number;
}

// Filters
export interface InteractionFilters {
  contactId?: string;
  channelId?: string;
  opportunityId?: string;
  direction?: InteractionDirection;
  status?: InteractionStatus;
  dateFrom?: Date;
  dateTo?: Date;
}
