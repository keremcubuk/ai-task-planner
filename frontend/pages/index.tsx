import { useEffect, useState, useCallback } from "react";
import {
  fetchTasks,
  prioritizeTasks,
  exportXlsx,
  reorderTasks,
  resetDb,
  getProjectsStats,
  Task,
} from "../lib/api";
import { TasksTable } from "../components/TasksTable";
import { TaskFilters } from "../components/TaskFilters";
import { AiPriorityInfo } from "../components/AiPriorityInfo";
import Link from "next/link";
import { RefreshCw, Download, Upload, Trash2, Info } from "lucide-react";
import { Modal } from "../components/Modal";
import { TaskForm } from "../components/TaskForm";
import { TaskDetail } from "../components/TaskDetail";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [availableAssignees, setAvailableAssignees] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sortField, setSortField] = useState<keyof Task | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    getProjectsStats().then((stats: { name: string }[]) => {
      setAvailableProjects(stats.map(s => s.name).filter(n => n !== 'No Project'));
    });
  }, []);

  const [filters, setFilters] = useState({
    status: [] as string[],
    assignedTo: [] as string[],
    severity: '',
    minAiScore: '',
    maxAiScore: '',
    aiScores: '',
    dueStartDate: '',
    dueEndDate: '',
    project: [] as string[]
  });

  useEffect(() => {
    const loadAssignees = async () => {
      const allData = await fetchTasks({});
      const uniqueAssignees = [
        ...new Set(allData.map((t: Task) => t.assignedTo || "Unassigned")),
      ];
      setAvailableAssignees(uniqueAssignees);

      if (!isInitialized) {
        setFilters((prev) => ({ ...prev, assignedTo: uniqueAssignees }));
        setIsInitialized(true);
      }
    };
    loadAssignees();
  }, []); // Load assignees only once on mount

  useEffect(() => {
    const timer = setTimeout(() => {
      const loadTasksOnly = async () => {
        setLoading(true);
        try {
          const shouldFilterAssignee =
            filters.assignedTo.length > 0 &&
            filters.assignedTo.length < availableAssignees.length;

          const data = await fetchTasks({
            search,
            status:
              filters.status.length > 0 ? filters.status.join(",") : undefined,
            assignedTo: shouldFilterAssignee
              ? filters.assignedTo.join(",")
              : undefined,
            severity: filters.severity || undefined,
            minAiScore: filters.minAiScore
              ? Number(filters.minAiScore)
              : undefined,
            maxAiScore: filters.maxAiScore
              ? Number(filters.maxAiScore)
              : undefined,
            aiScores: filters.aiScores || undefined,
            dueStartDate: filters.dueStartDate || undefined,
            dueEndDate: filters.dueEndDate || undefined,
            project:
              filters.project.length > 0
                ? filters.project.join(",")
                : undefined,
          });
          setTasks(data);
        } catch (error) {
          console.error("Failed to load tasks", error);
        } finally {
          setLoading(false);
        }
      };
      loadTasksOnly();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, filters, availableAssignees]); // Reload tasks when search, filters, or availableAssignees change

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const shouldFilterAssignee =
        filters.assignedTo.length > 0 &&
        filters.assignedTo.length < availableAssignees.length;

      const data = await fetchTasks({
        search,
        status: filters.status.length > 0 ? filters.status.join(',') : undefined,
        assignedTo: shouldFilterAssignee
          ? filters.assignedTo.join(',')
          : undefined,
        severity: filters.severity || undefined,
        minAiScore: filters.minAiScore ? Number(filters.minAiScore) : undefined,
        maxAiScore: filters.maxAiScore ? Number(filters.maxAiScore) : undefined,
        aiScores: filters.aiScores || undefined,
        dueStartDate: filters.dueStartDate || undefined,
        dueEndDate: filters.dueEndDate || undefined,
        project: filters.project.length > 0 ? filters.project.join(',') : undefined
      });
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  }, [search, filters, availableAssignees]);

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleStatusFilter = (status: string) => {
    setFilters((prev) => {
      const current = prev.status;
      const updated = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status];
      return { ...prev, status: updated };
    });
  };

  const toggleProjectFilter = (project: string) => {
    setFilters((prev) => {
      const current = prev.project;
      const updated = current.includes(project)
        ? current.filter((p) => p !== project)
        : [...current, project];
      return { ...prev, project: updated };
    });
  };

  const toggleAssigneeFilter = (assignee: string) => {
    setFilters((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(assignee)
        ? prev.assignedTo.filter((a) => a !== assignee)
        : [...prev.assignedTo, assignee],
    }));
  };

  const toggleAllAssignees = () => {
    if (filters.assignedTo.length === availableAssignees.length) {
      setFilters((prev) => ({ ...prev, assignedTo: [] }));
    } else {
      setFilters((prev) => ({ ...prev, assignedTo: availableAssignees }));
    }
  };

  const clearFilters = () => {
    setFilters({
        status: [],
        assignedTo: availableAssignees,
        severity: '',
        minAiScore: '',
        maxAiScore: '',
        aiScores: '',
        dueStartDate: '',
        dueEndDate: '',
        project: []
    });
    setSearch('');
  };

  const handlePrioritize = async () => {
    setLoading(true);
    try {
      await prioritizeTasks();
      await loadTasks();
    } catch (error) {
      console.error("Prioritization failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: "raw" | "stats") => {
    try {
      const response = await exportXlsx(type);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `tasks_${type}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  const handleSort = (field: keyof Task) => {
    const newDirection =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);

    const sorted = [...tasks].sort((a: Task, b: Task) => {
      const valA = a[field];
      const valB = b[field];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (valA < valB) return newDirection === "asc" ? -1 : 1;
      if (valA > valB) return newDirection === "asc" ? 1 : -1;
      return 0;
    });
    setTasks(sorted);
  };

  const handleReorder = async (newTasks: Task[]) => {
    setTasks(newTasks);
    try {
      await reorderTasks(newTasks.map((t) => t.id));
    } catch (error) {
      console.error("Reorder failed", error);
      loadTasks();
    }
  };

  const handleReset = async () => {
    const password = prompt("Enter password to reset database:");
    if (!password) return;

    try {
      await resetDb(password);
      alert("Database reset successful");
      loadTasks();
    } catch (error) {
      alert("Failed to reset database. Check password.");
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
        <div className="flex gap-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            title="Reset Database"
          >
            <Trash2 size={18} />
          </button>
          <Link
            href="/import"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Upload size={18} /> Import
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <Upload size={18} className="rotate-90" /> New Task
          </button>
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Download size={18} /> Export
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-100">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleExport("raw");
                      setIsExportOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Raw Data
                  </button>
                  <button
                    onClick={() => {
                      handleExport("stats");
                      setIsExportOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Statistics
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrioritize}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <RefreshCw size={18} /> AI Prioritize
            </button>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="flex items-center justify-center w-10 h-10 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300"
              title="How it works?"
            >
              <Info size={20} />
            </button>
          </div>
        </div>
      </div>

      <TaskFilters
        filters={filters}
        search={search}
        setSearch={setSearch}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        availableProjects={availableProjects}
        availableAssignees={availableAssignees}
        onFilterChange={handleFilterChange}
        onToggleStatus={toggleStatusFilter}
        onToggleProject={toggleProjectFilter}
        onToggleAssignee={toggleAssigneeFilter}
        onToggleAllAssignees={toggleAllAssignees}
        onClearFilters={clearFilters}
      />

      <div className="bg-white rounded-lg shadow p-2">
        {loading ? (
          <div className="text-center py-10">Loading tasks...</div>
        ) : (
          <TasksTable
            tasks={tasks}
            onSort={handleSort}
            onReorder={handleReorder}
            onTaskClick={(id) => setSelectedTaskId(id)}
          />
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
      >
        <TaskForm
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            loadTasks();
          }}
        />
      </Modal>

      <Modal
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        title="Task Details"
      >
        {selectedTaskId && (
          <TaskDetail
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
            onUpdate={() => {
              loadTasks();
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="How AI Prioritization Works"
      >
        <AiPriorityInfo />
      </Modal>
    </>
  );
}
