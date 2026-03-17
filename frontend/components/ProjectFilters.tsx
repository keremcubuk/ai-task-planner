import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { StatusFilter } from './StatusFilter';
import { SeveritySelect } from './SeveritySelect';
import { InputSelectMulti, Button } from './ui';

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
  hasActiveFilters,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
      <div className="flex items-center gap-4">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="flex-1 border-none bg-white text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-10 items-center gap-2 rounded border px-4 ${showFilters ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          <Filter size={16} /> Filters{' '}
          {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-3">
          <StatusFilter selectedStatuses={filters.status} onToggle={onToggleStatus} />
          <SeveritySelect value={filters.severity} onChange={onSeverityChange} />
          <InputSelectMulti
            label="Assigned To"
            selectedValues={filters.assignedTo}
            availableValues={availableAssignees}
            onToggleValue={onToggleAssignee}
            onToggleAll={onToggleAllAssignees}
            searchPlaceholder="Search assignees..."
            selectedCountText="assignees"
          />
        </div>
      )}

      {showFilters && hasActiveFilters && (
        <div className="mt-4 flex justify-end border-t border-gray-100 pt-2">
          <Button variant="danger" size="sm" onClick={onClearFilters} leftIcon={<X size={14} />}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};
