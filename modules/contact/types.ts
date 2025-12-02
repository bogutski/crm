import { IContact, IEmail, IPhone } from './model';

export type { IContact, IEmail, IPhone };

export interface EmailDTO {
  address: string;
  isVerified?: boolean;
  isSubscribed?: boolean;
  unsubscribedAt?: Date;
  bouncedAt?: Date;
  lastEmailedAt?: Date;
}

export interface PhoneDTO {
  e164: string;
  international: string;
  country: string;
  type?: 'MOBILE' | 'FIXED_LINE' | 'UNKNOWN';
  isPrimary?: boolean;
  isVerified?: boolean;
  isSubscribed?: boolean;
  unsubscribedAt?: Date;
  lastSmsAt?: Date;
}

export interface CreateContactDTO {
  name: string;
  emails?: EmailDTO[];
  phones?: PhoneDTO[];
  company?: string;
  position?: string;
  notes?: string;
  contactType?: string;
  source?: string;
  ownerId: string;
}

export interface UpdateContactDTO {
  name?: string;
  emails?: EmailDTO[];
  phones?: PhoneDTO[];
  company?: string;
  position?: string;
  notes?: string;
  contactType?: string | null;
  source?: string | null;
}

export interface ContactResponse {
  id: string;
  name: string;
  emails: IEmail[];
  phones: IPhone[];
  company?: string;
  position?: string;
  notes?: string;
  contactType?: string;
  source?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactsListResponse {
  contacts: ContactResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ContactFilters {
  search?: string;
  ownerId?: string;
  contactType?: string;
  source?: string;
  page?: number;
  limit?: number;
}
