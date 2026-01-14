import React from 'react';

interface AssigneeDetailedStats {
  total: number;
  completed: number;
  open: number;
  inProgress: number;
  avgPerMonth: number;
}

interface DevelopersTabProps {
  byAssigneeDetailed: Record<string, AssigneeDetailedStats>;
  completedTasksCount: number;
  avgCompletionTimeDays: number;
  activeTasksCount: number;
}

export function DevelopersTab({
  byAssigneeDetailed,
  completedTasksCount,
  avgCompletionTimeDays,
  activeTasksCount,
}: DevelopersTabProps) {
  const developerCount = Object.keys(byAssigneeDetailed).filter((a) => a !== 'unassigned').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Toplam Developer</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{developerCount}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Toplam Çözülen</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{completedTasksCount}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Ort. Tamamlanma</div>
          <div className="text-3xl font-bold text-indigo-600 mt-2">
            {avgCompletionTimeDays} <span className="text-base font-normal text-gray-500">gün</span>
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
              {Object.entries(byAssigneeDetailed)
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
}
