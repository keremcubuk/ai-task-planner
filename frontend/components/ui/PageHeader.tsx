import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div className="flex items-center gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {description && (
            <div className="text-sm text-gray-500 mt-1">{description}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
