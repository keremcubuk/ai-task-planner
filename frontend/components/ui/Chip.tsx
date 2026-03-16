import React from 'react';
import { cn } from '@lib/utils';
import { X } from 'lucide-react';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'removable';
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  onRemove,
  disabled = false,
  className,
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const baseClasses = cn(
    'inline-flex items-center gap-1 rounded-full border font-medium transition-colors',
    sizeClasses[size],
    disabled
      ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
      : selected
        ? 'bg-blue-100 border-blue-300 text-blue-800 cursor-pointer hover:bg-blue-200'
        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer',
    className
  );

  if (variant === 'removable' && onRemove) {
    return (
      <div className={baseClasses}>
        <span>{label}</span>
        {!disabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
    >
      {label}
    </button>
  );
};
