import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { InputSelectMulti, InputDate, Button } from './ui';
import { StatusFilter } from './StatusFilter';
import { SeveritySelect } from './SeveritySelect';
import { AiScoreSelect } from './AiScoreSelect';

interface TaskFiltersProps {
  filters: {
    status: string[];
    assignedTo: string[];
    severity: string;
    minAiScore: string;
    maxAiScore: string;
    aiScores: string[];
    dueStartDate: string;
    dueEndDate: string;
    project: string[];
  };
  search: string;
  setSearch: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  availableProjects: string[];
  availableAssignees: string[];
  onFilterChange: (key: string, value: string | string[]) => void;
  onToggleStatus: (status: string) => void;
  onToggleProject: (project: string) => void;
  onToggleAllProjects: () => void;
  onToggleAssignee: (assignee: string) => void;
  onToggleAllAssignees: () => void;
  onToggleAiScore: (score: string) => void;
  onSelectAllAiScores: (values: string[]) => void;
  onClearFilters: () => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  search,
  setSearch,
  showFilters,
  setShowFilters,
  availableProjects,
  availableAssignees,
  onFilterChange,
  onToggleStatus,
  onToggleProject,
  onToggleAllProjects,
  onToggleAssignee,
  onToggleAllAssignees,
  onToggleAiScore,
  onSelectAllAiScores,
  onClearFilters,
}) => {
  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow">
      <div className="flex items-center gap-4">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border-none bg-white text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-10 items-center gap-2 rounded border px-4 ${showFilters ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          <Filter size={16} /> Filters{' '}
          {(Object.values(filters).some(x => (Array.isArray(x) ? x.length > 0 : !!x)) ||
            search) && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-3">
          <StatusFilter selectedStatuses={filters.status} onToggle={onToggleStatus} />

          <SeveritySelect
            value={filters.severity}
            onChange={value => onFilterChange('severity', value)}
          />

          {/* Assigned To Filter */}
          <InputSelectMulti
            label="Assigned To"
            selectedValues={filters.assignedTo}
            availableValues={availableAssignees}
            onToggleValue={onToggleAssignee}
            onToggleAll={onToggleAllAssignees}
            searchPlaceholder="Search assignees..."
            selectedCountText="assignees"
          />

          {/* Project Filter */}
          <InputSelectMulti
            label="Project"
            selectedValues={filters.project}
            availableValues={availableProjects}
            onToggleValue={onToggleProject}
            onToggleAll={onToggleAllProjects}
            searchPlaceholder="Search projects..."
            selectedCountText="projects"
          />

          {/* AI Score Filter */}
          <AiScoreSelect
            selectedValues={filters.aiScores}
            onToggleValue={onToggleAiScore}
            onSelectAll={onSelectAllAiScores}
          />

          {/* Due Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Due Date Range</label>
            <div className="flex items-center gap-2">
              <InputDate
                value={filters.dueStartDate}
                onChange={value => onFilterChange('dueStartDate', value)}
              />
              <span className="flex-shrink-0 text-gray-400">-</span>
              <InputDate
                value={filters.dueEndDate}
                onChange={value => onFilterChange('dueEndDate', value)}
              />
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="mt-4 flex justify-end border-t border-gray-100 pt-2">
          <Button variant="danger" size="sm" onClick={onClearFilters} leftIcon={<X size={14} />}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};
