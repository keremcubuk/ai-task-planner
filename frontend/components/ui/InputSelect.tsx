import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface InputSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const InputSelect: React.FC<InputSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  className,
  labelClassName,
  buttonClassName,
  dropdownClassName,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);
  const selectedLabel = selectedOption?.label || placeholder;

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className={cn('text-sm font-medium text-gray-700', labelClassName)}>{label}</label>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex w-full min-w-[120px] items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left focus:ring-1 focus:ring-blue-500 focus:outline-none',
            sizeClasses[size],
            disabled && 'cursor-not-allowed bg-gray-50 text-gray-500',
            !disabled && 'cursor-pointer hover:border-gray-400',
            buttonClassName
          )}
        >
          <span className="block truncate text-gray-900">{selectedLabel}</span>
          <ChevronDown
            size={16}
            className={cn(
              'text-gray-500 transition-transform duration-200',
              isOpen && 'rotate-180 transform'
            )}
          />
        </button>

        {isOpen && !disabled && (
          <div
            className={cn(
              'absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg',
              dropdownClassName
            )}
          >
            <div className="max-h-60 overflow-y-auto p-1">
              {options.map(option => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'cursor-pointer rounded px-3 py-2 text-sm transition-colors hover:bg-gray-50',
                    value === option.value
                      ? 'bg-blue-50 font-medium text-blue-700'
                      : 'text-gray-700'
                  )}
                >
                  {option.label}
                </div>
              ))}
              {options.length === 0 && (
                <div className="px-3 py-2 text-center text-sm text-gray-500">
                  No options available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
