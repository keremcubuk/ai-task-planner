'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  fetchTasks,
  prioritizeTasks,
  exportXlsx,
  reorderTasks,
  resetDb,
  getProjectsStats,
  pushToConfluence,
  extractConfluenceCookies,
  Task,
} from '@lib/api';
import { exportTaskListToPdf } from '@lib/pdfExport';
import { TasksTable } from '@components/TasksTable';
import { TaskFilters } from '@components/TaskFilters';
import { AiPriorityInfo } from '@components/AiPriorityInfo';
import Link from 'next/link';
import { RefreshCw, Download, Upload, Trash2, Info, Globe } from 'lucide-react';
import { TaskForm } from '@components/TaskForm';
import { TaskDetail } from '@components/TaskDetail';
import { Button, Modal, PageHeader } from '@components/ui';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isConfluencePushOpen, setIsConfluencePushOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [confluenceUrl, setConfluenceUrl] = useState('');
  const [confluenceCookies, setConfluenceCookies] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [isExtractingCookies, setIsExtractingCookies] = useState(false);
  const [pushMessage, setPushMessage] = useState('');
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
    status: [] as string[], // Varsayılan olarak done/completed hariç tut
    assignedTo: [] as string[],
    severity: '',
    minAiScore: '',
    maxAiScore: '',
    aiScores: [] as string[],
    dueStartDate: '',
    dueEndDate: '',
    project: [] as string[],
  });

  useEffect(() => {
    const loadAssignees = async () => {
      const allData = await fetchTasks({});
      const uniqueAssignees = [...new Set(allData.map((t: Task) => t.assignedTo || 'Unassigned'))];
      setAvailableAssignees(uniqueAssignees);

      if (!isInitialized) {
        setFilters(prev => ({ ...prev, assignedTo: uniqueAssignees }));
        setIsInitialized(true);
      }
    };
    loadAssignees();
  }, [isInitialized]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const loadTasksOnly = async () => {
        setLoading(true);
        try {
          const shouldFilterAssignee =
            filters.assignedTo.length > 0 && filters.assignedTo.length < availableAssignees.length;

          const data = await fetchTasks({
            search,
            status: filters.status.length > 0 ? filters.status.join(',') : undefined,
            assignedTo: shouldFilterAssignee ? filters.assignedTo.join(',') : undefined,
            severity: filters.severity || undefined,
            minAiScore: filters.minAiScore ? Number(filters.minAiScore) : undefined,
            maxAiScore: filters.maxAiScore ? Number(filters.maxAiScore) : undefined,
            aiScores: filters.aiScores.length > 0 ? filters.aiScores.join(',') : undefined,
            dueStartDate: filters.dueStartDate || undefined,
            dueEndDate: filters.dueEndDate || undefined,
            project: filters.project.length > 0 ? filters.project.join(',') : undefined,
          });
          setTasks(data);
        } catch (error) {
          console.error('Failed to load tasks', error);
        } finally {
          setLoading(false);
        }
      };
      loadTasksOnly();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, filters, availableAssignees]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const shouldFilterAssignee =
        filters.assignedTo.length > 0 && filters.assignedTo.length < availableAssignees.length;

      const data = await fetchTasks({
        search,
        status: filters.status.length > 0 ? filters.status.join(',') : undefined,
        assignedTo: shouldFilterAssignee ? filters.assignedTo.join(',') : undefined,
        severity: filters.severity || undefined,
        minAiScore: filters.minAiScore ? Number(filters.minAiScore) : undefined,
        maxAiScore: filters.maxAiScore ? Number(filters.maxAiScore) : undefined,
        aiScores: filters.aiScores.length > 0 ? filters.aiScores.join(',') : undefined,
        dueStartDate: filters.dueStartDate || undefined,
        dueEndDate: filters.dueEndDate || undefined,
        project: filters.project.length > 0 ? filters.project.join(',') : undefined,
      });
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  }, [search, filters, availableAssignees]);

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleStatusFilter = (status: string) => {
    setFilters(prev => {
      const current = prev.status;
      const updated = current.includes(status)
        ? current.filter(s => s !== status)
        : [...current, status];
      return { ...prev, status: updated };
    });
  };

  const toggleProjectFilter = (project: string) => {
    setFilters(prev => {
      const current = prev.project;
      const updated = current.includes(project)
        ? current.filter(p => p !== project)
        : [...current, project];
      return { ...prev, project: updated };
    });
  };

  const toggleAllProjects = () => {
    if (filters.project.length === availableProjects.length) {
      setFilters(prev => ({ ...prev, project: [] }));
    } else {
      setFilters(prev => ({ ...prev, project: availableProjects }));
    }
  };

  const toggleAssigneeFilter = (assignee: string) => {
    setFilters(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(assignee)
        ? prev.assignedTo.filter(a => a !== assignee)
        : [...prev.assignedTo, assignee],
    }));
  };

  const toggleAllAssignees = () => {
    if (filters.assignedTo.length === availableAssignees.length) {
      setFilters(prev => ({ ...prev, assignedTo: [] }));
    } else {
      setFilters(prev => ({ ...prev, assignedTo: availableAssignees }));
    }
  };

  const toggleAiScoreFilter = (score: string) => {
    setFilters(prev => {
      const current = prev.aiScores;
      const updated = current.includes(score)
        ? current.filter(s => s !== score)
        : [...current, score];
      return { ...prev, aiScores: updated };
    });
  };

  const selectAllAiScores = (values: string[]) => {
    setFilters(prev => ({ ...prev, aiScores: values }));
  };

  const clearFilters = () => {
    setFilters({
      status: [], // Varsayılan olarak done/completed hariç tut (backend'de filtreleniyor)
      assignedTo: availableAssignees,
      severity: '',
      minAiScore: '',
      maxAiScore: '',
      aiScores: [],
      dueStartDate: '',
      dueEndDate: '',
      project: [],
    });
    setSearch('');
  };

  const handlePrioritize = async () => {
    setLoading(true);
    try {
      await prioritizeTasks();
      await loadTasks();
    } catch (error) {
      console.error('Prioritization failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'raw' | 'stats') => {
    try {
      const response = await exportXlsx(type);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks_${type}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  const handleSort = (field: keyof Task) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);

    const sorted = [...tasks].sort((a: Task, b: Task) => {
      const valA = a[field];
      const valB = b[field];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (valA < valB) return newDirection === 'asc' ? -1 : 1;
      if (valA > valB) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setTasks(sorted);
  };

  const handleReorder = async (newTasks: Task[]) => {
    setTasks(newTasks);
    try {
      await reorderTasks(newTasks.map(t => t.id));
    } catch (error) {
      console.error('Reorder failed', error);
      loadTasks();
    }
  };

  const handleReset = async () => {
    const password = prompt('Enter password to reset database:');
    if (!password) return;

    try {
      await resetDb(password);
      alert('Database reset successful');
      loadTasks();
    } catch (error) {
      alert('Failed to reset database. Check password.');
      console.error(error);
    }
  };

  const handleConfluencePush = async () => {
    if (!confluenceUrl.trim()) {
      alert('Please enter a Confluence URL');
      return;
    }

    setIsPushing(true);
    setPushMessage('');

    try {
      const result = await pushToConfluence(confluenceUrl, confluenceCookies || undefined);

      if (result.success) {
        setPushMessage(result.message);
        setTimeout(() => {
          setIsConfluencePushOpen(false);
          setPushMessage('');
          setConfluenceUrl('');
        }, 2000);
      } else {
        setPushMessage(result.error || 'Failed to push to Confluence');
      }
    } catch (error) {
      setPushMessage('Failed to push to Confluence. Please check your credentials.');
      console.error(error);
    } finally {
      setIsPushing(false);
    }
  };

  const handleAutoExtractCookies = async () => {
    if (!confluenceUrl.trim()) {
      alert('Please enter a Confluence URL first');
      return;
    }

    try {
      const baseUrl = new URL(confluenceUrl).origin;
      setIsExtractingCookies(true);
      setPushMessage('Opening browser for login... Please login and wait.');

      const result = await extractConfluenceCookies(baseUrl);
      if (result.success) {
        setConfluenceCookies(result.cookies);
        setPushMessage('✅ Cookies extracted successfully!');
      } else {
        setPushMessage(result.error || 'Failed to extract cookies');
      }
    } catch {
      setPushMessage('Invalid URL or extraction failed');
    } finally {
      setIsExtractingCookies(false);
    }
  };

  return (
    <>
      <PageHeader title="Task Management" description="Manage, prioritize, and track all tasks">
        <div className="flex gap-4">
          <Button
            variant="danger"
            size="md"
            onClick={handleReset}
            title="Reset Database"
            leftIcon={<Trash2 size={18} />}
          />
          <Link href="/import">
            <Button variant="primary" size="md" leftIcon={<Upload size={18} />}>
              Import
            </Button>
          </Link>
          <Button
            variant="success"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Upload size={18} className="rotate-90" />}
          >
            New Task
          </Button>
          <div className="relative">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsExportOpen(!isExportOpen)}
              leftIcon={<Download size={18} />}
            >
              Export
            </Button>

            {isExportOpen && (
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-gray-100 bg-white shadow-lg">
                <div className="py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleExport('raw');
                      setIsExportOpen(false);
                    }}
                    className="block w-full justify-start text-left"
                  >
                    Raw Data
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleExport('stats');
                      setIsExportOpen(false);
                    }}
                    className="block w-full justify-start text-left"
                  >
                    Statistics
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      exportTaskListToPdf(tasks);
                      setIsExportOpen(false);
                    }}
                    className="block w-full justify-start text-left"
                  >
                    PDF (Task List)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsExportOpen(false);
                      setIsConfluencePushOpen(true);
                    }}
                    className="block w-full justify-start text-left"
                  >
                    Confluence Push
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="warning"
              size="md"
              onClick={handlePrioritize}
              leftIcon={<RefreshCw size={18} />}
            >
              AI Prioritize
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsInfoModalOpen(true)}
              className="h-10 w-10 p-0"
              title="How it works?"
              leftIcon={<Info size={18} />}
            />
          </div>
        </div>
      </PageHeader>

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
        onToggleAllProjects={toggleAllProjects}
        onToggleAssignee={toggleAssigneeFilter}
        onToggleAllAssignees={toggleAllAssignees}
        onToggleAiScore={toggleAiScoreFilter}
        onSelectAllAiScores={selectAllAiScores}
        onClearFilters={clearFilters}
      />

      <div className="rounded-lg bg-white p-2 shadow">
        {loading ? (
          <div className="py-10 text-center">Loading tasks...</div>
        ) : (
          <TasksTable
            tasks={tasks}
            onSort={handleSort}
            onReorder={handleReorder}
            onTaskClick={id => setSelectedTaskId(id)}
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

      <Modal isOpen={!!selectedTaskId} onClose={() => setSelectedTaskId(null)} title="Task Details">
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

      <Modal
        isOpen={isConfluencePushOpen}
        onClose={() => setIsConfluencePushOpen(false)}
        title="Push to Confluence"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Confluence Page URL *
            </label>
            <input
              type="url"
              value={confluenceUrl}
              onChange={e => setConfluenceUrl(e.target.value)}
              placeholder="https://confluence.example.com/display/SPACE/PageTitle"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Authentication Cookies (Optional)
              </label>
              <button
                onClick={handleAutoExtractCookies}
                disabled={isExtractingCookies || !confluenceUrl.trim()}
                className="flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isExtractingCookies ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" /> Extracting...
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3" /> Auto Extract
                  </>
                )}
              </button>
            </div>
            <textarea
              value={confluenceCookies}
              onChange={e => setConfluenceCookies(e.target.value)}
              placeholder='[{"name": "cloud.session.token", "value": "your_token_here", "domain": ".atlassian.net"}]'
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to use saved cookies from database.
            </p>
          </div>

          {pushMessage && (
            <div
              className={`rounded p-3 text-sm ${
                pushMessage.includes('Successfully')
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {pushMessage}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsConfluencePushOpen(false)}
              disabled={isPushing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfluencePush}
              disabled={isPushing || !confluenceUrl.trim()}
              className="flex-1"
              leftIcon={<Globe size={18} />}
            >
              {isPushing ? 'Pushing...' : 'Push'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
