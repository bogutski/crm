'use client';

import { useState } from 'react';
import { SlideOver } from '@/app/components/SlideOver';
import { ContactForm } from './ContactForm';

export function CreateContactButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Создать контакт
      </button>

      <SlideOver
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Новый контакт"
      >
        <ContactForm onSuccess={handleSuccess} onCancel={() => setIsOpen(false)} />
      </SlideOver>
    </>
  );
}
