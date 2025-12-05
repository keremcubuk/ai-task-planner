import React, { useEffect, useState } from 'react';
import { getAnalytics } from '../lib/api';
import { BarChart as BarChartIcon, Clock } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const result = await getAnalytics();
      setData(result);
    } catch (error) {
      console.error('Failed to load analytics', error);
    } finally {
      setLoading(false);
    }
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
              {Object.entries(data.byStatus).map(([status, count]: [string, any]) => (
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
              {Object.entries(data.bySeverity).map(([severity, count]: [string, any]) => (
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
              {Object.entries(data.byAssignedTo || {}).map(([assignee, count]: [string, any]) => (
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
                  {Object.entries(data.byAssigneePerformance || {}).map(([assignee, stats]: [string, any]) => {
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
                  {Object.entries(data.byProject || {}).map(([project, stats]: [string, any]) => (
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
}
