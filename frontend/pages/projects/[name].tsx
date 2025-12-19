import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchTasks, Task } from '../../lib/api';
import { TasksTable } from '../../components/TasksTable';
import { StatsCards } from '../../components/StatsCards';
import { ProjectFilters, ProjectFiltersState } from '../../components/ProjectFilters';
import { Modal } from '../../components/Modal';
import { TaskDetail } from '../../components/TaskDetail';

export default function ProjectDetail() {
  const router = useRouter();
  const { name } = router.query;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<keyof Task | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ProjectFiltersState>({
    status: [],
    assignedTo: [],
    severity: ''
  });
  
  useEffect(() => {
    if (name) {
      loadProjectTasks(name as string);
    }
  }, [name]);

  const loadProjectTasks = async (projectName: string) => {
    try {
      const data = await fetchTasks({ project: projectName });
      setTasks(data);
      // Initialize assignedTo filter with all unique assignees (Select All by default)
      const uniqueAssignees = [...new Set(data.map((t: Task) => t.assignedTo || 'Unassigned'))];
      setFilters(prev => ({ ...prev, assignedTo: uniqueAssignees }));
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique assignees from tasks
  const availableAssignees = [...new Set(tasks.map(t => t.assignedTo || 'Unassigned'))];
  
  // Apply client-side filters
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }
    // Assigned To filter (multi-select)
    if (filters.assignedTo.length > 0 && filters.assignedTo.length < availableAssignees.length) {
      const taskAssignee = task.assignedTo || 'Unassigned';
      if (!filters.assignedTo.includes(taskAssignee)) {
        return false;
      }
    }
    // Severity filter
    if (filters.severity && task.severity !== filters.severity) {
      return false;
    }
    return true;
  });

  const total = filteredTasks.length;
  const completed = filteredTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  const critical = filteredTasks.filter(t => t.severity === 'critical').length;

  const toggleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const clearFilters = () => {
    setFilters({ status: [], assignedTo: availableAssignees, severity: '' });
    setSearch('');
  };

  const toggleAssigneeFilter = (assignee: string) => {
    setFilters(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(assignee)
        ? prev.assignedTo.filter(a => a !== assignee)
        : [...prev.assignedTo, assignee]
    }));
  };

  const toggleAllAssignees = () => {
    if (filters.assignedTo.length === availableAssignees.length) {
      setFilters(prev => ({ ...prev, assignedTo: [] }));
    } else {
      setFilters(prev => ({ ...prev, assignedTo: availableAssignees }));
    }
  };

  const hasActiveFilters = !!search || filters.status.length > 0 || (filters.assignedTo.length > 0 && filters.assignedTo.length < availableAssignees.length) || !!filters.severity;

  const handleSort = (field: keyof Task) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const sortedTasks = [...filteredTasks].sort((a: Task, b: Task) => {
    if (!sortField) return 0;
    const valA = a[sortField];
    const valB = b[sortField];
    
    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;
    
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Project: {name}</h2>
        </div>

        <StatsCards total={total} completed={completed} critical={critical} />

        <ProjectFilters
          filters={filters}
          search={search}
          onSearchChange={setSearch}
          availableAssignees={availableAssignees}
          onToggleStatus={toggleStatusFilter}
          onSeverityChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
          onToggleAssignee={toggleAssigneeFilter}
          onToggleAllAssignees={toggleAllAssignees}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks ({sortedTasks.length})</h2>
          {sortedTasks.length > 0 ? (
            <TasksTable 
              tasks={sortedTasks} 
              onSort={handleSort} 
              onReorder={() => {}} 
              onTaskClick={(id) => setSelectedTaskId(id)}
            />
          ) : (
            <p className="text-gray-500">{tasks.length > 0 ? 'No tasks match your filters.' : 'No tasks found for this project.'}</p>
          )}
        </div>

        <Modal isOpen={!!selectedTaskId} onClose={() => setSelectedTaskId(null)} title="Task Details">
          {selectedTaskId && (
            <TaskDetail 
              taskId={selectedTaskId} 
              onClose={() => setSelectedTaskId(null)} 
              onUpdate={() => { 
                if (name) loadProjectTasks(name as string); 
              }} 
            />
          )}
        </Modal>
    </div>
  );
}
