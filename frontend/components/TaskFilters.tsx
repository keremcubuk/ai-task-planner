import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { AssigneeSelect } from './AssigneeSelect';
import { StatusFilter } from './StatusFilter';
import { SeveritySelect } from './SeveritySelect';

interface TaskFiltersProps {
  filters: {
    status: string[];
    assignedTo: string[];
    severity: string;
    minAiScore: string;
    maxAiScore: string;
    aiScores: string;
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
  onToggleAssignee: (assignee: string) => void;
  onToggleAllAssignees: () => void;
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
  onToggleAssignee,
  onToggleAllAssignees,
  onClearFilters
}) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

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

                {/* Assigned To */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Assigned To</label>
                    <AssigneeSelect
                        selectedAssignees={filters.assignedTo}
                        availableAssignees={availableAssignees}
                        onToggleAssignee={onToggleAssignee}
                        onToggleAll={onToggleAllAssignees}
                    />
                </div>

                {/* Project Filter */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Project</label>
                    <div className="relative">
                        <button 
                            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                            className="w-full text-left text-sm border border-gray-300 rounded-md px-3 py-2 flex justify-between items-center bg-white h-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <span className="truncate text-gray-900 block">
                                {filters.project.length > 0 
                                    ? `${filters.project.length} Selected` 
                                    : 'Select Projects'}
                            </span>
                            <ChevronDown size={16} className="text-gray-500" />
                        </button>

                        {isProjectDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 flex flex-col">
                                <div className="p-2 border-b border-gray-100">
                                    <input 
                                        type="text" 
                                        placeholder="Search projects..." 
                                        value={projectSearch}
                                        onChange={(e) => setProjectSearch(e.target.value)}
                                        className="w-full text-sm border-gray-300 rounded px-2 py-1 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="overflow-y-auto p-1 flex-1">
                                    {availableProjects
                                        .filter(p => p.toLowerCase().includes(projectSearch.toLowerCase()))
                                        .map(project => (
                                        <div 
                                            key={project} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleProject(project);
                                            }}
                                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded group"
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={filters.project.includes(project)}
                                                onChange={() => {}} 
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className="text-sm text-gray-700 truncate group-hover:text-gray-900">{project}</span>
                                        </div>
                                    ))}
                                    {availableProjects.length === 0 && (
                                        <div className="p-2 text-xs text-gray-500 text-center">No projects found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Score Filter */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">AI Scores</label>
                    <input 
                        type="text" 
                        placeholder="e.g. 10, 15, 20 (comma separated)" 
                        value={filters.aiScores}
                        onChange={(e) => onFilterChange('aiScores', e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white h-10 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    />
                </div>

                {/* Due Date Range */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Due Date Range</label>
                    <div className="flex gap-2 items-center">
                        <input 
                            type="date" 
                            value={filters.dueStartDate}
                            onChange={(e) => onFilterChange('dueStartDate', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white h-10 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                        />
                        <span className="text-gray-400 flex-shrink-0">-</span>
                        <input 
                            type="date" 
                            value={filters.dueEndDate}
                            onChange={(e) => onFilterChange('dueEndDate', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white h-10 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                        />
                    </div>
                </div>
            </div>
        )}
        
        {showFilters && (
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
