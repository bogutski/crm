'use client';

import { useEffect } from 'react';
import { OpportunityContent } from './OpportunityContent';

interface OpportunityPreviewPanelProps {
  opportunityId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function OpportunityPreviewPanel({
  opportunityId,
  isOpen,
  onClose,
  onDeleted,
}: OpportunityPreviewPanelProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !opportunityId) return null;

  const handleDeleted = () => {
    onClose();
    onDeleted?.();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel - 90% width */}
      <div className="fixed inset-y-0 right-0 flex" style={{ width: '90vw' }}>
        <div className="w-full flex flex-col bg-white dark:bg-zinc-900 shadow-xl">
          <OpportunityContent
            opportunityId={opportunityId}
            onDeleted={handleDeleted}
            isPreview
          />
        </div>
      </div>
    </div>
  );
}
