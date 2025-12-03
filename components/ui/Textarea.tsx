import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          w-full px-3 py-2
          border rounded-lg
          bg-white dark:bg-zinc-900
          text-zinc-900 dark:text-zinc-50
          placeholder:text-zinc-400 dark:placeholder:text-zinc-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none
          ${error
            ? 'border-red-500 dark:border-red-500'
            : 'border-zinc-300 dark:border-zinc-700'
          }
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
