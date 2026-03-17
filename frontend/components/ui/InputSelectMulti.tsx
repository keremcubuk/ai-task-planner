import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@lib/utils';

interface InputSelectMultiProps {
  label?: string;
  selectedValues: string[];
  availableValues: string[];
  onToggleValue: (value: string) => void;
  onToggleAll: () => void;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
  selectAllText?: string;
  noneSelectedText?: string;
  allSelectedText?: string;
  selectedCountText?: string;
  labelClassName?: string;
}

export const InputSelectMulti: React.FC<InputSelectMultiProps> = ({
  label,
  selectedValues,
  availableValues,
  onToggleValue,
  onToggleAll,
  searchPlaceholder = 'Search...',
  className,
  disabled = false,
  emptyMessage = 'No options found',
  selectAllText = 'Select All',
  noneSelectedText = 'None Selected',
  allSelectedText = 'All Selected',
  selectedCountText = 'Selected',
  labelClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getDisplayText = () => {
    if (selectedValues.length === availableValues.length && availableValues.length > 0) {
      return allSelectedText;
    }
    if (selectedValues.length === 0) {
      return noneSelectedText;
    }
    return `${selectedValues.length} ${selectedCountText}`;
  };

  const filteredValues = availableValues.filter(value =>
    value.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={cn(label ? 'space-y-2' : 'relative', className)}>
      {label && (
        <label className={cn('text-sm font-medium text-gray-700', labelClassName)}>{label}</label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors focus:ring-1 focus:ring-blue-500 focus:outline-none',
            disabled
              ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500'
              : 'cursor-pointer border-gray-300 bg-white text-gray-900 hover:border-gray-400'
          )}
        >
          <span className="block truncate">{getDisplayText()}</span>
          <ChevronDown
            size={16}
            className={cn(
              'transition-transform duration-200',
              isOpen ? 'rotate-180' : '',
              disabled ? 'text-gray-400' : 'text-gray-500'
            )}
          />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 flex max-h-60 w-full flex-col rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 p-2">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            </div>

            {availableValues.length > 0 && (
              <div className="border-b border-gray-100 p-1">
                <div
                  onClick={e => {
                    e.stopPropagation();
                    onToggleAll();
                  }}
                  className="group flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.length === availableValues.length}
                    onChange={() => {}}
                    className="cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {selectAllText}
                  </span>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-1">
              {filteredValues.map(value => (
                <div
                  key={value}
                  onClick={e => {
                    e.stopPropagation();
                    onToggleValue(value);
                  }}
                  className="group flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(value)}
                    onChange={() => {}}
                    className="cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="truncate text-sm text-gray-700 group-hover:text-gray-900">
                    {value}
                  </span>
                </div>
              ))}
              {filteredValues.length === 0 && availableValues.length > 0 && (
                <div className="p-2 text-center text-xs text-gray-500">No matches found</div>
              )}
              {availableValues.length === 0 && (
                <div className="p-2 text-center text-xs text-gray-500">{emptyMessage}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
