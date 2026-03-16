import React from 'react';
import { cn } from '@lib/utils';

type BadgeColor = 'gray' | 'red' | 'green' | 'yellow' | 'orange' | 'blue' | 'indigo';
type BadgeVariant = 'soft' | 'solid' | 'outline';
type BadgeSize = 'xs' | 'sm' | 'md';
type BadgeRounded = 'full' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: BadgeRounded;
  icon?: React.ReactNode;
  className?: string;
}

const colorClasses: Record<BadgeColor, Record<BadgeVariant, string>> = {
  gray: {
    soft: 'bg-gray-100 text-gray-800',
    solid: 'bg-gray-600 text-white',
    outline: 'border border-gray-300 text-gray-700 bg-white',
  },
  red: {
    soft: 'bg-red-100 text-red-800',
    solid: 'bg-red-600 text-white',
    outline: 'border border-red-300 text-red-700 bg-white',
  },
  green: {
    soft: 'bg-green-100 text-green-800',
    solid: 'bg-green-600 text-white',
    outline: 'border border-green-300 text-green-700 bg-white',
  },
  yellow: {
    soft: 'bg-yellow-100 text-yellow-800',
    solid: 'bg-yellow-600 text-white',
    outline: 'border border-yellow-300 text-yellow-700 bg-white',
  },
  orange: {
    soft: 'bg-orange-100 text-orange-800',
    solid: 'bg-orange-600 text-white',
    outline: 'border border-orange-300 text-orange-700 bg-white',
  },
  blue: {
    soft: 'bg-blue-100 text-blue-800',
    solid: 'bg-blue-600 text-white',
    outline: 'border border-blue-300 text-blue-700 bg-white',
  },
  indigo: {
    soft: 'bg-indigo-100 text-indigo-800',
    solid: 'bg-indigo-600 text-white',
    outline: 'border border-indigo-300 text-indigo-700 bg-white',
  },
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-xs',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

const roundedClasses: Record<BadgeRounded, string> = {
  full: 'rounded-full',
  md: 'rounded',
};

export function Badge({
  children,
  color = 'gray',
  variant = 'soft',
  size = 'sm',
  rounded = 'full',
  icon,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        colorClasses[color][variant],
        sizeClasses[size],
        roundedClasses[rounded],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
