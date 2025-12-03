'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { ResizablePanel } from '@/app/components/ResizablePanel';
import { ChatContactList, ChatContact } from './ChatContactList';
import { ChatContactInfo } from './ChatContactInfo';
import { Timeline } from '@/app/components/Timeline';

export function ChatPageContent() {
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);

  const handleSelectContact = useCallback(async (contact: ChatContact) => {
    setSelectedContact(contact);

    // Mark messages as read when selecting a contact
    if (contact.unreadCount > 0) {
      try {
        await fetch('/api/chat/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: contact.contactId }),
        });
        // Trigger refresh of contact list
        window.dispatchEvent(new CustomEvent('messagesUpdated'));
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  }, []);

  return (
    <main className="flex-1 flex min-h-0 overflow-hidden">
      {/* Left panel - Contact list */}
      <ResizablePanel
        minColumns={4}
        maxColumns={6}
        defaultColumns={5}
        resizeFrom="right"
        storageKey="chat-contacts-panel-width"
        className="border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <ChatContactList
          selectedContactId={selectedContact?.contactId || null}
          onSelectContact={handleSelectContact}
        />
      </ResizablePanel>

      {/* Center - Chat timeline */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-zinc-50 dark:bg-zinc-950">
        {selectedContact ? (
          <Timeline contactId={selectedContact.contactId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Выберите контакт
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[300px]">
              Выберите контакт из списка слева, чтобы начать или продолжить переписку
            </p>
          </div>
        )}
      </div>

      {/* Right panel - Contact info */}
      {selectedContact && (
        <ResizablePanel
          minColumns={4}
          maxColumns={6}
          defaultColumns={4}
          resizeFrom="left"
          storageKey="chat-contact-info-panel-width"
          className="border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <ChatContactInfo contactId={selectedContact.contactId} />
        </ResizablePanel>
      )}
    </main>
  );
}
