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
  onClearFilters
}) => {

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
        <div className="flex items-center gap-4">
            <Search className="text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border-none focus:ring-0 outline-none bg-white text-gray-900 placeholder:text-gray-400"
            />
            <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`flex items-center gap-2 px-4 h-10 rounded border ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
                <Filter size={16} /> Filters {(Object.values(filters).some(x => Array.isArray(x) ? x.length > 0 : !!x) || search) && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
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
                    onChange={(value) => onFilterChange('severity', value)} 
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
                    <div className="flex gap-2 items-center">
                        <InputDate
                            value={filters.dueStartDate}
                            onChange={(value) => onFilterChange('dueStartDate', value)}
                        />
                        <span className="text-gray-400 flex-shrink-0">-</span>
                        <InputDate
                            value={filters.dueEndDate}
                            onChange={(value) => onFilterChange('dueEndDate', value)}
                        />
                    </div>
                </div>
            </div>
        )}
        
        {showFilters && (
            <div className="flex justify-end mt-4 pt-2 border-t border-gray-100">
                <Button 
                    variant="danger"
                    size="sm"
                    onClick={onClearFilters}
                    leftIcon={<X size={14} />}
                >
                    Clear Filters
                </Button>
            </div>
        )}
    </div>
  );
};
