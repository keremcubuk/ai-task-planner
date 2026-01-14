import React from 'react';

interface ProjectDetails {
  total: number;
  closed: number;
  inProgress: number;
  critical: number;
  minor: number;
}

interface ProjectsTabProps {
  projectCount: number;
  totalTasks: number;
  activeTasksCount: number;
  criticalCount: number;
  topProjectsByTickets: Array<{ project: string; count: number }>;
  byProject: Record<string, ProjectDetails>;
}

export function ProjectsTab({
  projectCount,
  totalTasks,
  activeTasksCount,
  criticalCount,
  topProjectsByTickets,
  byProject,
}: ProjectsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Toplam Proje</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{projectCount}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Toplam Ticket</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{totalTasks}</div>
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
          {topProjectsByTickets.map(({ project, count }, idx) => (
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
                      width: `${(count / (topProjectsByTickets[0]?.count || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Project Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Done</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">In Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Critical</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Minor</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(byProject).map(([project, stats]) => (
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
