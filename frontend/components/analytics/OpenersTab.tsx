import React, { useState } from 'react';
import { Search, Info } from 'lucide-react';
import {
  InfoBox,
  InputField,
  InputSelect,
  StatCard,
  StatCardGrid,
  DataTable,
  DataTableColumn,
  ProgressBar,
} from '../ui';
import { TicketsModalContent } from './TicketsModalContent';

interface BucketBreakdown {
  solvedInComponent: number;
  solvedInProject: number;
  declined: number;
  design: number;
  other: number;
  none: number;
}

interface OpenedByStats {
  total: number;
  issuesPerWeek: number;
  last30Days: number;
  bucketBreakdown: BucketBreakdown;
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

interface OpenersTabProps {
  byOpenedBy: Record<string, OpenedByStats>;
  byBucketCategory: BucketBreakdown;
  openerComments: Record<string, string>;
  onCommentChange: (openedBy: string, value: string) => void;
  onTaskClick: (taskId: number) => void;
}

const sortOptions = [
  { value: 'total', label: 'Toplam Ticket' },
  { value: 'completion', label: 'Tamamlanma %' },
  { value: 'quality', label: 'Kalite Skoru' },
  { value: 'diversity', label: 'Çeşitlilik' },
];

export function OpenersTab({
  byOpenedBy,
  byBucketCategory,
  openerComments,
  onCommentChange,
  onTaskClick,
}: OpenersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'total' | 'completion' | 'quality' | 'diversity'>('total');
  const [selectedOpener, setSelectedOpener] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openedByEntries = Object.entries(byOpenedBy)
    .filter(([opener]) => opener !== 'unknown')
    .filter(([opener]) => opener.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'completion':
          return b[1].completionRate - a[1].completionRate;
        case 'quality':
          return b[1].qualityScore - a[1].qualityScore;
        case 'diversity':
          return b[1].componentDiversity - a[1].componentDiversity;
        default:
          return b[1].total - a[1].total;
      }
    });
  const openerCount = Object.keys(byOpenedBy).filter(o => o !== 'unknown').length;

  const handleComponentClick = (opener: string, component: string) => {
    setSelectedOpener(opener);
    setSelectedComponent(component);
    setModalOpen(true);
  };

  const handleOpenerClick = (opener: string) => {
    setSelectedOpener(opener);
    setSelectedComponent(null);
    setModalOpen(true);
  };

  interface OpenerRow {
    openedBy: string;
    stats: OpenedByStats;
  }

  const detailColumns: DataTableColumn<OpenerRow>[] = [
    {
      key: 'openedBy',
      header: 'Açan Kişi',
      className: 'max-w-[180px]',
      render: (_, row) => (
        <span
          className="block cursor-pointer truncate font-medium text-blue-600 hover:underline"
          title={row.openedBy}
          onClick={e => {
            e.stopPropagation();
            handleOpenerClick(row.openedBy);
          }}
        >
          {row.openedBy}
        </span>
      ),
    },
    { key: 'stats.total', header: 'Toplam', render: (_, row) => row.stats.total },
    {
      key: 'issuesPerWeek',
      header: 'Haftalık',
      render: (_, row) => row.stats.issuesPerWeek.toFixed(1),
    },
    { key: 'last30Days', header: 'Son 30 Gün', render: (_, row) => row.stats.last30Days },
    {
      key: 'solvedInProject',
      header: 'Projede Çözülen',
      render: (_, row) => (
        <span className="text-green-600">{row.stats.bucketBreakdown.solvedInProject}</span>
      ),
    },
    {
      key: 'solvedInComponent',
      header: 'Componentte Çözülen',
      render: (_, row) => (
        <span className="text-blue-600">{row.stats.bucketBreakdown.solvedInComponent}</span>
      ),
    },
    { key: 'declined', header: 'Declined', render: (_, row) => row.stats.bucketBreakdown.declined },
    { key: 'design', header: 'Tasarım', render: (_, row) => row.stats.bucketBreakdown.design },
    {
      key: 'comment',
      header: 'Not',
      className: 'min-w-[200px]',
      render: (_, row) => (
        <input
          className="w-full rounded-md border border-gray-300 p-1.5 text-sm text-gray-900 shadow-sm"
          value={openerComments[row.openedBy] || ''}
          onChange={e => onCommentChange(row.openedBy, e.target.value)}
          onClick={e => e.stopPropagation()}
          placeholder="Not ekle..."
        />
      ),
    },
  ];

  const qualityColumns: DataTableColumn<OpenerRow>[] = [
    {
      key: 'openedBy',
      header: 'Açan Kişi',
      className: 'max-w-[180px]',
      render: (_, row) => (
        <span
          className="block cursor-pointer truncate font-medium text-blue-600 hover:underline"
          title={row.openedBy}
          onClick={e => {
            e.stopPropagation();
            handleOpenerClick(row.openedBy);
          }}
        >
          {row.openedBy}
        </span>
      ),
    },
    { key: 'stats.total', header: 'Toplam', render: (_, row) => row.stats.total },
    {
      key: 'completionRate',
      header: 'Tamamlanma %',
      render: (_, row) => (
        <ProgressBar
          value={row.stats.completionRate}
          color="green"
          size="md"
          showLabel
          labelPosition="right"
          labelClassName="font-medium"
          width="w-16"
        />
      ),
    },
    {
      key: 'qualityScore',
      header: 'Kalite',
      render: (_, row) => (
        <ProgressBar
          value={row.stats.qualityScore}
          color={
            row.stats.qualityScore >= 70 ? 'green' : row.stats.qualityScore >= 40 ? 'yellow' : 'red'
          }
          size="md"
          showLabel
          labelPosition="right"
          labelClassName="font-medium"
          width="w-16"
        />
      ),
    },
    {
      key: 'componentDiversity',
      header: 'Çeşitlilik',
      render: (_, row) => `${row.stats.componentDiversity}%`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Explanation Section */}
      <InfoBox
        title="Metriklerin Anlamı"
        icon={<Info size={20} />}
        defaultExpanded={false}
        variant="info"
      >
        <div>
          <strong>📊 Tamamlanma Oranı:</strong> Kişinin açtığı ticketların ne kadarının çözüldüğü
          (Projede + Componentte çözülen / Toplam). Yüksek oran = Çözülebilir issueler açıyor.
        </div>
        <div>
          <strong>💎 Kalite Skoru:</strong> Açılan ticketların niteliğini gösterir. Componentte
          çözülenler yüksek puan, projede çözülenler düşük puan getirir.
          <ul>
            <li>🟢 70 ve üzeri: Yüksek kalite</li>
            <li>🟡 40-69: Orta kalite</li>
            <li>🔴 39 ve altı: Düşük kalite (Özel Destek İhtiyacı)</li>
          </ul>
          Yüksek skor = Componentte çözülen, nitelikli issue.
        </div>
        <div>
          <strong>🎯 Çeşitlilik:</strong> Kaç farklı componentte issue açıldığı (Unique component /
          Toplam × 100). Düşük = Belirli alana odaklı, Yüksek = Geniş yelpaze.
        </div>
        <div>
          <strong>⚠️ Takıldığı Componentler:</strong> Aynı componentte sıkça (3 veya daha fazla)
          &quot;Projede Çözüldü&quot; veya &quot;Open&quot; statüsünde ticket açılması durumudur. Bu
          componentlerde sıkça problem yaşanıyor.
        </div>
        <div>
          <strong>✅ Projede Çözülen Componentler:</strong> Projede çözülme oranı yüksek
          componentler. Bu componentlerde açılan issueler genelde projede çözülüyor.
        </div>
      </InfoBox>

      {/* Search and Filter Controls */}
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col gap-4 sm:flex-row">
          <InputField
            type="search"
            placeholder="Kişi ara..."
            value={searchTerm}
            onChange={setSearchTerm}
            icon={<Search size={20} />}
            iconPosition="left"
            className="flex-1"
          />
          <InputSelect
            value={sortBy}
            onChange={value => setSortBy(value as 'total' | 'completion' | 'quality' | 'diversity')}
            options={sortOptions}
            className="min-w-[150px]"
          />
        </div>
        <div className="mt-2 text-sm text-gray-700">{openedByEntries.length} kişi gösteriliyor</div>
      </div>

      <StatCardGrid columns={4}>
        <StatCard label="Issue Açan Kişi" value={openerCount} />
        <StatCard
          label="Projede Çözülen"
          value={byBucketCategory.solvedInProject}
          valueColor="green"
        />
        <StatCard
          label="Componentte Çözülen"
          value={byBucketCategory.solvedInComponent}
          valueColor="blue"
        />
        <StatCard label="Declined" value={byBucketCategory.declined} />
      </StatCardGrid>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Issue Açanlar Detay</h3>
        <DataTable
          data={openedByEntries.map(([openedBy, stats]) => ({ openedBy, stats }))}
          columns={detailColumns}
          keyExtractor={row => row.openedBy}
          emptyMessage="Veri bulunamadı"
        />
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Kalite ve Çeşitlilik Analizi</h3>
        <DataTable
          data={openedByEntries.map(([openedBy, stats]) => ({ openedBy, stats }))}
          columns={qualityColumns}
          keyExtractor={row => row.openedBy}
          emptyMessage="Veri bulunamadı"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {openedByEntries.slice(0, 10).map(([openedBy, stats]) => (
          <div key={openedBy} className="rounded-lg bg-white p-6 shadow">
            <h3
              className="mb-4 cursor-pointer truncate text-lg font-medium text-blue-600 hover:underline"
              title={openedBy}
              onClick={() => handleOpenerClick(openedBy)}
            >
              {openedBy}
            </h3>

            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xs text-gray-500">Tamamlanma</div>
                <div className="text-xl font-bold text-green-600">{stats.completionRate}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Kalite</div>
                <div
                  className={`text-xl font-bold ${stats.qualityScore >= 70 ? 'text-green-600' : stats.qualityScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}
                >
                  {stats.qualityScore}%
                </div>
                {stats.qualityScore < 40 && (
                  <div className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    Özel Destek İhtiyacı
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Çeşitlilik</div>
                <div className="text-xl font-bold text-gray-700">{stats.componentDiversity}%</div>
              </div>
            </div>

            <div className="space-y-4">
              {stats.stuckComponents.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-red-600">
                    ⚠️ Takıldığı Componentler
                  </h4>
                  <div className="space-y-2">
                    {stats.stuckComponents.map(item => (
                      <div
                        key={item.component}
                        className="cursor-pointer rounded bg-red-50 p-2 text-xs transition-colors hover:bg-red-100"
                        onClick={() => handleComponentClick(openedBy, item.component)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 hover:text-blue-600">
                            {item.component}
                          </span>
                          <span className="font-bold text-red-600">{item.stuckCount} kez</span>
                        </div>
                        <div className="mt-1 text-gray-500">
                          {item.total} ticket • {item.solvedInProject} projede • {item.open} açık
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.solvedInProjectComponents.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-green-600">
                    ✅ Projede Çözülen Componentler
                  </h4>
                  <div className="space-y-2">
                    {stats.solvedInProjectComponents.map(item => (
                      <div
                        key={item.component}
                        className="cursor-pointer rounded bg-green-50 p-2 text-xs transition-colors hover:bg-green-100"
                        onClick={() => handleComponentClick(openedBy, item.component)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 hover:text-blue-600">
                            {item.component}
                          </span>
                          <span className="font-bold text-green-600">{item.solvedRate}%</span>
                        </div>
                        <div className="mt-1 text-gray-500">
                          {item.total} ticket • {item.solvedInProject} projede çözüldü
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.topComponents.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-blue-600">
                    📊 En Çok Açtığı Componentler
                  </h4>
                  <div className="space-y-1">
                    {stats.topComponents.slice(0, 5).map((item, idx) => (
                      <div
                        key={item.component}
                        className="flex cursor-pointer items-center gap-2 rounded p-1 text-xs transition-colors hover:bg-blue-50"
                        onClick={() => handleComponentClick(openedBy, item.component)}
                      >
                        <span className="w-4 text-gray-400">{idx + 1}.</span>
                        <span className="flex-1 font-medium text-gray-900 hover:text-blue-600">
                          {item.component}
                        </span>
                        <span className="text-gray-600">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tickets Modal */}
      <TicketsModalContent
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedOpener(null);
          setSelectedComponent(null);
        }}
        openedBy={selectedOpener || undefined}
        component={selectedComponent || undefined}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
