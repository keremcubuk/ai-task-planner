import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { ProgressBar } from './ui';
import { ReviewScoreSummary } from '../lib/api';

interface ReviewScoreCardProps {
  score: ReviewScoreSummary;
  onClick: () => void;
}

const getStatusConfig = (status: string, overallScore: number) => {
  if (status === 'good' || overallScore >= 85) {
    return {
      emoji: '🟢',
      label: 'İyi',
      bg: 'bg-green-50 border-green-200 hover:shadow-md',
      scoreBg: 'bg-green-100 text-green-800',
      progressFill: 'bg-green-500',
      icon: <TrendingUp size={16} className="text-green-600" />,
    };
  }
  if (status === 'warning' || overallScore >= 60) {
    return {
      emoji: '🟡',
      label: 'İyileştirme Gerekli',
      bg: 'bg-yellow-50 border-yellow-200 hover:shadow-md',
      scoreBg: 'bg-yellow-100 text-yellow-800',
      progressFill: 'bg-yellow-500',
      icon: <AlertTriangle size={16} className="text-yellow-600" />,
    };
  }
  return {
    emoji: '🔴',
    label: 'Kritik',
    bg: 'bg-red-50 border-red-200 hover:shadow-md',
    scoreBg: 'bg-red-100 text-red-800',
    progressFill: 'bg-red-500',
    icon: <TrendingDown size={16} className="text-red-600" />,
  };
};

export const ReviewScoreCard: React.FC<ReviewScoreCardProps> = ({ score, onClick }) => {
  const config = getStatusConfig(score.status, score.overallScore);
  const reportDate = new Date(score.reportDate).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className={`cursor-pointer rounded-lg border shadow transition-shadow ${config.bg}`}
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="truncate text-lg font-semibold text-gray-900" title={score.projectName}>
            {score.projectName}
          </h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${config.scoreBg}`}
          >
            {score.overallScore}/100
          </span>
        </div>

        {/* Status */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          {config.icon}
          <span>{config.label}</span>
          <span className="ml-auto text-gray-400">{reportDate}</span>
        </div>

        {/* Overall progress bar */}
        <div className="mb-4">
          <ProgressBar
            value={score.overallScore}
            color={score.overallScore >= 70 ? 'green' : score.overallScore >= 40 ? 'yellow' : 'red'}
            size="lg"
          />
        </div>

        {/* Category mini bars */}
        {score.categorySummary.length > 0 && (
          <div className="space-y-1.5">
            {score.categorySummary.slice(0, 4).map(cat => {
              const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
              return (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <span className="w-28 truncate text-gray-500" title={cat.name}>
                    {cat.name}
                  </span>
                  <div className="h-1.5 flex-1 rounded-full bg-gray-200">
                    <div
                      className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-gray-500">
                    {cat.score}/{cat.maxScore}
                  </span>
                </div>
              );
            })}
            {score.categorySummary.length > 4 && (
              <p className="text-right text-xs text-gray-400">
                +{score.categorySummary.length - 4} more categories
              </p>
            )}
          </div>
        )}

        {/* Linked project */}
        {score.projectId && (
          <div className="mt-3 border-t border-gray-200/60 pt-3">
            <span className="text-xs text-gray-400">🔗 Linked to project tasks</span>
          </div>
        )}
      </div>
    </div>
  );
};
