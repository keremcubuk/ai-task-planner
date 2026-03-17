import React from 'react';
import { cn } from '@lib/utils';

interface InputDateProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  required?: boolean;
  error?: string;
}

export const InputDate: React.FC<InputDateProps> = ({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  labelClassName,
  required = false,
  error,
}) => {
  const baseInputClasses = cn(
    'text-sm border rounded-md px-3 py-2 bg-white h-10 focus:outline-none focus:ring-1 transition-colors w-full',
    disabled
      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
      : error
        ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500',
    className
  );

  return (
    <div className="w-full space-y-2">
      {label && (
        <label
          className={cn(
            'text-sm font-medium text-gray-700',
            required && "after:ml-1 after:text-red-500 after:content-['*']",
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={baseInputClasses}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};
