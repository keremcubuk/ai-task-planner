import React, { useId } from 'react';
import { cn } from '@lib/utils';

interface InputTextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  textareaClassName?: string;
  labelClassName?: string;
  id?: string;
  name?: string;
  autoFocus?: boolean;
  rows?: number;
}

export const InputTextarea: React.FC<InputTextareaProps> = ({
  label,
  placeholder,
  value = '',
  onChange,
  disabled = false,
  required = false,
  error,
  className,
  textareaClassName,
  labelClassName,
  id,
  name,
  autoFocus = false,
  rows = 3,
}) => {
  const generatedId = useId();
  const textareaId = id || name || `textarea-${generatedId}`;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={textareaId}
          className={cn(
            'text-sm font-medium text-gray-700',
            required && "after:ml-1 after:text-red-500 after:content-['*']",
            labelClassName
          )}
        >
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={rows}
        className={cn(
          'w-full rounded-md border border-gray-300 px-3 py-2',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none',
          'disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500',
          'bg-white text-gray-900 placeholder:text-gray-400',
          'resize-vertical',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          textareaClassName
        )}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
