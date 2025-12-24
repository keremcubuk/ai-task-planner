import React, { useEffect, useState } from 'react';
import {
  getAnalytics,
  getComponentAnalysis,
  getOllamaStatus,
  ComponentAnalysisResult,
  OllamaStatus,
} from '../lib/api';
import { BarChart as BarChartIcon, Clock, Cpu, Layers, ChevronDown, ChevronUp } from 'lucide-react';

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
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [componentData, setComponentData] = useState<ComponentAnalysisResult | null>(null);
  const [componentLoading, setComponentLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [useOllama, setUseOllama] = useState(true);

  useEffect(() => {
    loadAnalytics();
    checkOllamaStatus();
  }, []);

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Total Tasks</h3>
            <div className="text-4xl font-bold text-gray-900 mt-2">{data.totalTasks}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
             <h3 className="text-gray-500 text-sm font-medium uppercase">Avg Completion</h3>
             <div className="text-4xl font-bold text-indigo-600 mt-2">
               {data.avgCompletionTimeDays} <span className="text-lg font-normal text-gray-500">days</span>
             </div>
             <div className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={12}/> Time to complete</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <BarChartIcon size={20} /> Tasks by Status
            </h3>
            <div className="space-y-4">
              {Object.entries(data.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="capitalize text-gray-700">{status.replace('_', ' ')}</span>
                  <span className="font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <BarChartIcon size={20} /> Tasks by Severity
            </h3>
            <div className="space-y-4">
              {Object.entries(data.bySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <span className="capitalize text-gray-700">{severity}</span>
                  <span className="font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <BarChartIcon size={20} /> Tasks by Assignee
            </h3>
            <div className="space-y-4">
              {Object.entries(data.byAssignedTo || {}).map(([assignee, count]) => (
                <div key={assignee} className="flex items-center justify-between">
                  <span className="capitalize text-gray-700">{assignee}</span>
                  <span className="font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mt-6">
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
                  {Object.entries(data.byAssigneePerformance || {}).map(([assignee, stats]) => {
                    const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
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
                  })}
                </tbody>
              </table>
            </div>
          </div>

        <div className="bg-white p-6 rounded-lg shadow mt-6">
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

        {/* Component Analysis Section */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Layers size={20} /> UI Component Analysis
            </h3>
            <div className="flex items-center gap-4">
              {/* Ollama Status Indicator */}
              <div className="flex items-center gap-2">
                <Cpu size={16} className={ollamaStatus?.available ? 'text-green-500' : 'text-gray-400'} />
                <span className={`text-sm ${ollamaStatus?.available ? 'text-green-600' : 'text-gray-500'}`}>
                  {ollamaStatus?.available ? 'Ollama Active' : 'Ollama Offline (Pattern Mode)'}
                </span>
              </div>
              {/* Toggle for Ollama usage */}
              {ollamaStatus?.available && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useOllama}
                    onChange={(e) => setUseOllama(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Use AI
                </label>
              )}
              <button
                onClick={loadComponentAnalysis}
                disabled={componentLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                {componentLoading ? 'Analyzing...' : 'Analyze Components'}
              </button>
            </div>
          </div>

          {componentData && (
            <div>
              <div className="text-sm text-gray-500 mb-4">
                Analyzed {componentData.analyzedTasks} of {componentData.totalTasks} tasks.
                Found {componentData.components.length} unique components.
              </div>

              {componentData.components.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No UI components detected in task descriptions.
                </div>
              ) : (
                <div className="space-y-2">
                  {componentData.components.map((component) => {
                    const criticalityScore = component.activeTasks > 0 
                      ? (component.activeTasks / component.count) * 100 
                      : 0;
                    const isCritical = component.activeTasks >= 3;
                    
                    return (
                      <div key={component.name} className={`border rounded-lg ${isCritical ? 'border-red-300 bg-red-50' : ''}`}>
                        <button
                          onClick={() => toggleComponentExpand(component.name)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-medium text-gray-900 capitalize">{component.name}</span>
                            
                            {/* Active Tasks Badge */}
                            {component.activeTasks > 0 && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                {component.activeTasks} aktif
                              </span>
                            )}
                            
                            {/* Completed Tasks Badge */}
                            {component.completedTasks > 0 && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                {component.completedTasks} tamamlandı
                              </span>
                            )}
                            
                            {/* Total Badge */}
                            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              Toplam: {component.count}
                            </span>

                            {/* Critical Warning */}
                            {isCritical && (
                              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
                                ⚠️ KRİTİK
                              </span>
                            )}
                          </div>
                          {expandedComponents.has(component.name) ? (
                            <ChevronUp size={20} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-400" />
                          )}
                        </button>

                        {expandedComponents.has(component.name) && (
                          <div className="px-4 pb-3 border-t bg-gray-50">
                            <div className="pt-3">
                              {/* Statistics */}
                              <div className="mb-3 p-3 bg-white rounded border text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-gray-500">Kritiklik Skoru:</span>
                                    <span className={`ml-2 font-bold ${criticalityScore > 50 ? 'text-red-600' : 'text-green-600'}`}>
                                      {criticalityScore.toFixed(0)}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Toplam Sorun:</span>
                                    <span className="ml-2 font-bold">{component.count}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Active Tasks Section */}
                              {component.tasks.filter(t => t.status !== 'done' && t.status !== 'completed').length > 0 && (
                                <div className="mb-4">
                                  <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                                    🔴 Aktif Sorunlar ({component.activeTasks})
                                  </h4>
                                  <div className="space-y-2">
                                    {component.tasks
                                      .filter(t => t.status !== 'done' && t.status !== 'completed')
                                      .map((task) => (
                                        <div key={task.id} className="text-sm bg-white p-2 rounded border border-red-200">
                                          <div className="flex items-start gap-2">
                                            <a
                                              href={`/tasks/${task.id}`}
                                              className="text-indigo-600 hover:text-indigo-800 font-medium flex-1"
                                            >
                                              #{task.id}: {task.title}
                                            </a>
                                            {task.severity && (
                                              <span className={`text-xs px-2 py-0.5 rounded ${
                                                task.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                                task.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                                                'bg-yellow-100 text-yellow-800'
                                              }`}>
                                                {task.severity}
                                              </span>
                                            )}
                                          </div>
                                          {task.description && (
                                            <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                                              {task.description}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Completed Tasks Section */}
                              {component.tasks.filter(t => t.status === 'done' || t.status === 'completed').length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                                    ✅ Geçmiş Sorunlar ({component.completedTasks})
                                  </h4>
                                  <div className="space-y-2">
                                    {component.tasks
                                      .filter(t => t.status === 'done' || t.status === 'completed')
                                      .slice(0, 5)
                                      .map((task) => (
                                        <div key={task.id} className="text-sm bg-white p-2 rounded border border-green-200 opacity-75">
                                          <a
                                            href={`/tasks/${task.id}`}
                                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                                          >
                                            #{task.id}: {task.title}
                                          </a>
                                          {task.description && (
                                            <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                                              {task.description}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    {component.tasks.filter(t => t.status === 'done' || t.status === 'completed').length > 5 && (
                                      <p className="text-xs text-gray-500 italic">
                                        +{component.tasks.filter(t => t.status === 'done' || t.status === 'completed').length - 5} daha fazla tamamlanmış task
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!componentData && !componentLoading && (
            <div className="text-gray-500 text-center py-8">
              Click &quot;Analyze Components&quot; to detect UI components mentioned in task descriptions.
              <br />
              <span className="text-sm">
                {ollamaStatus?.available
                  ? 'Using Ollama LLM for intelligent detection.'
                  : 'Using pattern matching (install Ollama for better results).'}
              </span>
            </div>
          )}
        </div>
    </div>
  );
}
