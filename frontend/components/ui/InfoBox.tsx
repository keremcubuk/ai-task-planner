import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@lib/utils';

interface InfoBoxProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  variant?: 'info' | 'warning' | 'success' | 'error';
  titleSlot?: React.ReactNode;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  title,
  children,
  icon,
  defaultExpanded = false,
  className,
  titleClassName,
  contentClassName,
  variant = 'info',
  titleSlot
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const variantStyles = {
    info: {
      container: 'bg-blue-50 border-blue-200',
      title: 'text-blue-900',
      icon: 'text-blue-600',
      content: 'text-blue-900'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      title: 'text-yellow-900',
      icon: 'text-yellow-600',
      content: 'text-yellow-900'
    },
    success: {
      container: 'bg-green-50 border-green-200',
      title: 'text-green-900',
      icon: 'text-green-600',
      content: 'text-green-900'
    },
    error: {
      container: 'bg-red-50 border-red-200',
      title: 'text-red-900',
      icon: 'text-red-600',
      content: 'text-red-900'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn(
      "border rounded-lg p-4",
      styles.container,
      className
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 w-full text-left font-medium",
          styles.title,
          titleClassName
        )}
      >
        {icon && <span className={styles.icon}>{icon}</span>}
        {titleSlot || <span>{title}</span>}
        <span className="ml-auto">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      
      {isExpanded && (
        <div className={cn(
          "mt-4 space-y-3 text-sm",
          styles.content,
          contentClassName
        )}>
          {children}
        </div>
      )}
    </div>
  );
};
