import React from 'react';
import { ComponentAnalysisSection } from '../ComponentAnalysisSection';
import { ComponentAnalysisResult, OllamaStatus } from '../../lib/api';
import { StatCard, StatCardGrid, DataTable, DataTableColumn, ProgressBar } from '../ui';

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

  interface BucketRow {
    component: string;
    stats: ComponentBucketStats;
  }

  const bucketColumns: DataTableColumn<BucketRow>[] = [
    {
      key: 'component',
      header: 'Component',
      render: (_, row) => (
        <span className="font-medium text-gray-900">{row.component}</span>
      ),
    },
    {
      key: 'stats.total',
      header: 'Toplam',
      render: (_, row) => row.stats.total,
    },
    {
      key: 'solvedInProject',
      header: 'Projede Çözülen',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-bold">{row.stats.bucketBreakdown.solvedInProject}</span>
          <ProgressBar
            value={row.stats.solvedInProjectPercent}
            color="green"
            size="md"
            showLabel
            labelPosition="right"
            labelClassName="text-xs"
            width="w-16"
          />
        </div>
      ),
    },
    {
      key: 'solvedInComponent',
      header: 'Componentte Çözülen',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <span className="text-blue-600 font-bold">{row.stats.bucketBreakdown.solvedInComponent}</span>
          <ProgressBar
            value={row.stats.solvedInComponentPercent}
            color="blue"
            size="md"
            showLabel
            labelPosition="right"
            labelClassName="text-xs"
            width="w-16"
          />
        </div>
      ),
    },
    {
      key: 'design',
      header: 'Tasarım',
      render: (_, row) => (
        <span className="text-purple-600">{row.stats.bucketBreakdown.design}</span>
      ),
    },
    {
      key: 'declined',
      header: 'Declined',
      render: (_, row) => row.stats.bucketBreakdown.declined,
    },
    {
      key: 'other',
      header: 'Diğer',
      render: (_, row) => row.stats.bucketBreakdown.other + row.stats.bucketBreakdown.none,
    },
  ];

  type SupportFinding = typeof componentSupportFindings[number];

  const supportColumns: DataTableColumn<SupportFinding>[] = [
    {
      key: 'component',
      header: 'Component',
      render: (_, row) => (
        <span className="font-medium text-gray-900">{row.component}</span>
      ),
    },
    {
      key: 'total',
      header: 'Toplam',
    },
    {
      key: 'solvedInProjectPercent',
      header: 'Projede %',
      render: (_, row) => (
        <span className="text-green-700 font-medium">{row.solvedInProjectPercent}%</span>
      ),
    },
    {
      key: 'solvedInComponentPercent',
      header: 'Componentte %',
      render: (_, row) => (
        <span className="text-blue-700 font-medium">{row.solvedInComponentPercent}%</span>
      ),
    },
    {
      key: 'declinedPlusDesignPercent',
      header: 'Declined+Tasarım %',
      render: (_, row) => (
        <span className="text-purple-700 font-medium">{row.declinedPlusDesignPercent}%</span>
      ),
    },
    {
      key: 'reasons',
      header: 'Aksiyon',
      render: (_, row) => (
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
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <StatCardGrid columns={2}>
        <StatCard label="Projede Çözülen" value={totalSolvedInProject} valueColor="green" />
        <StatCard label="Componentte Çözülen" value={totalSolvedInComponent} valueColor="blue" />
      </StatCardGrid>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Component Bucket Analizi</h3>
        <p className="text-sm text-gray-500 mb-4">
          Her component için ticketların % kaçı projede çözüldü, % kaçı componentte çözüldü.
        </p>
        <DataTable
          data={Object.entries(byComponentBucket)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([component, stats]) => ({ component, stats }))}
          columns={bucketColumns}
          keyExtractor={(row) => row.component}
          emptyMessage="Component bulunamadı"
        />
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
                  <ProgressBar
                    value={item.percent}
                    color="green"
                    size="md"
                    showLabel
                    labelPosition="right"
                    labelClassName="text-xs"
                  />
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
                  <ProgressBar
                    value={item.percent}
                    color="blue"
                    size="md"
                    showLabel
                    labelPosition="right"
                    labelClassName="text-xs"
                  />
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
          <DataTable
            data={componentSupportFindings}
            columns={supportColumns}
            keyExtractor={(row) => row.component}
            emptyMessage="Uyarı üreten component bulunamadı"
          />
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
