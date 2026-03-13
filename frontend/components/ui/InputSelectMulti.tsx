import React, { useState } from 'react';
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
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  emptyMessage = "No options found",
  selectAllText = "Select All",
  noneSelectedText = "None Selected",
  allSelectedText = "All Selected",
  selectedCountText = "Selected",
  labelClassName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

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
    <div className={cn(label ? "space-y-2" : "relative", className)}>
      {label && (
        <label className={cn("text-xs font-semibold text-gray-500 uppercase", labelClassName)}>
          {label}
        </label>
      )}
      <div className="relative">
        <button 
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            "w-full text-left text-sm border rounded-md px-3 py-2 flex justify-between items-center h-10 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors",
            disabled 
              ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed" 
              : "bg-white border-gray-300 text-gray-900 hover:border-gray-400 cursor-pointer"
          )}
        >
          <span className="truncate block">
            {getDisplayText()}
          </span>
          <ChevronDown 
            size={16} 
            className={cn(
              "transition-transform duration-200",
              isOpen ? "rotate-180" : "",
              disabled ? "text-gray-400" : "text-gray-500"
            )} 
          />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 flex flex-col">
            <div className="p-2 border-b border-gray-100">
              <input 
                type="text" 
                placeholder={searchPlaceholder} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm border-gray-300 rounded px-2 py-1 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {availableValues.length > 0 && (
              <div className="p-1 border-b border-gray-100">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAll();
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded group"
                >
                  <input 
                    type="checkbox" 
                    checked={selectedValues.length === availableValues.length}
                    onChange={() => {}} 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{selectAllText}</span>
                </div>
              </div>
            )}
            
            <div className="overflow-y-auto p-1 flex-1">
              {filteredValues.map(value => (
                <div 
                  key={value} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleValue(value);
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded group"
                >
                  <input 
                    type="checkbox" 
                    checked={selectedValues.includes(value)}
                    onChange={() => {}} 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 truncate group-hover:text-gray-900">{value}</span>
                </div>
              ))}
              {filteredValues.length === 0 && availableValues.length > 0 && (
                <div className="p-2 text-xs text-gray-500 text-center">No matches found</div>
              )}
              {availableValues.length === 0 && (
                <div className="p-2 text-xs text-gray-500 text-center">{emptyMessage}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
