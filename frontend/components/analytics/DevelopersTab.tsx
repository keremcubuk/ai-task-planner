import React from 'react';
import { StatCard, StatCardGrid, DataTable, DataTableColumn, ProgressBar } from '../ui';

interface AssigneeDetailedStats {
  total: number;
  completed: number;
  open: number;
  inProgress: number;
  avgPerMonth: number;
}

interface DeveloperRow {
  assignee: string;
  stats: AssigneeDetailedStats;
  rate: number;
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
  const developerCount = Object.keys(byAssigneeDetailed).filter(a => a !== 'unassigned').length;

  const developerData: DeveloperRow[] = Object.entries(byAssigneeDetailed)
    .sort((a, b) => b[1].completed - a[1].completed)
    .map(([assignee, stats]) => ({
      assignee,
      stats,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }));

  const columns: DataTableColumn<DeveloperRow>[] = [
    {
      key: 'assignee',
      header: 'Developer',
      render: (_, row) => <span className="font-medium text-gray-900">{row.assignee}</span>,
    },
    {
      key: 'stats.total',
      header: 'Toplam',
      render: (_, row) => row.stats.total,
    },
    {
      key: 'stats.completed',
      header: 'Çözülen',
      render: (_, row) => <span className="font-medium text-green-600">{row.stats.completed}</span>,
    },
    {
      key: 'stats.open',
      header: 'Açık',
      render: (_, row) => row.stats.open,
    },
    {
      key: 'stats.inProgress',
      header: 'Devam Eden',
      render: (_, row) => <span className="text-blue-600">{row.stats.inProgress}</span>,
    },
    {
      key: 'stats.avgPerMonth',
      header: 'Aylık Ort.',
      render: (_, row) => row.stats.avgPerMonth,
    },
    {
      key: 'rate',
      header: 'Tamamlanma %',
      render: (_, row) => (
        <ProgressBar
          value={row.rate}
          color="green"
          size="md"
          showLabel
          labelPosition="right"
          width="w-20"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <StatCardGrid columns={4}>
        <StatCard label="Toplam Developer" value={developerCount} />
        <StatCard label="Toplam Çözülen" value={completedTasksCount} valueColor="green" />
        <StatCard
          label="Ort. Tamamlanma"
          value={avgCompletionTimeDays}
          valueColor="indigo"
          suffix="gün"
        />
        <StatCard label="Devam Eden" value={activeTasksCount} valueColor="blue" />
      </StatCardGrid>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Developer Performansı</h3>
        <DataTable
          data={developerData}
          columns={columns}
          keyExtractor={row => row.assignee}
          emptyMessage="Developer bulunamadı"
        />
      </div>
    </div>
  );
}
