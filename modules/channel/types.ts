// Канал коммуникации

export interface Channel {
  id: string;
  code: string;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreateChannelDTO {
  code: string;
  name: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export interface UpdateChannelDTO {
  name?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

// Response types
export interface ChannelResponse {
  id: string;
  code: string;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelListResponse {
  channels: ChannelResponse[];
  total: number;
}
