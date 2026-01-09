import React, { useEffect, useState } from 'react';
import {
  getAnalytics,
  getComponentAnalysis,
  getOllamaStatus,
  ComponentAnalysisResult,
  OllamaStatus,
} from '../lib/api';
import { BarChart as BarChartIcon, Clock } from 'lucide-react';
import { ComponentAnalysisSection } from '../components/ComponentAnalysisSection';
import { Modal } from '../components/Modal';
import { TaskDetail } from '../components/TaskDetail';

interface AssigneePerformance {
  total: number;
  completed: number;
}

interface ProjectDetails {
  total: number;
  closed: number;
  inProgress: number;
  critical: number;
  minor: number;
}

interface AnalyticsData {
  totalTasks: number;
  avgCompletionTimeDays: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byAssignedTo: Record<string, number>;
  byAssigneePerformance: Record<string, AssigneePerformance>;
  byProject: Record<string, ProjectDetails>;
  byOpenedBy: Record<
    string,
    {
      total: number;
      firstCreatedAt?: string;
      lastCreatedAt?: string;
      issuesPerWeek: number;
      last30Days: number;
      bucketBreakdown: {
        done: number;
        projectSolved: number;
        declined: number;
        design: number;
        other: number;
        none: number;
      };
    }
  >;
  byBucketCategory: {
    done: number;
    projectSolved: number;
    declined: number;
    design: number;
    other: number;
    none: number;
  };
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openerComments, setOpenerComments] = useState<Record<string, string>>({});
  const [componentData, setComponentData] = useState<ComponentAnalysisResult | null>(null);
  const [componentLoading, setComponentLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [useOllama, setUseOllama] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  useEffect(() => {
    loadAnalytics();
    checkOllamaStatus();
    try {
      const raw = localStorage.getItem('openedByComments');
      if (raw) setOpenerComments(JSON.parse(raw));
    } catch {
      setOpenerComments({});
    }
  }, []);

  const setOpenerComment = (openedBy: string, value: string) => {
    setOpenerComments((prev) => {
      const next = { ...prev, [openedBy]: value };
      try {
        localStorage.setItem('openedByComments', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const loadAnalytics = async () => {
    try {
      const result = await getAnalytics();
      setData(result as AnalyticsData);
    } catch (error) {
      console.error('Failed to load analytics', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOllamaStatus = async () => {
    try {
      const status = await getOllamaStatus();
      setOllamaStatus(status);
      setUseOllama(status.available);
    } catch (error) {
      console.error('Failed to check Ollama status', error);
      setOllamaStatus({ available: false, message: 'Failed to check Ollama status' });
      setUseOllama(false);
    }
  };

  const loadComponentAnalysis = async () => {
    setComponentLoading(true);
    try {
      const result = await getComponentAnalysis(useOllama);
      setComponentData(result);
    } catch (error) {
      console.error('Failed to load component analysis', error);
    } finally {
      setComponentLoading(false);
    }
  };

  const toggleComponentExpand = (componentName: string) => {
    setExpandedComponents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(componentName)) {
        newSet.delete(componentName);
      } else {
        newSet.add(componentName);
      }
      return newSet;
    });
  };

  if (loading) return <div className="p-8">Loading analytics...</div>;
  if (!data) return <div className="p-8">Failed to load data</div>;

  const activeTasksCount =
    (data.byStatus?.open || 0) +
    (data.byStatus?.in_progress || 0) +
    (data.byStatus?.inprogress || 0);
  const completedTasksCount =
    (data.byStatus?.done || 0) + (data.byStatus?.completed || 0);
  const criticalCount = data.bySeverity?.critical || 0;
  const openedByEntries = Object.entries(data.byOpenedBy || {}).sort((a, b) => {
    return (b[1]?.total || 0) - (a[1]?.total || 0);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <div className="text-sm text-gray-500 mt-1">
            Overview of tasks, projects, assignees, and UI component hotspots.
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <BarChartIcon size={20} /> Issue Openers
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opened By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  / Week
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last 30d
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Solved
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Done
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Design
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Declined
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Other
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {openedByEntries.map(([openedBy, stats]) => (
                <tr key={openedBy}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {openedBy}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {stats.total}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {stats.issuesPerWeek}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {stats.last30Days}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {stats.bucketBreakdown.projectSolved}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {stats.bucketBreakdown.done}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {stats.bucketBreakdown.design}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {stats.bucketBreakdown.declined}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {stats.bucketBreakdown.other + stats.bucketBreakdown.none}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 min-w-[280px]">
                    <input
                      className="w-full border-gray-300 rounded-md shadow-sm p-2 border text-gray-900"
                      value={openerComments[openedBy] || ''}
                      onChange={(e) => setOpenerComment(openedBy, e.target.value)}
                      placeholder="Add a note..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Total Tasks</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{data.totalTasks}</div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Active</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{activeTasksCount}</div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Completed</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{completedTasksCount}</div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Critical</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{criticalCount}</div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Avg Completion</div>
          <div className="text-3xl font-bold text-indigo-600 mt-2">
            {data.avgCompletionTimeDays}{' '}
            <span className="text-base font-normal text-gray-500">days</span>
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Clock size={12} /> Time to complete
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <BarChartIcon size={20} /> Tasks by Status
          </h3>
          <div className="space-y-3">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="capitalize text-gray-700">
                  {status.replace('_', ' ')}
                </span>
                <span className="font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <BarChartIcon size={20} /> Tasks by Severity
          </h3>
          <div className="space-y-3">
            {Object.entries(data.bySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <span className="capitalize text-gray-700">{severity}</span>
                <span className="font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <BarChartIcon size={20} /> Tasks by Assignee
          </h3>
          <div className="space-y-3">
            {Object.entries(data.byAssignedTo || {}).map(([assignee, count]) => (
              <div key={assignee} className="flex items-center justify-between gap-3">
                <span
                  className="capitalize text-gray-700 truncate min-w-0 flex-1"
                  title={assignee}
                >
                  {assignee}
                </span>
                <span className="font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <BarChartIcon size={20} /> Assignee Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tasks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(data.byAssigneePerformance || {}).map(
                  ([assignee, stats]) => {
                    const rate =
                      stats.total > 0
                        ? Math.round((stats.completed / stats.total) * 100)
                        : 0;
                    return (
                      <tr key={assignee}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{assignee}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.total}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.completed}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="mr-2">{rate}%</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${rate}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-1 gap-4 mt-6">

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <BarChartIcon size={20} /> Project Overview
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Critical</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(data.byProject || {}).map(([project, stats]) => (
                  <tr key={project}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{stats.closed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{stats.inProgress}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{stats.critical}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.minor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ComponentAnalysisSection
          ollamaStatus={ollamaStatus}
          useOllama={useOllama}
          setUseOllama={setUseOllama}
          loadComponentAnalysis={loadComponentAnalysis}
          componentLoading={componentLoading}
          componentData={componentData}
          expandedComponents={expandedComponents}
          toggleComponentExpand={toggleComponentExpand}
          onTaskClick={(taskId) => setSelectedTaskId(taskId)}
        />
      </div>

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
              loadAnalytics();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
