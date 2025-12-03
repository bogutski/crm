import { ISystemSettings } from './model';

export type { ISystemSettings };

export type CurrencyPosition = 'before' | 'after';

export interface UpdateSystemSettingsDTO {
  currency?: string;
  currencySymbol?: string;
  currencyPosition?: CurrencyPosition;
}

export interface SystemSettingsResponse {
  currency: string;
  currencySymbol: string;
  currencyPosition: CurrencyPosition;
  updatedAt: Date;
  updatedBy?: string;
}
