// Типы телефонных линий пользователей (менеджеров)

// === Возможности линии ===

export const LINE_CAPABILITIES = ['voice', 'sms', 'mms', 'fax'] as const;
export type LineCapability = typeof LINE_CAPABILITIES[number];

// === Статусы линии ===

export const LINE_STATUSES = ['active', 'inactive', 'suspended', 'pending'] as const;
export type LineStatus = typeof LINE_STATUSES[number];

// === Основной интерфейс ===

export interface UserPhoneLine {
  id: string;
  userId: string;
  providerId: string;
  phoneNumber: string;           // E.164 format
  displayName: string;           // "Рабочий", "Личный", etc.
  capabilities: LineCapability[];
  isDefault: boolean;            // Основная линия для исходящих
  isActive: boolean;

  // Настройки переадресации
  forwardingEnabled: boolean;
  forwardTo?: string;            // Номер для переадресации
  forwardOnBusy: boolean;
  forwardOnNoAnswer: boolean;
  forwardOnOffline: boolean;
  forwardAfterRings: number;     // Количество гудков до переадресации

  // SIP настройки
  sipUsername?: string;
  sipDomain?: string;

  // Статистика
  lastInboundCall?: Date;
  lastOutboundCall?: Date;
  totalInboundCalls: number;
  totalOutboundCalls: number;

  createdAt: Date;
  updatedAt: Date;
}

// === DTOs ===

export interface CreateUserPhoneLineDTO {
  userId: string;
  providerId: string;
  phoneNumber: string;
  displayName: string;
  capabilities?: LineCapability[];
  isDefault?: boolean;
  isActive?: boolean;
  forwardingEnabled?: boolean;
  forwardTo?: string;
  forwardOnBusy?: boolean;
  forwardOnNoAnswer?: boolean;
  forwardOnOffline?: boolean;
  forwardAfterRings?: number;
}

export interface UpdateUserPhoneLineDTO {
  displayName?: string;
  capabilities?: LineCapability[];
  isDefault?: boolean;
  isActive?: boolean;
  forwardingEnabled?: boolean;
  forwardTo?: string;
  forwardOnBusy?: boolean;
  forwardOnNoAnswer?: boolean;
  forwardOnOffline?: boolean;
  forwardAfterRings?: number;
}

// === Response types ===

export interface UserPhoneLineResponse {
  id: string;
  userId: string;
  providerId: string;
  providerName?: string;
  providerType?: string;
  phoneNumber: string;
  displayName: string;
  capabilities: LineCapability[];
  isDefault: boolean;
  isActive: boolean;
  forwardingEnabled: boolean;
  forwardTo?: string;
  forwardOnBusy: boolean;
  forwardOnNoAnswer: boolean;
  forwardOnOffline: boolean;
  forwardAfterRings: number;
  lastInboundCall?: Date;
  lastOutboundCall?: Date;
  totalInboundCalls: number;
  totalOutboundCalls: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPhoneLineListResponse {
  lines: UserPhoneLineResponse[];
  total: number;
}

// === Типы для UI ===

export interface PhoneLineWithUser extends UserPhoneLineResponse {
  userName?: string;
  userEmail?: string;
}
