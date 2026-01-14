import React, { useEffect, useState, useCallback } from 'react';
import {
  getAnalytics,
  getComponentAnalysis,
  getOllamaStatus,
  ComponentAnalysisResult,
  OllamaStatus,
} from '../lib/api';
import { Folder, Users, UserCheck, Layers } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TaskDetail } from '../components/TaskDetail';
import { ProjectsTab } from '../components/analytics/ProjectsTab';
import { DevelopersTab } from '../components/analytics/DevelopersTab';
import { OpenersTab } from '../components/analytics/OpenersTab';
import { ComponentsTab } from '../components/analytics/ComponentsTab';

type TabType = 'projects' | 'developers' | 'openers' | 'components';

interface AssigneePerformance {
  total: number;
  completed: number;
}

interface AssigneeDetailedStats {
  total: number;
  completed: number;
  open: number;
  inProgress: number;
  firstTaskAt?: string;
  lastTaskAt?: string;
  avgPerMonth: number;
}

interface ProjectDetails {
  total: number;
  closed: number;
  inProgress: number;
  critical: number;
  minor: number;
}

interface BucketBreakdown {
  done: number;
  solvedInProject: number;
  declined: number;
  design: number;
  other: number;
  none: number;
}

interface ComponentBucketStats {
  total: number;
  bucketBreakdown: BucketBreakdown;
  solvedInProjectPercent: number;
  solvedInComponentPercent: number;
}

