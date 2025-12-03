'use client';

import {
  MessageCircle,
  Mail,
  Phone,
  Video,
  MessageSquare,
  Send,
  AtSign,
  Hash,
  Camera,
  PhoneCall,
  PhoneIncoming,
  Briefcase,
  Globe,
  Smartphone,
  LucideIcon,
} from 'lucide-react';

// Список доступных иконок для каналов
export const CHANNEL_ICONS = [
  'message-circle',
  'mail',
  'phone',
  'phone-call',
  'phone-incoming',
  'video',
  'message-square',
  'send',
  'at-sign',
  'hash',
  'camera',
  'briefcase',
  'globe',
  'smartphone',
] as const;

export type ChannelIconName = (typeof CHANNEL_ICONS)[number];

// Маппинг названий к компонентам иконок
const iconMap: Record<ChannelIconName, LucideIcon> = {
  'message-circle': MessageCircle,
  'mail': Mail,
  'phone': Phone,
  'phone-call': PhoneCall,
  'phone-incoming': PhoneIncoming,
  'video': Video,
  'message-square': MessageSquare,
  'send': Send,
  'at-sign': AtSign,
  'hash': Hash,
  'camera': Camera,
  'briefcase': Briefcase,
  'globe': Globe,
  'smartphone': Smartphone,
};

interface ChannelIconProps {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}

export function ChannelIcon({ name, color = '#6b7280', size = 16, className }: ChannelIconProps) {
  const Icon = iconMap[name as ChannelIconName] || MessageCircle;
  return <Icon size={size} color={color} className={className} />;
}
