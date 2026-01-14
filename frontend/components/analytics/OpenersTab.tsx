import React, { useState } from 'react';
import { Search, Info, ChevronDown, ChevronUp } from 'lucide-react';
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

export function OpenersTab({
  byOpenedBy,
  byBucketCategory,
  openerComments,
  onCommentChange,
  onTaskClick,
}: OpenersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
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
  const openerCount = Object.keys(byOpenedBy).filter((o) => o !== 'unknown').length;

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

  return (
    <div className="space-y-6">
      {/* Explanation Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-2 w-full text-left"
        >
          <Info size={20} className="text-blue-600" />
          <span className="font-medium text-blue-900">Metriklerin Anlamı</span>
          {showExplanation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {showExplanation && (
          <div className="mt-4 space-y-3 text-sm text-blue-900">
            <div>
              <strong>📊 Tamamlanma Oranı:</strong> Kişinin açtığı ticketların ne kadarının çözüldüğü (Projede + Componentte çözülen / Toplam). Yüksek oran = Çözülebilir issueler açıyor.
            </div>
            <div>
              <strong>💎 Kalite Skoru:</strong> Açılan ticketların niteliğini gösterir. Componentte çözülenler yüksek puan, projede çözülenler düşük puan getirir. 
              <ul>
                <li>🟢 70 ve üzeri: Yüksek kalite</li>
                <li>🟡 40-69: Orta kalite</li>
                <li>🔴 39 ve altı: Düşük kalite (Kara Liste Adayı)</li>
              </ul>
              Yüksek skor = Componentte çözülen, nitelikli issue.
            </div>
            <div>
              <strong>🎯 Çeşitlilik:</strong> Kaç farklı componentte issue açıldığı (Unique component / Toplam × 100). Düşük = Belirli alana odaklı, Yüksek = Geniş yelpaze.
            </div>
            <div>
              <strong>⚠️ Takıldığı Componentler:</strong> Aynı componentte sıkça (3 veya daha fazla) &quot;Projede Çözüldü&quot; veya &quot;Open&quot; statüsünde ticket açılması durumudur. Bu componentlerde sıkça problem yaşanıyor.
            </div>
            <div>
              <strong>✅ Projede Çözülen Componentler:</strong> Projede çözülme oranı yüksek componentler. Bu componentlerde açılan issueler genelde projede çözülüyor.
            </div>
          </div>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Kişi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'total' | 'completion' | 'quality' | 'diversity')}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="total">Toplam Ticket</option>
              <option value="completion">Tamamlanma %</option>
              <option value="quality">Kalite Skoru</option>
              <option value="diversity">Çeşitlilik</option>
            </select>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-700">
          {openedByEntries.length} kişi gösteriliyor
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Issue Açan Kişi</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{openerCount}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Projede Çözülen</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{byBucketCategory.solvedInProject}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Componentte Çözülen</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{byBucketCategory.solvedInComponent}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Declined</div>
          <div className="text-3xl font-bold text-gray-600 mt-2">{byBucketCategory.declined}</div>
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
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Haftalık</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Son 30 Gün</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Projede Çözülen</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Componentte Çözülen</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Declined</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Tasarım</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Not</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {openedByEntries.map(([openedBy, stats]) => (
                <tr key={openedBy} className="hover:bg-gray-50">
                  <td 
                    className="px-3 py-3 whitespace-nowrap text-sm font-medium text-blue-600 max-w-[180px] truncate cursor-pointer hover:underline" 
                    title={openedBy}
                    onClick={() => handleOpenerClick(openedBy)}
                  >
                    {openedBy}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{stats.total}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{stats.issuesPerWeek.toFixed(1)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{stats.last30Days}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-green-600">{stats.bucketBreakdown.solvedInProject}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-blue-600">{stats.bucketBreakdown.solvedInComponent}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{stats.bucketBreakdown.declined}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{stats.bucketBreakdown.design}</td>
                  <td className="px-3 py-3 text-sm text-gray-700 min-w-[200px]">
                    <input
                      className="w-full border-gray-300 rounded-md shadow-sm p-1.5 border text-gray-900 text-sm"
                      value={openerComments[openedBy] || ''}
                      onChange={(e) => onCommentChange(openedBy, e.target.value)}
                      placeholder="Not ekle..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Kalite ve Çeşitlilik Analizi</h3>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Açan Kişi</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Toplam</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Tamamlanma %</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Kalite</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Çeşitlilik</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {openedByEntries.map(([openedBy, stats]) => (
                <tr key={openedBy} className="hover:bg-gray-50">
                  <td 
                    className="px-3 py-3 whitespace-nowrap text-sm font-medium text-blue-600 max-w-[180px] truncate cursor-pointer hover:underline" 
                    title={openedBy}
                    onClick={() => handleOpenerClick(openedBy)}
                  >
                    {openedBy}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{stats.total}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.completionRate}%` }} />
                      </div>
                      <span className="text-green-600 font-medium">{stats.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${stats.qualityScore >= 70 ? 'bg-green-600' : stats.qualityScore >= 40 ? 'bg-yellow-500' : 'bg-red-600'}`} 
                          style={{ width: `${stats.qualityScore}%` }} 
                        />
                      </div>
                      <span className={`font-medium ${stats.qualityScore >= 70 ? 'text-green-600' : stats.qualityScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {stats.qualityScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{stats.componentDiversity}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {openedByEntries.slice(0, 10).map(([openedBy, stats]) => (
          <div key={openedBy} className="bg-white p-6 rounded-lg shadow">
            <h3 
              className="text-lg font-medium text-blue-600 mb-4 truncate cursor-pointer hover:underline" 
              title={openedBy}
              onClick={() => handleOpenerClick(openedBy)}
            >
              {openedBy}
            </h3>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="text-xs text-gray-500">Tamamlanma</div>
                <div className="text-xl font-bold text-green-600">{stats.completionRate}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Kalite</div>
                <div className={`text-xl font-bold ${stats.qualityScore >= 70 ? 'text-green-600' : stats.qualityScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.qualityScore}%
                </div>
                {stats.qualityScore < 40 && (
                  <div className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                    Kara Liste Adayı
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
                  <h4 className="text-sm font-medium text-red-600 mb-2">⚠️ Takıldığı Componentler</h4>
                  <div className="space-y-2">
                    {stats.stuckComponents.map((item) => (
                      <div 
                        key={item.component} 
                        className="text-xs bg-red-50 p-2 rounded cursor-pointer hover:bg-red-100 transition-colors"
                        onClick={() => handleComponentClick(openedBy, item.component)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 hover:text-blue-600">{item.component}</span>
                          <span className="text-red-600 font-bold">{item.stuckCount} kez</span>
                        </div>
                        <div className="text-gray-500 mt-1">
                          {item.total} ticket • {item.solvedInProject} projede • {item.open} açık
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.solvedInProjectComponents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">✅ Projede Çözülen Componentler</h4>
                  <div className="space-y-2">
                    {stats.solvedInProjectComponents.map((item) => (
                      <div 
                        key={item.component} 
                        className="text-xs bg-green-50 p-2 rounded cursor-pointer hover:bg-green-100 transition-colors"
                        onClick={() => handleComponentClick(openedBy, item.component)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 hover:text-blue-600">{item.component}</span>
                          <span className="text-green-600 font-bold">{item.solvedRate}%</span>
                        </div>
                        <div className="text-gray-500 mt-1">
                          {item.total} ticket • {item.solvedInProject} projede çözüldü
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.topComponents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-blue-600 mb-2">📊 En Çok Açtığı Componentler</h4>
                  <div className="space-y-1">
                    {stats.topComponents.slice(0, 5).map((item, idx) => (
                      <div 
                        key={item.component} 
                        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-blue-50 p-1 rounded transition-colors"
                        onClick={() => handleComponentClick(openedBy, item.component)}
                      >
                        <span className="text-gray-400 w-4">{idx + 1}.</span>
                        <span className="font-medium text-gray-900 flex-1 hover:text-blue-600">{item.component}</span>
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
