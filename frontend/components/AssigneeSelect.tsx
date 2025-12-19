import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AssigneeSelectProps {
  selectedAssignees: string[];
  availableAssignees: string[];
  onToggleAssignee: (assignee: string) => void;
  onToggleAll: () => void;
}

export const AssigneeSelect: React.FC<AssigneeSelectProps> = ({
  selectedAssignees,
  availableAssignees,
  onToggleAssignee,
  onToggleAll
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const getDisplayText = () => {
    if (selectedAssignees.length === availableAssignees.length) {
      return 'All Selected';
    }
    if (selectedAssignees.length === 0) {
      return 'None Selected';
    }
    return `${selectedAssignees.length} Selected`;
  };

  const filteredAssignees = availableAssignees.filter(a => 
    a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-sm border border-gray-300 rounded-md px-3 py-2 flex justify-between items-center bg-white h-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <span className="truncate text-gray-900 block">
          {getDisplayText()}
        </span>
        <ChevronDown size={16} className="text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <input 
              type="text" 
              placeholder="Search assignees..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm border-gray-300 rounded px-2 py-1 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="p-1 border-b border-gray-100">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onToggleAll();
              }}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded group"
            >
              <input 
                type="checkbox" 
                checked={selectedAssignees.length === availableAssignees.length}
                onChange={() => {}} 
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Select All</span>
            </div>
          </div>
          <div className="overflow-y-auto p-1 flex-1">
            {filteredAssignees.map(assignee => (
              <div 
                key={assignee} 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAssignee(assignee);
                }}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded group"
              >
                <input 
                  type="checkbox" 
                  checked={selectedAssignees.includes(assignee)}
                  onChange={() => {}} 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 truncate group-hover:text-gray-900">{assignee}</span>
              </div>
            ))}
            {availableAssignees.length === 0 && (
              <div className="p-2 text-xs text-gray-500 text-center">No assignees found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
