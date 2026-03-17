import React, { useId } from 'react';
import { cn } from '@lib/utils';

interface InputFieldProps {
  label?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  id?: string;
  name?: string;
  autoFocus?: boolean;
  min?: string;
  max?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value = '',
  onChange,
  type = 'text',
  disabled = false,
  required = false,
  error,
  className,
  inputClassName,
  labelClassName,
  icon,
  iconPosition = 'left',
  id,
  name,
  autoFocus = false,
  min,
  max,
}) => {
  const generatedId = useId();
  const inputId = id || name || `input-${generatedId}`;

  const baseInputClasses = cn(
    'w-full h-10 px-3 py-2 border border-gray-300 rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200',
    'placeholder:text-gray-400 text-gray-900 bg-white',
    icon && iconPosition === 'left' && 'pl-10',
    icon && iconPosition === 'right' && 'pr-10',
    error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
    inputClassName
  );

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium text-gray-700',
            required && "after:ml-1 after:text-red-500 after:content-['*']",
            labelClassName
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          autoFocus={autoFocus}
          min={min}
          max={max}
          className={baseInputClasses}
        />

        {icon && iconPosition === 'right' && (
          <div className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
