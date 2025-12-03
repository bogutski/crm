'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { TaskForm } from './TaskForm';

interface Project {
  id: string;
  name: string;
}

interface CreateTaskButtonProps {
  projects: Project[];
}

export function CreateTaskButton({ projects }: CreateTaskButtonProps) {
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
        <Plus className="w-5 h-5" />
        Создать задачу
      </button>

      <SlideOver
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Новая задача"
      >
        <TaskForm
          projects={projects}
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
        />
      </SlideOver>
    </>
  );
}
