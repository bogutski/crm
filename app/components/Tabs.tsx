'use client';

import { ReactNode } from 'react';

export interface Tab<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
}

export function Tabs<T extends string>({ tabs, activeTab, onChange }: TabsProps<T>) {
  return (
    <div className="relative border-b border-zinc-200 dark:border-zinc-800 mb-6">
      <nav className="flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative pb-3 px-1 text-sm font-medium cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-zinc-900 dark:bg-zinc-50" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

interface TabPanelProps {
  children: ReactNode;
  value: string;
  activeValue: string;
}

export function TabPanel({ children, value, activeValue }: TabPanelProps) {
  if (value !== activeValue) return null;
  return <>{children}</>;
}
