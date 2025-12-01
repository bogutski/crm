import { IContact, ContactStatus } from './model';

export type { IContact, ContactStatus };

export interface CreateContactDTO {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  status?: ContactStatus;
  source?: string;
  notes?: string;
  tags?: string[];
  ownerId: string;
}

export interface UpdateContactDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  status?: ContactStatus;
  source?: string;
  notes?: string;
  tags?: string[];
}

export interface ContactResponse {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  status: ContactStatus;
  source?: string;
  notes?: string;
  tags: string[];
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
  status?: ContactStatus;
  ownerId?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}
