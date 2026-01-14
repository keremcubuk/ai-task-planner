import React from 'react';

interface StatusFilterProps {
  selectedStatuses: string[];
  onToggle: (status: string) => void;
}

const STATUSES = ['open', 'in_progress', 'done'];

export const StatusFilter: React.FC<StatusFilterProps> = ({ selectedStatuses, onToggle }) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(status => (
          <button
            key={status}
            onClick={() => onToggle(status)}
            className={`px-3 py-1 text-sm rounded-full border ${
              selectedStatuses.includes(status) 
                ? 'bg-blue-100 border-blue-300 text-blue-800' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
};
