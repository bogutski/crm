import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, description, ...props }, ref) => {
    return (
      <label className={`flex items-start gap-3 cursor-pointer ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          className="
            mt-0.5 w-4 h-4 rounded
            border-zinc-300 dark:border-zinc-600
            text-blue-600
            focus:ring-blue-500 focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          {...props}
        />
        {(label || description) && (
          <div>
            {label && (
              <span className="text-sm text-zinc-900 dark:text-zinc-50">
                {label}
              </span>
            )}
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
