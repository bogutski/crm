import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full px-3 py-2
          border rounded-lg
          bg-white dark:bg-zinc-900
          text-zinc-900 dark:text-zinc-50
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error
            ? 'border-red-500 dark:border-red-500'
            : 'border-zinc-300 dark:border-zinc-700'
          }
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';
