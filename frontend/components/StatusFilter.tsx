import React from 'react';
import { Chip } from './ui';

interface StatusFilterProps {
  selectedStatuses: string[];
  onToggle: (status: string) => void;
}

const STATUSES = ['open', 'in_progress', 'done'];

export const StatusFilter: React.FC<StatusFilterProps> = ({ selectedStatuses, onToggle }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Status</label>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(status => (
          <Chip
            key={status}
            label={status.replace('_', ' ')}
            selected={selectedStatuses.includes(status)}
            onClick={() => onToggle(status)}
            size="md"
            variant="default"
          />
        ))}
      </div>
    </div>
  );
};