interface AnalyticsData {
  totalTasks: number;
  avgCompletionTimeDays: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byAssignedTo: Record<string, number>;
  byAssigneePerformance: Record<string, AssigneePerformance>;
  byAssigneeDetailed: Record<string, AssigneeDetailedStats>;
  byProject: Record<string, ProjectDetails>;
  byOpenedBy: Record<
    string,
    {
      total: number;
      firstCreatedAt?: string;
      lastCreatedAt?: string;
      issuesPerWeek: number;
      last30Days: number;
      bucketBreakdown: BucketBreakdown;
      topComponents: Array<{ component: string; count: number }>;
    }
  >;
  byBucketCategory: BucketBreakdown;
  byComponentBucket: Record<string, ComponentBucketStats>;
  projectCount: number;
  topProjectsByTickets: Array<{ project: string; count: number }>;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [openerComments, setOpenerComments] = useState<Record<string, string>>({});
  const [componentData, setComponentData] = useState<ComponentAnalysisResult | null>(null);
  const [componentLoading, setComponentLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [useOllama, setUseOllama] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

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

  const loadComponentAnalysis = useCallback(async () => {
    setComponentLoading(true);
    try {
      const result = await getComponentAnalysis(useOllama);
      setComponentData(result);
    } catch (error) {
      console.error('Failed to load component analysis', error);
    } finally {
      setComponentLoading(false);
    }
  }, [useOllama]);

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

  useEffect(() => {
    loadAnalytics();
    checkOllamaStatus();
    loadComponentAnalysis();
    try {
      const raw = localStorage.getItem('openedByComments');
      if (raw) setOpenerComments(JSON.parse(raw));
    } catch {
      setOpenerComments({});
    }
  }, [loadComponentAnalysis]);

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

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'projects', label: 'Projeler', icon: <Folder size={18} /> },
    { id: 'developers', label: 'Developerlar', icon: <Users size={18} /> },
    { id: 'openers', label: 'Issue Açanlar', icon: <UserCheck size={18} /> },
    { id: 'components', label: 'Componentler', icon: <Layers size={18} /> },
  ];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'projects', label: 'Projeler', icon: <Folder size={18} /> },
    { id: 'developers', label: 'Developerlar', icon: <Users size={18} /> },
    { id: 'openers', label: 'Issue Açanlar', icon: <UserCheck size={18} /> },
    { id: 'components', label: 'Componentler', icon: <Layers size={18} /> },
  ];

  const renderProjectsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Toplam Proje</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{data.projectCount}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Toplam Ticket</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{data.totalTasks}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Açık Ticket</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{activeTasksCount}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Kritik</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{criticalCount}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">En Çok Ticket Gelen Projeler</h3>
        <div className="space-y-3">
          {(data.topProjectsByTickets || []).map(({ project, count }, idx) => (
            <div key={project} className="flex items-center gap-3">
              <span className="text-gray-400 w-6">{idx + 1}.</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-900 font-medium">{project}</span>
                  <span className="text-gray-600">{count} ticket</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(count / (data.topProjectsByTickets[0]?.count || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Proje Detayları</h3>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Proje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Toplam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Kapalı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Devam Eden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Kritik</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Minor</th>
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
  );

  const renderDevelopersTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Toplam Developer</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {Object.keys(data.byAssigneeDetailed || {}).filter((a) => a !== 'unassigned').length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Toplam Çözülen</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{completedTasksCount}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Ort. Tamamlanma</div>
          <div className="text-3xl font-bold text-indigo-600 mt-2">
            {data.avgCompletionTimeDays} <span className="text-base font-normal text-gray-500">gün</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Devam Eden</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{activeTasksCount}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Developer Performansı</h3>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Developer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Toplam</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Çözülen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Açık</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Devam Eden</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Aylık Ort.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Tamamlanma %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.byAssigneeDetailed || {})
                .sort((a, b) => b[1].completed - a[1].completed)
                .map(([assignee, stats]) => {
                  const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                  return (
                    <tr key={assignee}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{assignee}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{stats.total}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">{stats.completed}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{stats.open}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">{stats.inProgress}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{stats.avgPerMonth}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-gray-600">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOpenersTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Issue Açan Kişi</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {Object.keys(data.byOpenedBy || {}).filter((o) => o !== 'unknown').length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Projede Çözülen</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{data.byBucketCategory?.solvedInProject || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Componentte Çözülen</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{data.byBucketCategory?.done || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Declined</div>
          <div className="text-3xl font-bold text-gray-600 mt-2">{data.byBucketCategory?.declined || 0}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Açanlar Detay</h3>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Açan Kişi</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Toplam</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">/ Hafta</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Son 30g</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Projede Çözüldü</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Done</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Tasarım</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Declined</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">En Çok Açılan Component</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Not</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {openedByEntries.map(([openedBy, stats]) => (
                <tr key={openedBy}>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 max-w-[180px] truncate" title={openedBy}>
                    {openedBy}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{stats.total}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{stats.issuesPerWeek}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{stats.last30Days}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-green-600 font-medium">{stats.bucketBreakdown.solvedInProject}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-blue-600">{stats.bucketBreakdown.done}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-purple-600">{stats.bucketBreakdown.design}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{stats.bucketBreakdown.declined}</td>
                  <td className="px-3 py-3 text-sm text-gray-700 max-w-[200px]">
                    <div className="space-y-1">
                      {(stats.topComponents || []).slice(0, 3).map((c) => (
                        <div key={c.component} className="text-xs">
                          <span className="font-medium">{c.component}</span>
                          <span className="text-gray-400 ml-1">({c.count})</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700 min-w-[200px]">
                    <input
                      className="w-full border-gray-300 rounded-md shadow-sm p-1.5 border text-gray-900 text-sm"
                      value={openerComments[openedBy] || ''}
                      onChange={(e) => setOpenerComment(openedBy, e.target.value)}
                      placeholder="Not ekle..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderComponentsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Component Bucket Analizi</h3>
        <p className="text-sm text-gray-500 mb-4">
          Her component için ticketların % kaçı projede çözüldü, % kaçı componentte çözüldü.
        </p>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Component</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Toplam</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Projede Çözülen %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Componentte Çözülen %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Tasarım</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Declined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Diğer</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.byComponentBucket || {})
                .sort((a, b) => b[1].total - a[1].total)
                .map(([component, stats]) => (
                  <tr key={component}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{component}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{stats.total}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.solvedInProjectPercent}%` }} />
                        </div>
                        <span className="text-green-600 font-medium">{stats.solvedInProjectPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.solvedInComponentPercent}%` }} />
                        </div>
                        <span className="text-blue-600 font-medium">{stats.solvedInComponentPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-600">{stats.bucketBreakdown.design}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{stats.bucketBreakdown.declined}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {stats.bucketBreakdown.other + stats.bucketBreakdown.none}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

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
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <div className="text-sm text-gray-500 mt-1">
            Proje, developer, issue açan ve component bazlı analizler.
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'projects' && renderProjectsTab()}
        {activeTab === 'developers' && renderDevelopersTab()}
        {activeTab === 'openers' && renderOpenersTab()}
        {activeTab === 'components' && renderComponentsTab()}
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
