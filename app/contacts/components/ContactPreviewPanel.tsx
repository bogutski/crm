'use client';

import { useEffect } from 'react';
import { ContactContent } from './ContactContent';

interface ContactPreviewPanelProps {
  contactId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function ContactPreviewPanel({
  contactId,
  isOpen,
  onClose,
  onDeleted,
}: ContactPreviewPanelProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Block scrolling on html and body
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !contactId) return null;

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
        <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
          <ContactContent
            contactId={contactId}
            onDeleted={handleDeleted}
            isPreview
          />
        </div>
      </div>
    </div>
  );
}
