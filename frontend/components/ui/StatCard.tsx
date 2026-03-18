import React from 'react';
import { cn } from '@lib/utils';

type ValueColor = 'default' | 'blue' | 'green' | 'red' | 'yellow' | 'indigo';
type BgColor = 'white' | 'green' | 'yellow' | 'red' | 'blue';
type Size = 'sm' | 'md' | 'lg';

interface StatCardProps {
  label: string;
  value: number | string;
  valueColor?: ValueColor;
  bgColor?: BgColor;
  size?: Size;
  suffix?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  change?: {
    value: number;
    indicator: React.ReactNode;
  };
  className?: string;
  tooltip?: React.ReactNode;
}

const valueColorClasses: Record<ValueColor, string> = {
  default: 'text-gray-900',
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600',
  indigo: 'text-indigo-600',
};

const bgColorClasses: Record<BgColor, { bg: string; label: string }> = {
  white: { bg: 'bg-white', label: 'text-gray-500' },
  green: { bg: 'bg-green-50', label: 'text-green-600' },
  yellow: { bg: 'bg-yellow-50', label: 'text-yellow-600' },
  red: { bg: 'bg-red-50', label: 'text-red-600' },
  blue: { bg: 'bg-blue-50', label: 'text-blue-600' },
};

const sizeClasses: Record<
  Size,
  { container: string; label: string; value: string; minWidth: string }
> = {
  sm: { container: 'p-3', label: 'text-xs', value: 'text-2xl', minWidth: 'min-w-[80px]' },
  md: { container: 'p-4', label: 'text-xs', value: 'text-2xl', minWidth: 'min-w-[100px]' },
  lg: { container: 'p-5', label: 'text-xs', value: 'text-3xl', minWidth: 'min-w-[120px]' },
};

export function StatCard({
  label,
  value,
  valueColor = 'default',
  bgColor = 'white',
  size = 'lg',
  suffix,
  subtitle,
  icon,
  change,
  className,
  tooltip,
}: StatCardProps) {
  const bgStyles = bgColorClasses[bgColor];
  const sizeStyles = sizeClasses[size];

  const cardContent = (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg shadow',
        bgStyles.bg,
        sizeStyles.container,
        sizeStyles.minWidth,
        className
      )}
    >
      <span className={cn('font-medium uppercase', sizeStyles.label, bgStyles.label)}>{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <span className={cn('font-bold', sizeStyles.value, valueColorClasses[valueColor])}>
          {value}
        </span>
        {suffix && <span className="text-base font-normal text-gray-500">{suffix}</span>}
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {change && (
          <div className="flex items-center gap-1">
            {change.indicator}
            <span className="text-sm font-medium">{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>
      {subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}
    </div>
  );

  if (tooltip) {
    return (
      <div className="group relative">
        {cardContent}
        <div className="invisible absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform rounded-lg bg-gray-900 px-3 py-2 text-sm whitespace-nowrap text-white opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full transform">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
          {tooltip}
        </div>
      </div>
    );
  }

  return cardContent;
}

interface StatCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatCardGrid({ children, columns = 4, className }: StatCardGridProps) {
  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return <div className={cn('grid gap-4', colClasses[columns], className)}>{children}</div>;
}

interface StatCardRowProps {
  children: React.ReactNode;
  className?: string;
}

export function StatCardRow({ children, className }: StatCardRowProps) {
  return <div className={cn('flex flex-wrap justify-end gap-3', className)}>{children}</div>;
}
