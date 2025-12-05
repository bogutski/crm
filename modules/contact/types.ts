// Реэкспорт типов модели
export type { IContact, IEmail, IPhone, IContactType } from './model';

import { IEmail, IPhone } from './model';

// === DTO для контроллера ===

export interface ContactTypeResponse {
  id: string;
  name: string;
  color?: string;
}

export interface OwnerResponse {
  id: string;
  name: string;
  email: string;
}

export interface CreateContactDTO {
  name: string;
  emails?: IEmail[];
  phones?: IPhone[];
  company?: string;
  position?: string;
  notes?: string;
  contactType?: string;
  source?: string;
  ownerId?: string;
}

export interface UpdateContactDTO {
  name?: string;
  emails?: IEmail[];
  phones?: IPhone[];
  company?: string;
  position?: string;
  notes?: string;
  contactType?: string | null;
  source?: string | null;
  ownerId?: string | null;
}

export interface ContactResponse {
  id: string;
  name: string;
  emails: IEmail[];
  phones: IPhone[];
  company?: string;
  position?: string;
  notes?: string;
  contactType?: ContactTypeResponse | null;
  source?: string;
  owner?: OwnerResponse | null;
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
