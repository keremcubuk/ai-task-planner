import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="flex items-center gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {description && <div className="mt-1 text-sm text-gray-500">{description}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}
