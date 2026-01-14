import React from 'react';
import { ComponentAnalysisSection } from '../ComponentAnalysisSection';
import { ComponentAnalysisResult, OllamaStatus } from '../../lib/api';

interface BucketBreakdown {
  solvedInComponent: number;
  solvedInProject: number;
  declined: number;
  design: number;
  other: number;
  none: number;
}

interface ComponentBucketStats {
  total: number;
  bucketBreakdown: BucketBreakdown;
  solvedInProjectPercent: number;
  solvedInComponentPercent: number;
}

interface ComponentsTabProps {
  byComponentBucket: Record<string, ComponentBucketStats>;
  ollamaStatus: OllamaStatus | null;
  useOllama: boolean;
  setUseOllama: (value: boolean) => void;
  loadComponentAnalysis: () => void;
  componentLoading: boolean;
  componentData: ComponentAnalysisResult | null;
  expandedComponents: Set<string>;
  toggleComponentExpand: (componentName: string) => void;
  onTaskClick: (taskId: number) => void;
}

export function ComponentsTab({
  byComponentBucket,
  ollamaStatus,
  useOllama,
  setUseOllama,
  loadComponentAnalysis,
  componentLoading,
  componentData,
  expandedComponents,
  toggleComponentExpand,
  onTaskClick,
}: ComponentsTabProps) {
  const totalSolvedInProject = Object.values(byComponentBucket).reduce(
    (sum, stats) => sum + stats.bucketBreakdown.solvedInProject,
    0
  );
  const totalSolvedInComponent = Object.values(byComponentBucket).reduce(
    (sum, stats) => sum + stats.bucketBreakdown.solvedInComponent,
    0
  );

  const topSolvedInProject = Object.entries(byComponentBucket)
    .map(([component, stats]) => ({
      component,
      count: stats.bucketBreakdown.solvedInProject,
      total: stats.total,
      percent: stats.solvedInProjectPercent,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topSolvedInComponent = Object.entries(byComponentBucket)
    .map(([component, stats]) => ({
      component,
      count: stats.bucketBreakdown.solvedInComponent,
      total: stats.total,
      percent: stats.solvedInComponentPercent,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const MIN_TICKETS_FOR_COMPONENT_ANALYSIS = 15;
  const THRESHOLD_PERCENT = 50;

  const componentSupportFindings = Object.entries(byComponentBucket)
    .map(([component, stats]) => {
      const total = stats.total;
      const solvedInProject = stats.bucketBreakdown.solvedInProject;
      const solvedInComponent = stats.bucketBreakdown.solvedInComponent;
      const declinedPlusDesign =
        stats.bucketBreakdown.declined + stats.bucketBreakdown.design;

      const solvedInProjectPercent = total > 0 ? (solvedInProject / total) * 100 : 0;
      const solvedInComponentPercent = total > 0 ? (solvedInComponent / total) * 100 : 0;
      const declinedPlusDesignPercent =
        total > 0 ? (declinedPlusDesign / total) * 100 : 0;

      const reasons: Array<
        'docs' | 'refactor' | 'stakeholder'
      > = [];
      if (solvedInProjectPercent > THRESHOLD_PERCENT) reasons.push('docs');
      if (solvedInComponentPercent > THRESHOLD_PERCENT) reasons.push('refactor');
      if (declinedPlusDesignPercent > THRESHOLD_PERCENT) reasons.push('stakeholder');

      const strongestSignal = Math.max(
        solvedInProjectPercent,
        solvedInComponentPercent,
        declinedPlusDesignPercent,
      );

      return {
        component,
        total,
        solvedInProject,
        solvedInComponent,
        declinedPlusDesign,
        solvedInProjectPercent: Math.round(solvedInProjectPercent),
        solvedInComponentPercent: Math.round(solvedInComponentPercent),
        declinedPlusDesignPercent: Math.round(declinedPlusDesignPercent),
        strongestSignal,
        reasons,
      };
    })
    .filter((x) => x.total >= MIN_TICKETS_FOR_COMPONENT_ANALYSIS)
    .filter((x) => x.reasons.length > 0)
    .sort((a, b) => b.strongestSignal - a.strongestSignal);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Projede Çözülen</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{totalSolvedInProject}</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="text-gray-500 text-xs font-medium uppercase">Componentte Çözülen</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{totalSolvedInComponent}</div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Component Bucket Analizi</h3>
        <p className="text-sm text-gray-500 mb-4">
          Her component için ticketların % kaçı projede çözüldü, % kaçı componentte çözüldü.
        </p>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Component</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Toplam</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Projede Çözülen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Componentte Çözülen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Tasarım</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Declined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky top-0 bg-gray-50 z-10">Diğer</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(byComponentBucket)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([component, stats]) => (
                  <tr key={component}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{component}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{stats.total}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">{stats.bucketBreakdown.solvedInProject}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.solvedInProjectPercent}%` }} />
                        </div>
                        <span className="text-gray-500 text-xs">{stats.solvedInProjectPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-bold">{stats.bucketBreakdown.solvedInComponent}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.solvedInComponentPercent}%` }} />
                        </div>
                        <span className="text-gray-500 text-xs">{stats.solvedInComponentPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-600">{stats.bucketBreakdown.design}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{stats.bucketBreakdown.declined}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {stats.bucketBreakdown.other + stats.bucketBreakdown.none}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top 10 - Projede Çözülen</h3>
          <div className="space-y-3">
            {topSolvedInProject.map((item, idx) => (
              <div key={item.component} className="flex items-center gap-3">
                <span className="text-gray-400 w-6 text-sm">{idx + 1}.</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-900 font-medium text-sm">{item.component}</span>
                    <span className="text-green-600 font-bold text-sm">{item.count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <span className="text-gray-500 text-xs w-12 text-right">{item.percent}%</span>
                  </div>
                </div>
              </div>
            ))}
            {topSolvedInProject.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Veri bulunamadı</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top 10 - Componentte Çözülen</h3>
          <div className="space-y-3">
            {topSolvedInComponent.map((item, idx) => (
              <div key={item.component} className="flex items-center gap-3">
                <span className="text-gray-400 w-6 text-sm">{idx + 1}.</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-900 font-medium text-sm">{item.component}</span>
                    <span className="text-blue-600 font-bold text-sm">{item.count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <span className="text-gray-500 text-xs w-12 text-right">{item.percent}%</span>
                  </div>
                </div>
              </div>
            ))}
            {topSolvedInComponent.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Veri bulunamadı</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-1">Component Destek / Refactor Analizi</h3>
        <p className="text-sm text-gray-600 mb-4">
          Bu analiz sadece <span className="font-semibold">{MIN_TICKETS_FOR_COMPONENT_ANALYSIS}+</span> ticket olan componentler için yapılır.
          <br />
          <span className="font-medium">%{THRESHOLD_PERCENT}+ Projede Çözüldü</span>: Doküman/Demo desteği artır.
          <span className="mx-2">•</span>
          <span className="font-medium">%{THRESHOLD_PERCENT}+ Componentte Çözüldü</span>: Refactor/ameliyat gerekli.
          <span className="mx-2">•</span>
          <span className="font-medium">%{THRESHOLD_PERCENT}+ (Declined+Tasarım)</span>: İlgili birimle konuş.
        </p>

        {componentSupportFindings.length === 0 ? (
          <div className="text-sm text-gray-600">Bu kriterlerle uyarı üreten component bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase sticky top-0 bg-gray-50 z-10">Component</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase sticky top-0 bg-gray-50 z-10">Toplam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase sticky top-0 bg-gray-50 z-10">Projede %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase sticky top-0 bg-gray-50 z-10">Componentte %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase sticky top-0 bg-gray-50 z-10">Declined+Tasarım %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase sticky top-0 bg-gray-50 z-10">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {componentSupportFindings.map((row) => (
                  <tr key={row.component}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.component}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{row.total}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-700 font-medium">
                      {row.solvedInProjectPercent}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-700 font-medium">
                      {row.solvedInComponentPercent}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-700 font-medium">
                      {row.declinedPlusDesignPercent}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex flex-wrap gap-2">
                        {row.reasons.includes('docs') && (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 border border-green-200">
                            Doküman/Demo
                          </span>
                        )}
                        {row.reasons.includes('refactor') && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                            Refactor
                          </span>
                        )}
                        {row.reasons.includes('stakeholder') && (
                          <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                            İlgili Birim
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ComponentAnalysisSection
        ollamaStatus={ollamaStatus}
        useOllama={useOllama}
        setUseOllama={setUseOllama}
        loadComponentAnalysis={loadComponentAnalysis}
        componentLoading={componentLoading}
        componentData={componentData}
        expandedComponents={expandedComponents}
        toggleComponentExpand={toggleComponentExpand}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
