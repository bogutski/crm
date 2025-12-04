import { ISystemSettings, AIProvider, IAIProviderConfig, IAISettings } from './model';

export type { ISystemSettings, AIProvider, IAIProviderConfig, IAISettings };

export type CurrencyPosition = 'before' | 'after';

export interface UpdateSystemSettingsDTO {
  currency?: string;
  currencySymbol?: string;
  currencyPosition?: CurrencyPosition;
  ai?: Partial<IAISettings>;
}

export interface UpdateAIProviderDTO {
  provider: AIProvider;
  enabled: boolean;
  apiKey?: string;
  model: string;
}

export interface SetActiveAIProviderDTO {
  provider: AIProvider;
}

export interface SystemSettingsResponse {
  currency: string;
  currencySymbol: string;
  currencyPosition: CurrencyPosition;
  ai?: {
    activeProvider?: AIProvider;
    providers: {
      openai?: { enabled: boolean; model: string; hasApiKey: boolean };
      anthropic?: { enabled: boolean; model: string; hasApiKey: boolean };
      google?: { enabled: boolean; model: string; hasApiKey: boolean };
    };
  };
  updatedAt: Date;
  updatedBy?: string;
}
