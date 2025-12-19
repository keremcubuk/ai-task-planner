import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { StatusFilter } from './StatusFilter';
import { SeveritySelect } from './SeveritySelect';
import { AssigneeSelect } from './AssigneeSelect';

export interface ProjectFiltersState {
  status: string[];
  assignedTo: string[];
  severity: string;
}

interface ProjectFiltersProps {
  filters: ProjectFiltersState;
  search: string;
  onSearchChange: (value: string) => void;
  availableAssignees: string[];
  onToggleStatus: (status: string) => void;
  onSeverityChange: (severity: string) => void;
  onToggleAssignee: (assignee: string) => void;
  onToggleAllAssignees: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  filters,
  search,
  onSearchChange,
  availableAssignees,
  onToggleStatus,
  onSeverityChange,
  onToggleAssignee,
  onToggleAllAssignees,
  onClearFilters,
  hasActiveFilters
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-center gap-4">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search tasks..." 
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 border-none focus:ring-0 text-gray-700 outline-none"
        />
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className={`flex items-center gap-2 px-4 h-10 rounded border ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          <Filter size={16} /> Filters {hasActiveFilters && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
        </button>
      </div>

      {showFilters && (
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <StatusFilter 
            selectedStatuses={filters.status} 
            onToggle={onToggleStatus} 
          />
          <SeveritySelect 
            value={filters.severity} 
            onChange={onSeverityChange} 
          />
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">Assigned To</label>
            <AssigneeSelect
              selectedAssignees={filters.assignedTo}
              availableAssignees={availableAssignees}
              onToggleAssignee={onToggleAssignee}
              onToggleAll={onToggleAllAssignees}
            />
          </div>
        </div>
      )}

      {showFilters && hasActiveFilters && (
        <div className="flex justify-end mt-4 pt-2 border-t border-gray-100">
          <button 
            onClick={onClearFilters}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <X size={14} /> Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
