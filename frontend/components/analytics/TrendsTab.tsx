import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, Users, Info, Download } from 'lucide-react';
import { InfoBox, TabNavigation, DataTable, DataTableColumn, Button } from '../ui';
import { getTrendAnalytics, TrendAnalyticsResponse } from '../../lib/api';
import { exportTrendsToPdf } from '../../lib/pdfExport';

type ViewType = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'yoy';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function TrendsTab() {
  const [data, setData] = useState<TrendAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('monthly');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getTrendAnalytics();
      setData(result);
    } catch (err) {
      setError('Trend verileri yüklenemedi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-600">Trend verileri yükleniyor...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return <div className="p-8 text-gray-600">Veri bulunamadı</div>;

  const renderChangeIndicator = (change: number | null) => {
    if (change === null) return <Minus className="text-gray-400" size={16} />;
    if (change > 0) return <TrendingUp className="text-red-500" size={16} />;
    if (change < 0) return <TrendingDown className="text-green-500" size={16} />;
    return <Minus className="text-gray-400" size={16} />;
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return 'text-gray-500';
    if (change > 0) return 'text-red-600';
    if (change < 0) return 'text-green-600';
    return 'text-gray-500';
  };

  const views: { id: ViewType; label: string }[] = [
    { id: 'weekly', label: 'Haftalık' },
    { id: 'monthly', label: 'Aylık' },
    { id: 'quarterly', label: 'Çeyreklik' },
    { id: 'yearly', label: 'Yıllık' },
    { id: 'yoy', label: 'Yıl Karşılaştırma' },
  ];

  // Prepare monthly chart data
  const monthlyChartData = data.monthly.map(item => ({
    period: item.current.period,
    count: item.current.count,
    dailyAvg: item.current.dailyAverage,
    projects: item.current.uniqueProjects,
    change: item.changePercent,
  }));

  // Prepare weekly chart data
  const weeklyChartData = data.weekly.map(item => ({
    period: item.current.period,
    count: item.current.count,
    dailyAvg: item.current.dailyAverage,
    projects: item.current.uniqueProjects,
    change: item.changePercent,
  }));

  // Prepare quarterly chart data with monthly distribution
  const quarterlyChartData = data.quarterly.map(q => ({
    period: `${q.year} ${q.quarter}`,
    count: q.count,
    projects: q.uniqueProjects,
    ...q.months.reduce((acc, m) => ({ ...acc, [m.month]: m.count }), {}),
  }));

  // Prepare year-over-year month comparison data
  const yoyMonthData = data.yearOverYear.monthComparisons.map(m => {
    const result: Record<string, string | number> = { month: m.month };
    m.years.forEach(y => {
      result[`${y.year}`] = y.count;
      result[`${y.year}_projects`] = y.uniqueProjects;
    });
    return result;
  });

  // Prepare year-over-year quarter comparison data
  const yoyQuarterData = data.yearOverYear.quarterComparisons.map(q => {
    const result: Record<string, string | number> = { quarter: q.quarter };
    q.years.forEach(y => {
      result[`${y.year}`] = y.count;
      result[`${y.year}_projects`] = y.uniqueProjects;
    });
    return result;
  });

  const years = data.yearly.map(y => y.year);

  type WeeklyRow = (typeof data.weekly)[number];
  type MonthlyRow = (typeof data.monthly)[number];
  type YearlyRow = (typeof data.yearly)[number];

  const weeklyColumns: DataTableColumn<WeeklyRow>[] = [
    { key: 'current.period', header: 'Hafta', render: (_, row) => row.current.period },
    { key: 'current.count', header: 'Task Sayısı', render: (_, row) => row.current.count },
    {
      key: 'current.dailyAverage',
      header: 'Günlük Ort.',
      render: (_, row) => row.current.dailyAverage,
    },
    {
      key: 'current.uniqueProjects',
      header: 'Proje Sayısı',
      render: (_, row) => row.current.uniqueProjects,
    },
    {
      key: 'changePercent',
      header: 'Değişim',
      render: (_, row) =>
        row.changePercent !== null ? (
          <span className={`flex items-center gap-1 ${getChangeColor(row.changePercent)}`}>
            {renderChangeIndicator(row.changePercent)}
            {Math.abs(row.changePercent)}%
          </span>
        ) : (
          '-'
        ),
    },
  ];

  const monthlyColumns: DataTableColumn<MonthlyRow>[] = [
    {
      key: 'current.period',
      header: 'Dönem',
      render: (_, row) => <span className="font-medium">{row.current.period}</span>,
    },
    { key: 'current.count', header: 'Task Sayısı', render: (_, row) => row.current.count },
    {
      key: 'current.dailyAverage',
      header: 'Günlük Ort.',
      render: (_, row) => row.current.dailyAverage,
    },
    {
      key: 'current.uniqueProjects',
      header: 'Proje Sayısı',
      render: (_, row) => row.current.uniqueProjects,
    },
    { key: 'previous.count', header: 'Önceki Ay', render: (_, row) => row.previous?.count || '-' },
    {
      key: 'changePercent',
      header: 'Değişim',
      render: (_, row) =>
        row.changePercent !== null ? (
          <span className={`flex items-center gap-1 ${getChangeColor(row.changePercent)}`}>
            {renderChangeIndicator(row.changePercent)}
            {row.changePercent > 0 ? '+' : ''}
            {row.changePercent}%
          </span>
        ) : (
          '-'
        ),
    },
    {
      key: 'projectChangePercent',
      header: 'Proje Değişimi',
      render: (_, row) =>
        row.projectChangePercent !== null ? (
          <span className={`flex items-center gap-1 ${getChangeColor(row.projectChangePercent)}`}>
            {renderChangeIndicator(row.projectChangePercent)}
            {row.projectChangePercent > 0 ? '+' : ''}
            {row.projectChangePercent}%
          </span>
        ) : (
          '-'
        ),
    },
  ];

  const yearlyColumns: DataTableColumn<YearlyRow>[] = [
    {
      key: 'year',
      header: 'Yıl',
      render: (_, row) => <span className="font-medium">{row.year}</span>,
    },
    { key: 'total', header: 'Toplam Task', render: (_, row) => row.total },
    { key: 'uniqueProjects', header: 'Proje Sayısı', render: (_, row) => row.uniqueProjects },
  ];

  return (
    <div className="space-y-6">
      {/* Explanation Section */}
      <InfoBox
        title="Trend Analizi Açıklaması"
        icon={<Info size={20} />}
        defaultExpanded={false}
        variant="info"
      >
        <div>
          <strong>📈 Aylık Karşılaştırma:</strong> Her ayın günlük ortalama task sayısını ve bir
          önceki aya göre değişimi gösterir. Artış kırmızı, azalış yeşil renkte gösterilir.
        </div>
        <div>
          <strong>📊 Çeyreklik Dağılım:</strong> Her çeyrekte gelen toplam task ve aylara göre
          dağılımı gösterir. Çeyrek sonlarında yoğunlaşma olup olmadığını analiz edebilirsiniz.
        </div>
        <div>
          <strong>🔄 Yıl Karşılaştırma:</strong> Farklı yılların aynı dönemlerini karşılaştırır.
          Örneğin 2025 Ocak ile 2026 Ocak arasındaki farkı görebilirsiniz.
        </div>
        <div>
          <strong>👥 Proje Çeşitliliği:</strong> Her dönemde kaç farklı projeden task geldiğini
          gösterir. Artış, daha fazla ekibin task açtığı anlamına gelir.
        </div>
      </InfoBox>

      {/* Header with PDF Export */}
      <div className="flex items-center justify-between">
        <TabNavigation
          tabs={views.map(view => ({
            id: view.id,
            label: view.label,
            icon: <Calendar size={16} />,
          }))}
          activeTab={activeView}
          onTabChange={id => setActiveView(id as ViewType)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setExporting(true);
            try {
              await exportTrendsToPdf(data);
            } finally {
              setExporting(false);
            }
          }}
          disabled={exporting}
          leftIcon={<Download size={16} />}
        >
          {exporting ? 'İndiriliyor...' : 'PDF İndir'}
        </Button>
      </div>

      {/* Summary Cards */}
      {activeView === 'monthly' && data.monthly.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.monthly.slice(-4).map((item, idx) => (
            <div key={idx} className="rounded-lg bg-white p-5 shadow">
              <div className="text-xs font-medium text-gray-500 uppercase">
                {item.current.period}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">{item.current.count}</div>
                {item.changePercent !== null && (
                  <div className={`flex items-center gap-1 ${getChangeColor(item.changePercent)}`}>
                    {renderChangeIndicator(item.changePercent)}
                    <span className="text-sm font-medium">{Math.abs(item.changePercent)}%</span>
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Günlük Ort: {item.current.dailyAverage} | {item.current.uniqueProjects} proje
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly View */}
      {activeView === 'weekly' && (
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Haftalık Task Trendi (Son 12 Hafta)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3B82F6" name="Task Sayısı" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="projects"
                  stroke="#10B981"
                  name="Proje Sayısı"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Haftalık Detay</h3>
            <DataTable
              data={data.weekly}
              columns={weeklyColumns}
              keyExtractor={(row, idx) => `week-${idx}`}
              emptyMessage="Veri bulunamadı"
            />
          </div>
        </div>
      )}

      {/* Monthly View */}
      {activeView === 'monthly' && (
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Aylık Task Trendi</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  stroke="#3B82F6"
                  name="Task Sayısı"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="dailyAvg"
                  stroke="#F59E0B"
                  name="Günlük Ortalama"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="projects"
                  stroke="#10B981"
                  name="Proje Sayısı"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Aylık Karşılaştırma Detay</h3>
            <DataTable
              data={data.monthly}
              columns={monthlyColumns}
              keyExtractor={(row, idx) => `month-${idx}`}
              emptyMessage="Veri bulunamadı"
            />
          </div>
        </div>
      )}

      {/* Quarterly View */}
      {activeView === 'quarterly' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Çeyreklik Task Sayıları</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={quarterlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3B82F6" name="Task Sayısı" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                Çeyreklik Proje Çeşitliliği
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={quarterlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="projects" fill="#10B981" name="Proje Sayısı" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Çeyrek İçi Aylık Dağılım (Sıkışma Analizi)
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Her çeyrekte taskların aylara nasıl dağıldığını gösterir. Son ayda yoğunlaşma varsa
              çeyrek sonu sıkışması olabilir.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.quarterly.map((q, idx) => (
                <div key={idx} className="rounded-lg border p-4">
                  <h4 className="mb-2 font-medium text-gray-900">
                    {q.year} {q.quarter}
                  </h4>
                  <div className="mb-3 text-sm text-gray-600">
                    Toplam: {q.count} task | {q.uniqueProjects} proje
                  </div>
                  <div className="space-y-2">
                    {q.months.map((m, mIdx) => (
                      <div key={mIdx} className="flex items-center gap-2">
                        <span className="w-16 text-xs text-gray-600">{m.month}</span>
                        <div className="h-4 flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full ${m.percent > 50 ? 'bg-red-500' : m.percent > 35 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                            style={{ width: `${m.percent}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-xs text-gray-700">
                          {m.count} ({m.percent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                  {q.months.some(m => m.percent > 50) && (
                    <div className="mt-2 text-xs font-medium text-red-600">
                      ⚠️ Çeyrek sonu sıkışması var!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Yearly View */}
      {activeView === 'yearly' && (
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Yıllık Özet</h3>
            <DataTable
              data={data.yearly}
              columns={yearlyColumns}
              keyExtractor={row => String(row.year)}
              emptyMessage="Veri bulunamadı"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.yearly.map((year, idx) => (
              <div key={idx} className="rounded-lg bg-white p-5 shadow">
                <div className="text-xs font-medium text-gray-500 uppercase">{year.year}</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{year.total}</div>
                <div className="mt-2 text-xs text-gray-500">
                  <Users size={12} className="mr-1 inline" />
                  {year.uniqueProjects} farklı proje
                </div>
              </div>
            ))}
          </div>

          {data.yearly.map((year, idx) => (
            <div key={idx} className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                {year.year} - Aylık Dağılım
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={year.months}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#3B82F6" name="Task Sayısı" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="uniqueProjects"
                    stroke="#10B981"
                    name="Proje Sayısı"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* Year-over-Year Comparison */}
      {activeView === 'yoy' && (
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Yıllara Göre Aylık Karşılaştırma
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Aynı ayların farklı yıllardaki task sayılarını karşılaştırır.
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={yoyMonthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                {years.map((year, idx) => (
                  <Bar
                    key={year}
                    dataKey={`${year}`}
                    fill={COLORS[idx % COLORS.length]}
                    name={`${year}`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Yıllara Göre Çeyreklik Karşılaştırma
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yoyQuarterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                {years.map((year, idx) => (
                  <Bar
                    key={year}
                    dataKey={`${year}`}
                    fill={COLORS[idx % COLORS.length]}
                    name={`${year}`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Proje Çeşitliliği Karşılaştırması (Aylık)
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Her ayda kaç farklı projeden task geldiğini yıllara göre karşılaştırır.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yoyMonthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                {years.map((year, idx) => (
                  <Line
                    key={year}
                    type="monotone"
                    dataKey={`${year}_projects`}
                    stroke={COLORS[idx % COLORS.length]}
                    name={`${year} Proje`}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Yıl Bazlı Detaylı Karşılaştırma
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ay</th>
                    {years.map(year => (
                      <th
                        key={year}
                        className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                        colSpan={2}
                      >
                        {year}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400"></th>
                    {years.map(year => (
                      <React.Fragment key={year}>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">
                          Task
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">
                          Proje
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.yearOverYear.monthComparisons.map((m, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.month}</td>
                      {m.years.map(y => (
                        <React.Fragment key={y.year}>
                          <td className="px-4 py-3 text-sm text-gray-700">{y.count}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{y.uniqueProjects}</td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
