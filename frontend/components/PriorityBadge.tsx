import React from 'react';
import { clsx } from 'clsx';

interface PriorityBadgeProps {
  score: number | null;
  priority: number | null;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ score, priority }) => {
  if (priority === null) return <span className="text-gray-400">-</span>;

  const colorClass =
    priority >= 80 ? 'bg-red-100 text-red-800' :
    priority >= 50 ? 'bg-yellow-100 text-yellow-800' :
    'bg-green-100 text-green-800';

  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', colorClass)}>
      {priority} (Score: {score})
    </span>
  );
};
