import React from 'react';
import { cn } from '@lib/utils';

export type ProgressBarColor = 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple';

export type ProgressBarSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: ProgressBarColor;
  size?: ProgressBarSize;
  showLabel?: boolean;
  labelPosition?: 'left' | 'right' | 'none';
  labelClassName?: string;
  barClassName?: string;
  containerClassName?: string;
  width?: string;
  label?: React.ReactNode;
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-2.5',
};

const colorStyles = {
  gray: 'bg-gray-600',
  red: 'bg-red-600',
  yellow: 'bg-yellow-500',
  green: 'bg-green-600',
  blue: 'bg-blue-600',
  indigo: 'bg-indigo-600',
  purple: 'bg-purple-600',
};

const labelColorStyles = {
  gray: 'text-gray-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600',
  green: 'text-green-600',
  blue: 'text-blue-600',
  indigo: 'text-indigo-600',
  purple: 'text-purple-600',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'blue',
  size = 'md',
  showLabel = false,
  labelPosition = 'right',
  labelClassName,
  barClassName,
  containerClassName,
  width,
  label,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const renderLabel = () => {
    if (!showLabel && !label) return null;

    const content = label || `${Math.round(percentage)}%`;

    return (
      <span className={cn('text-sm font-medium', labelColorStyles[color], labelClassName)}>
        {content}
      </span>
    );
  };

  return (
    <div className={cn('flex items-center gap-2', containerClassName)}>
      {labelPosition === 'left' && renderLabel()}

      <div
        className={cn(
          'rounded-full bg-gray-200',
          sizeStyles[size],
          width || 'flex-1',
          barClassName
        )}
      >
        <div
          className={cn('rounded-full transition-all', sizeStyles[size], colorStyles[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {labelPosition === 'right' && renderLabel()}
    </div>
  );
};
