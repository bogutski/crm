'use client';

import Link from 'next/link';
import { Pencil, Calendar, DollarSign, ScanEye } from 'lucide-react';
import type { KanbanItem } from '../types';
import { Badge } from '@/components/ui/Badge';

interface Priority {
  id: string;
  name: string;
  color?: string;
}

interface Contact {
  id: string;
  name: string;
}

interface OpportunityStage {
  id: string;
  name: string;
  color: string;
  pipelineId?: string;
  isInitial?: boolean;
}

export interface Opportunity extends KanbanItem {
  id: string;
  name?: string;
  amount?: number;
  closingDate?: string;
  description?: string;
  archived: boolean;
  priority?: Priority | null;
  stage?: OpportunityStage | null;
  pipeline?: { id: string; name: string; code: string } | null;
  contact?: Contact | null;
  createdAt: string;
}

export interface OpportunityCardProps {
  opportunity: Opportunity;
  onEditClick: (opportunity: Opportunity) => void;
  onPreviewClick: (opportunityId: string) => void;
}

const formatAmount = (amount?: number, withSymbol = true) => {
  if (amount === undefined || amount === null) return '';
  let formatted: string;
  if (amount >= 1000000) {
    formatted = `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    formatted = `${(amount / 1000).toFixed(0)}K`;
  } else {
    formatted = amount.toString();
  }
  return withSymbol ? `$${formatted}` : formatted;
};

const formatDate = (date?: string) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

export function OpportunityCard({ opportunity, onEditClick, onPreviewClick }: OpportunityCardProps) {
  return (
    <div className="group bg-white dark:bg-zinc-900 rounded-lg shadow-sm hover:shadow-md border-0 hover:ring-2 hover:ring-blue-400/50 cursor-pointer transition-all">
      <div className="p-2.5">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onPreviewClick(opportunity.id);
            }}
            className="font-medium text-sm text-zinc-800 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 flex-1 text-left"
          >
            {opportunity.name || 'Без названия'}
          </button>

          <Link
            href={`/opportunities/${opportunity.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
            title="Открыть страницу"
          >
            <ScanEye className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onEditClick(opportunity);
            }}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
            title="Редактировать"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Badges row - Trello style */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {opportunity.amount && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              <DollarSign className="w-3 h-3" />
              {formatAmount(opportunity.amount)}
            </span>
          )}
          {opportunity.closingDate && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              <Calendar className="w-3 h-3" />
              {formatDate(opportunity.closingDate)}
            </span>
          )}
          {opportunity.priority && (
            <Badge color={opportunity.priority.color || '#71717a'} rounded="md">
              {opportunity.priority.name}
            </Badge>
          )}
        </div>

        {/* Contact - bottom */}
        {opportunity.contact && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
              {opportunity.contact.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
              {opportunity.contact.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
