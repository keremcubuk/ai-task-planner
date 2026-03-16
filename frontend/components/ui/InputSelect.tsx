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
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className={cn("text-sm font-medium text-gray-700", labelClassName)}>
          {label}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full text-left border border-gray-300 rounded-md px-3 py-2 flex justify-between items-center bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]",
            sizeClasses[size],
            disabled && "bg-gray-50 text-gray-500 cursor-not-allowed",
            !disabled && "hover:border-gray-400 cursor-pointer",
            buttonClassName
          )}
        >
          <span className="truncate text-gray-900 block">{selectedLabel}</span>
          <ChevronDown 
            size={16} 
            className={cn(
              "text-gray-500 transition-transform duration-200",
              isOpen && "transform rotate-180"
            )} 
          />
        </button>

        {isOpen && !disabled && (
          <div className={cn(
            "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg",
            dropdownClassName
          )}>
            <div className="p-1 max-h-60 overflow-y-auto">
              {options.map(option => (
                <div 
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer rounded hover:bg-gray-50 transition-colors",
                    value === option.value 
                      ? "bg-blue-50 text-blue-700 font-medium" 
                      : "text-gray-700"
                  )}
                >
                  {option.label}
                </div>
              ))}
              {options.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
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
