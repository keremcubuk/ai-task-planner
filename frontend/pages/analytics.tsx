import React, { useEffect, useState, useCallback } from 'react';
import {
  getAnalytics,
  getComponentAnalysis,
  getOllamaStatus,
  ComponentAnalysisResult,
  OllamaStatus,
} from '../lib/api';
import { Folder, Users, UserCheck, Layers, TrendingUp } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TaskDetail } from '../components/TaskDetail';
import { ProjectsTab } from '../components/analytics/ProjectsTab';
import { DevelopersTab } from '../components/analytics/DevelopersTab';
import { OpenersTab } from '../components/analytics/OpenersTab';
import { ComponentsTab } from '../components/analytics/ComponentsTab';
import { TrendsTab } from '../components/analytics/TrendsTab';

type TabType = 'projects' | 'developers' | 'openers' | 'components' | 'trends';

interface AnalyticsData {
  totalTasks: number;
  avgCompletionTimeDays: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byAssignedTo: Record<string, number>;
  byAssigneePerformance: Record<string, { total: number; completed: number }>;
  byAssigneeDetailed: Record<
    string,
    {
      total: number;
      completed: number;
      open: number;
      inProgress: number;
      avgPerMonth: number;
    }
  >;
  byProject: Record<
    string,
    {
      total: number;
      closed: number;
      inProgress: number;
      critical: number;
      minor: number;
    }
  >;
  byOpenedBy: Record<
    string,
    {
      total: number;
      issuesPerWeek: number;
      last30Days: number;
      bucketBreakdown: {
        solvedInComponent: number;
        solvedInProject: number;
        declined: number;
        design: number;
        other: number;
        none: number;
      };
      topComponents: Array<{ component: string; count: number }>;
      stuckComponents: Array<{
        component: string;
        total: number;
        solvedInProject: number;
        open: number;
        stuckCount: number;
      }>;
      solvedInProjectComponents: Array<{
        component: string;
        total: number;
        solvedInProject: number;
        solvedRate: number;
      }>;
      completionRate: number;
      qualityScore: number;
      componentDiversity: number;
    }
  >;
  byBucketCategory: {
    solvedInComponent: number;
    solvedInProject: number;
    declined: number;
    design: number;
    other: number;
    none: number;
  };
  byComponentBucket: Record<
    string,
    {
      total: number;
      bucketBreakdown: {
        solvedInComponent: number;
        solvedInProject: number;
        declined: number;
        design: number;
        other: number;
        none: number;
      };
      solvedInProjectPercent: number;
      solvedInComponentPercent: number;
    }
  >;
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
    try {
      const raw = localStorage.getItem('openedByComments');
      if (raw) setOpenerComments(JSON.parse(raw));
    } catch {
      setOpenerComments({});
    }
  }, []);

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
    { id: 'trends', label: 'Trend Analizi', icon: <TrendingUp size={18} /> },
  ];

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
        {activeTab === 'projects' && (
          <ProjectsTab
            projectCount={data.projectCount}
            totalTasks={data.totalTasks}
            activeTasksCount={activeTasksCount}
            criticalCount={criticalCount}
            topProjectsByTickets={data.topProjectsByTickets}
            byProject={data.byProject}
          />
        )}
        {activeTab === 'developers' && (
          <DevelopersTab
            byAssigneeDetailed={data.byAssigneeDetailed}
            completedTasksCount={completedTasksCount}
            avgCompletionTimeDays={data.avgCompletionTimeDays}
            activeTasksCount={activeTasksCount}
          />
        )}
        {activeTab === 'openers' && (
          <OpenersTab
            byOpenedBy={data.byOpenedBy}
            byBucketCategory={data.byBucketCategory}
            openerComments={openerComments}
            onCommentChange={setOpenerComment}
            onTaskClick={(taskId: number) => setSelectedTaskId(taskId)}
          />
        )}
        {activeTab === 'components' && (
          <ComponentsTab
            byComponentBucket={data.byComponentBucket}
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
        )}
        {activeTab === 'trends' && <TrendsTab />}
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
