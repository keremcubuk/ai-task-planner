import React from 'react';
import { Badge } from './ui';

interface PriorityBadgeProps {
  score: number | null;
  priority: number | null;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ score, priority }) => {
  if (priority === null) return <span className="text-gray-400">-</span>;

  const color = priority >= 80 ? 'red' : priority >= 50 ? 'yellow' : 'green';

  return (
    <Badge color={color} size="sm">
      {priority} (Score: {score})
    </Badge>
  );
};
