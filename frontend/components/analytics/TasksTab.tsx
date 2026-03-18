import React, { useState } from 'react';
import { Download, Info } from 'lucide-react';
import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  TaskAnalytics,
  ResolutionBySeverity,
  ResolutionByProject,
  MonthlyOpenedClosed,
} from '@lib/api';
import { StatCard, StatCardGrid, DataTable, DataTableColumn } from '@components/ui';
import { exportTaskAnalyticsToPdf } from '@lib/pdfExport';

interface TasksTabProps {
  taskAnalytics: TaskAnalytics;
}

type BucketColor = 'blue' | 'green' | 'purple' | 'red' | 'gray';

export function TasksTab({ taskAnalytics }: Readonly<TasksTabProps>) {
  const [exporting, setExporting] = useState(false);
  const {
    bucketDistribution,
    resolutionTime,
    resolutionBySeverity,
    resolutionByProject,
    monthlyOpenedClosed,
  } = taskAnalytics;

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportTaskAnalyticsToPdf(taskAnalytics);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setExporting(false);
    }
  };

  const severityColumns: DataTableColumn<ResolutionBySeverity>[] = [
    {
      key: 'severity',
      header: 'Severity',
      render: (_, row) => (
        <span
          className={`font-medium ${
            row.severity === 'critical'
              ? 'text-red-600'
              : row.severity === 'major'
                ? 'text-orange-600'
                : row.severity === 'minor'
                  ? 'text-yellow-600'
                  : 'text-gray-600'
          }`}
        >
          {row.severity}
        </span>
      ),
    },
    {
      key: 'avgDays',
      header: 'Ort. Çözüm Süresi',
      render: (_, row) => <span className="font-medium">{row.avgDays} gün</span>,
    },
    {
      key: 'count',
      header: 'Çözülen',
      render: (_, row) => row.count,
    },
  ];

  const projectColumns: DataTableColumn<ResolutionByProject>[] = [
    {
      key: 'project',
      header: 'Proje',
      render: (_, row) => <span className="font-medium text-gray-900">{row.project}</span>,
    },
    {
      key: 'avgDays',
      header: 'Ort. Çözüm Süresi',
      render: (_, row) => <span className="font-medium">{row.avgDays} gün</span>,
    },
    {
      key: 'count',
      header: 'Çözülen',
      render: (_, row) => row.count,
    },
  ];

  const monthlyColumns: DataTableColumn<MonthlyOpenedClosed>[] = [
    {
      key: 'period',
      header: 'Dönem',
      render: (_, row) => (
        <span className="font-medium text-gray-900">
          {row.month} {row.year}
        </span>
      ),
    },
    {
      key: 'opened',
      header: 'Açılan',
      render: (_, row) => <span className="font-medium text-blue-600">{row.opened}</span>,
    },
    {
      key: 'closed',
      header: 'Kapanan',
      render: (_, row) => <span className="font-medium text-green-600">{row.closed}</span>,
    },
    {
      key: 'netChange',
      header: 'Net Değişim',
      render: (_, row) => (
        <span
          className={`font-medium ${
            row.netChange > 0
              ? 'text-red-600'
              : row.netChange < 0
                ? 'text-green-600'
                : 'text-gray-600'
          }`}
        >
          {row.netChange > 0 ? '+' : ''}
          {row.netChange}
        </span>
      ),
    },
  ];

  const bucketItems = [
    { label: 'Componentte Çözülen', data: bucketDistribution.solvedInComponent, color: 'blue' },
    { label: 'Projede Çözülen', data: bucketDistribution.solvedInProject, color: 'green' },
    { label: 'Tasarım', data: bucketDistribution.design, color: 'purple' },
    { label: 'Declined', data: bucketDistribution.declined, color: 'red' },
    { label: 'Diğer', data: bucketDistribution.other, color: 'gray' },
    { label: 'Belirsiz', data: bucketDistribution.none, color: 'gray' },
  ];

  const pieColors: Record<BucketColor, string> = {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    red: '#EF4444',
    gray: '#6B7280',
  };

  const bucketChartData = bucketItems.map(item => ({
    name: item.label,
    value: item.data.count,
    percent: item.data.percent,
    color: pieColors[item.color as BucketColor],
    fill: pieColors[item.color as BucketColor],
  }));

  const hasBucketData = bucketChartData.some(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Bucket Distribution */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Bucket Dağılımı</h3>
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <Download size={16} />
            {exporting ? 'PDF Oluşturuluyor...' : 'PDF İndir'}
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Tüm taskların çözüm kategorilerine göre dağılımı (Toplam: {bucketDistribution.total} task)
        </p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 w-full">
            {hasBucketData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bucketChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    labelLine={false}
                    label={({ value }) => {
                      const numericValue = Number(value) || 0;
                      const labelPercent =
                        bucketDistribution.total > 0
                          ? (numericValue / bucketDistribution.total) * 100
                          : 0;
                      return labelPercent > 0 ? `${labelPercent.toFixed(1)}%` : '';
                    }}
                  />
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-sm text-gray-500">
                Pie chart için yeterli veri bulunamadı.
              </div>
            )}
          </div>

          <div className="space-y-3">
            {bucketChartData.map(item => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {item.value} ({item.percent.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resolution Time Stats */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Çözüm Süresi İstatistikleri</h3>
        <p className="mb-4 text-sm text-gray-500">
          completedDate - createdAt farkına göre hesaplanan çözüm süreleri (
          {resolutionTime.totalResolved} task analiz edildi)
        </p>
        <StatCardGrid columns={4}>
          <StatCard label="Ortalama" value={`${resolutionTime.avgDays} gün`} />
          <StatCard label="Minimum" value={`${resolutionTime.minDays} gün`} valueColor="green" />
          <StatCard
            label="Maksimum"
            value={`${resolutionTime.maxDays} gün`}
            valueColor="red"
            subtitle={
              resolutionTime.maxResolutionTask
                ? `#${resolutionTime.maxResolutionTask.id}`
                : undefined
            }
            icon={resolutionTime.maxResolutionTask ? <Info size={16} /> : undefined}
            tooltip={
              resolutionTime.maxResolutionTask ? (
                <div className="space-y-1">
                  <p className="font-semibold">{resolutionTime.maxResolutionTask.title}</p>
                  <p className="text-sm">
                    <span className="font-medium">Proje:</span>{' '}
                    {resolutionTime.maxResolutionTask.project}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Severity:</span>{' '}
                    {resolutionTime.maxResolutionTask.severity}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Çözüm:</span>{' '}
                    {resolutionTime.maxResolutionTask.resolutionDays} gün
                  </p>
                </div>
              ) : undefined
            }
          />
          <StatCard label="Medyan" value={`${resolutionTime.medianDays} gün`} valueColor="blue" />
        </StatCardGrid>
      </div>

      {/* Resolution by Severity & Project */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Severity Bazında Çözüm Süresi</h3>
          <DataTable
            data={resolutionBySeverity}
            columns={severityColumns}
            keyExtractor={row => row.severity}
            emptyMessage="Veri bulunamadı"
          />
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Proje Bazında Çözüm Süresi (Top 10)
          </h3>
          <DataTable
            data={resolutionByProject}
            columns={projectColumns}
            keyExtractor={row => row.project}
            emptyMessage="Veri bulunamadı"
          />
        </div>
      </div>

      {/* Monthly Opened vs Closed */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Aylık Açılan vs Kapanan Tasklar</h3>
        <p className="mb-4 text-sm text-gray-500">
          Her ay açılan ve kapanan task sayıları. Pozitif net değişim = birikme, Negatif = azalma.
        </p>

        {/* Visual Bar Chart */}
        <div className="mb-6 space-y-2">
          {monthlyOpenedClosed.slice(-12).map(item => {
            const maxVal = Math.max(
              ...monthlyOpenedClosed.slice(-12).map(m => Math.max(m.opened, m.closed))
            );
            let netChangeColor = 'text-gray-600';
            if (item.netChange > 0) {
              netChangeColor = 'text-red-600';
            } else if (item.netChange < 0) {
              netChangeColor = 'text-green-600';
            }
            return (
              <div key={`${item.year}-${item.month}`} className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-600">
                  {item.month} {item.year}
                </span>
                <div className="flex flex-1 gap-2">
                  <div className="relative flex-1">
                    <div
                      className="h-5 rounded bg-blue-500"
                      style={{ width: `${maxVal > 0 ? (item.opened / maxVal) * 100 : 0}%` }}
                    />
                    <span className="absolute top-0 left-2 text-xs leading-5 font-medium text-white">
                      {item.opened > 0 && item.opened}
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <div
                      className="h-5 rounded bg-green-500"
                      style={{ width: `${maxVal > 0 ? (item.closed / maxVal) * 100 : 0}%` }}
                    />
                    <span className="absolute top-0 left-2 text-xs leading-5 font-medium text-white">
                      {item.closed > 0 && item.closed}
                    </span>
                  </div>
                </div>
                <span className={`w-12 text-right text-sm font-medium ${netChangeColor}`}>
                  {item.netChange > 0 ? '+' : ''}
                  {item.netChange}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-blue-500" />
            <span>Açılan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-green-500" />
            <span>Kapanan</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-6">
          <DataTable
            data={monthlyOpenedClosed.slice(-12).reverse()}
            columns={monthlyColumns}
            keyExtractor={row => `${row.year}-${row.month}`}
            emptyMessage="Veri bulunamadı"
          />
        </div>
      </div>
    </div>
  );
}
