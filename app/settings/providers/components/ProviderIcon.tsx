'use client';

import Image from 'next/image';

interface ProviderIconProps {
  type: string;
  size?: number;
  className?: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  twilio: '#F22F46',
  telnyx: '#00C26F',
  plivo: '#5B45BB',
  vapi: '#6366F1',
  elevenlabs: '#000000',
  retell: '#3B82F6',
  bland: '#8B5CF6',
};

const PROVIDER_INITIALS: Record<string, string> = {
  twilio: 'Tw',
  telnyx: 'Tx',
  plivo: 'Pl',
  vapi: 'VA',
  elevenlabs: 'XI',
  retell: 'Re',
  bland: 'Bl',
};

export function ProviderIcon({ type, size = 24, className = '' }: ProviderIconProps) {
  const color = PROVIDER_COLORS[type] || '#6B7280';
  const initials = PROVIDER_INITIALS[type] || type.slice(0, 2).toUpperCase();

  return (
    <div
      className={`flex items-center justify-center rounded-lg font-bold text-white ${className}`}
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
      data-testid={`provider-icon-${type}`}
    >
      {initials}
    </div>
  );
}
