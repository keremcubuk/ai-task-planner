'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  History,
  Trash2,
  GitCompare,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import {
  getReviewScoreDetail,
  getReviewScoreHistory,
  deleteReviewScore,
  ReviewScoreDetail,
  ReviewScoreSummary,
  ReviewScoreCategory,
  ReviewScoreCriticalIssue,
  ReviewScoreStrength,
  ReviewScoreClosedIssue,
  ReviewScoreRemainingIssue,
} from '../../../lib/api';

type Tab = 'overview' | 'closed' | 'remaining' | 'history' | 'raw';

export default function ProjectReviewScoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectName = params?.projectName as string;
  const [detail, setDetail] = useState<ReviewScoreDetail | null>(null);
  const [history, setHistory] = useState<ReviewScoreSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [error, setError] = useState('');
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareItem, setCompareItem] = useState<ReviewScoreSummary | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (projectName && typeof projectName === 'string') {
      loadDetail(decodeURIComponent(projectName));
    }
  }, [projectName]);

  const loadDetail = async (name: string) => {
    try {
      setLoading(true);
      const [detailData, historyData] = await Promise.all([
        getReviewScoreDetail(name),
        getReviewScoreHistory(name),
      ]);
      setDetail(detailData);
      setHistory(historyData);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to load review score');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error)
    return (
      <div className="p-8 text-red-600">
        {error}
        <Link href="/project-review-scores" className="ml-4 text-blue-600 underline">
          Back to list
        </Link>
      </div>
    );
  if (!detail) return <div className="p-8">No data found</div>;

  // Parse JSON fields
  let categories: ReviewScoreCategory[] = [];
  let criticalIssues: ReviewScoreCriticalIssue[] = [];
  let strengths: ReviewScoreStrength[] = [];

  try {
    categories = JSON.parse(detail.categories);
  } catch {
    /* empty */
  }
  try {
    criticalIssues = detail.criticalIssues ? JSON.parse(detail.criticalIssues) : [];
  } catch {
    /* empty */
  }
  try {
    strengths = detail.strengths ? JSON.parse(detail.strengths) : [];
  } catch {
    /* empty */
  }

  let closedIssues: ReviewScoreClosedIssue[] = [];
  let remainingIssues: ReviewScoreRemainingIssue[] = [];
  try {
    closedIssues = detail.closedIssues ? JSON.parse(detail.closedIssues) : [];
  } catch {
    /* empty */
  }
  try {
    remainingIssues = detail.remainingIssues ? JSON.parse(detail.remainingIssues) : [];
  } catch {
    /* empty */
  }

  // Parse raw markdown for display
  let rawParsed: Record<string, unknown> = {};
  try {
    rawParsed = JSON.parse(detail.rawMarkdown);
  } catch {
    /* empty */
  }

  const reportDate = new Date(detail.reportDate).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getScoreColor = (score: number, max: number) => {
    const pct = max > 0 ? (score / max) * 100 : 0;
    if (pct >= 80) return { bar: 'bg-green-500', text: 'text-green-700' };
    if (pct >= 50) return { bar: 'bg-yellow-500', text: 'text-yellow-700' };
    return { bar: 'bg-red-500', text: 'text-red-700' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return (
          <Badge color="green" size="md" icon={<TrendingUp size={14} />}>
            Good
          </Badge>
        );
      case 'warning':
        return (
          <Badge color="yellow" size="md" icon={<AlertTriangle size={14} />}>
            Warning
          </Badge>
        );
      case 'critical':
        return (
          <Badge color="red" size="md" icon={<TrendingDown size={14} />}>
            Critical
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu raporu silmek istediğinizden emin misiniz?')) return;
    try {
      setDeleting(id);
      await deleteReviewScore(id);
      // Reload history
      if (projectName) {
        const historyData = await getReviewScoreHistory(decodeURIComponent(String(projectName)));
        setHistory(historyData);
        // If deleted current, load latest
        if (id === detail.id && historyData.length > 0) {
          const latestDetail = await getReviewScoreDetail(decodeURIComponent(String(projectName)));
          setDetail(latestDetail);
        } else if (historyData.length === 0) {
          router.push('/project-review-scores');
        }
      }
    } catch (err) {
      alert('Silme işlemi başarısız: ' + (err as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const openCompareModal = (item: ReviewScoreSummary) => {
    setCompareItem(item);
    setShowCompareModal(true);
  };

  // Calculate score difference for comparison
  const getScoreDiff = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff > 0) return { value: `+${diff}`, color: 'text-green-600', icon: ArrowUpCircle };
    if (diff < 0) return { value: `${diff}`, color: 'text-red-600', icon: ArrowDownCircle };
    return { value: '0', color: 'text-gray-500', icon: null };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/project-review-scores"
          className="rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{detail.projectName}</h2>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {reportDate}
            </span>
            {detail.projectId && (
              <Link
                href={`/projects/${encodeURIComponent(detail.projectId)}`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <ExternalLink size={14} /> View Project Tasks
              </Link>
            )}
            {detail.confluenceUrl && (
              <a
                href={detail.confluenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <ExternalLink size={14} /> Confluence
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Score Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Overall Score */}
        <div className="flex flex-col items-center justify-center rounded-lg bg-white p-6 shadow">
          <span className="text-5xl font-bold text-gray-900">{detail.overallScore}</span>
          <span className="text-sm text-gray-500">/100</span>
          <div className="mt-2">{getStatusBadge(detail.status)}</div>
          <div className="mt-4 h-3 w-full rounded-full bg-gray-200">
            <div
              className={`h-3 rounded-full transition-all ${
                detail.overallScore >= 85
                  ? 'bg-green-500'
                  : detail.overallScore >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${detail.overallScore}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-3 text-sm font-semibold text-gray-600">Quick Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Categories</span>
              <span className="font-bold text-gray-900">{categories.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <XCircle size={14} className="text-red-500" /> Critical Issues
              </span>
              <span className="font-bold text-red-700">{criticalIssues.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <CheckCircle size={14} className="text-green-500" /> Strengths
              </span>
              <span className="font-bold text-green-700">{strengths.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <History size={14} /> Reports
              </span>
              <span className="font-bold text-gray-900">{history.length}</span>
            </div>
          </div>
        </div>

        {/* Top concerns */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-3 text-sm font-semibold text-gray-600">Lowest Categories</h3>
          <div className="space-y-2">
            {[...categories]
              .sort((a, b) => a.score / (a.maxScore || 1) - b.score / (b.maxScore || 1))
              .slice(0, 3)
              .map(cat => {
                const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
                const colors = getScoreColor(cat.score, cat.maxScore);
                return (
                  <div key={cat.name} className="flex items-center gap-2 text-sm">
                    <span className="w-32 truncate text-gray-600" title={cat.name}>
                      {cat.name}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${colors.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-12 text-right font-medium ${colors.text}`}>
                      {cat.score}/{cat.maxScore}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 overflow-x-auto">
          {[
            { key: 'overview' as Tab, label: 'Overview', icon: FileText },
            {
              key: 'closed' as Tab,
              label: `Closed (${closedIssues.length})`,
              icon: CheckCircle,
              color: 'text-green-600',
            },
            {
              key: 'remaining' as Tab,
              label: `Remaining (${remainingIssues.length})`,
              icon: AlertTriangle,
              color: 'text-orange-600',
            },
            { key: 'history' as Tab, label: 'History', icon: History },
            { key: 'raw' as Tab, label: 'Raw Data', icon: FileText },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} className={activeTab === tab.key ? '' : tab.color || ''} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Categories */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Category Scores</h3>
            <div className="space-y-3">
              {categories.map(cat => {
                const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
                const colors = getScoreColor(cat.score, cat.maxScore);
                return (
                  <div key={cat.name} className="flex items-center gap-4">
                    <span className="w-48 truncate text-sm font-medium text-gray-700">
                      {cat.name}
                    </span>
                    <div className="h-3 flex-1 rounded-full bg-gray-200">
                      <div
                        className={`h-3 rounded-full ${colors.bar} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-14 text-right text-sm font-bold ${colors.text}`}>
                      {cat.score}/{cat.maxScore}
                    </span>
                    <span className="w-10 text-right text-xs text-gray-400">{pct}%</span>
                    {cat.status && (
                      <span
                        className="w-20 truncate rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                        title={cat.status}
                      >
                        {cat.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Issues */}
          {criticalIssues.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <XCircle size={20} className="text-red-500" />
                Critical Issues ({criticalIssues.length})
              </h3>
              <div className="space-y-4">
                {criticalIssues.map((issue, idx) => (
                  <div key={idx} className="border-l-4 border-red-400 py-2 pl-4">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                      {issue.severity && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                          {issue.severity}
                        </span>
                      )}
                      {issue.pointImpact && (
                        <span className="text-xs text-gray-500">{issue.pointImpact}</span>
                      )}
                    </div>
                    {issue.description && (
                      <p className="text-sm whitespace-pre-line text-gray-600">
                        {issue.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <CheckCircle size={20} className="text-green-500" />
                Strengths ({strengths.length})
              </h3>
              <div className="space-y-3">
                {strengths.map((s, idx) => (
                  <div key={idx} className="border-l-4 border-green-400 py-2 pl-4">
                    <h4 className="font-semibold text-gray-900">{s.title}</h4>
                    {s.description && <p className="text-sm text-gray-600">{s.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Closed Issues Tab */}
      {activeTab === 'closed' && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <CheckCircle size={20} className="text-green-500" />
            Önceki Dönemden Kapanan Sorunlar ({closedIssues.length})
          </h3>
          {closedIssues.length > 0 ? (
            <div className="space-y-3">
              {closedIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="rounded-r-lg border-l-4 border-green-400 bg-green-50 py-3 pl-4"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-gray-200 px-2 py-0.5 font-mono text-xs text-gray-700">
                      {issue.rule}
                    </span>
                    {issue.severity && (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        {issue.severity}
                      </span>
                    )}
                    <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{issue.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Bu raporda kapanan sorun kaydı bulunmuyor.</p>
          )}
        </div>
      )}

      {/* Remaining Issues Tab */}
      {activeTab === 'remaining' && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <AlertTriangle size={20} className="text-orange-500" />
            Kalan Sorunlar ({remainingIssues.length})
          </h3>
          {remainingIssues.length > 0 ? (
            <div className="space-y-4">
              {remainingIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="rounded-r-lg border-l-4 border-orange-400 bg-orange-50 py-3 pl-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                    {issue.rule && (
                      <span className="rounded bg-gray-200 px-2 py-0.5 font-mono text-xs text-gray-700">
                        {issue.rule}
                      </span>
                    )}
                    {issue.severity && (
                      <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                        {issue.severity}
                      </span>
                    )}
                    {issue.pointImpact && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        {issue.pointImpact}
                      </span>
                    )}
                  </div>
                  {issue.description && (
                    <div className="mb-2">
                      <p className="text-sm whitespace-pre-line text-gray-700">
                        {issue.description}
                      </p>
                    </div>
                  )}
                  {issue.solution && (
                    <div className="mt-2 rounded border border-blue-200 bg-blue-50 p-2">
                      <p className="mb-1 text-xs font-semibold text-blue-700">Çözüm Önerisi:</p>
                      <p className="text-sm whitespace-pre-line text-blue-800">{issue.solution}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Bu raporda kalan sorun kaydı bulunmuyor.</p>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Score History</h3>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((h, idx) => {
                const hDate = new Date(h.reportDate).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });
                const prevItem = history[idx + 1];
                const scoreDiff = prevItem
                  ? getScoreDiff(h.overallScore, prevItem.overallScore)
                  : null;
                return (
                  <div
                    key={h.id}
                    className={`flex items-center gap-4 rounded-lg border p-3 hover:shadow-sm ${
                      h.id === detail.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div
                      className="flex flex-1 cursor-pointer items-center gap-4"
                      onClick={() => {
                        if (h.id !== detail.id && projectName) {
                          router.push(
                            `/project-review-scores/${encodeURIComponent(String(projectName))}?scoreId=${h.id}`
                          );
                          loadDetail(decodeURIComponent(String(projectName)));
                        }
                      }}
                    >
                      <span
                        className={`text-2xl font-bold ${
                          h.overallScore >= 85
                            ? 'text-green-700'
                            : h.overallScore >= 60
                              ? 'text-yellow-700'
                              : 'text-red-700'
                        }`}
                      >
                        {h.overallScore}
                      </span>
                      {scoreDiff && (
                        <span
                          className={`flex items-center gap-1 text-sm font-medium ${scoreDiff.color}`}
                        >
                          {scoreDiff.icon && <scoreDiff.icon size={14} />}
                          {scoreDiff.value}
                        </span>
                      )}
                      <div className="flex-1">
                        <span className="text-sm text-gray-600">{hDate}</span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          h.status === 'good'
                            ? 'bg-green-100 text-green-700'
                            : h.status === 'warning'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {h.status}
                      </span>
                      {h.id === detail.id && (
                        <span className="text-xs font-medium text-blue-600">Current</span>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {prevItem && (
                        <Button
                          onClick={e => {
                            e.stopPropagation();
                            openCompareModal(h);
                          }}
                          variant="outline"
                          size="sm"
                          title="Önceki ile karşılaştır"
                          leftIcon={<GitCompare size={16} />}
                        />
                      )}
                      <Button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(h.id);
                        }}
                        disabled={deleting === h.id}
                        variant="danger"
                        size="sm"
                        title="Raporu sil"
                        leftIcon={<Trash2 size={16} />}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No history records found.</p>
          )}
        </div>
      )}

      {activeTab === 'raw' && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Raw Parsed Data</h3>
          <pre className="max-h-[600px] overflow-x-auto overflow-y-auto rounded-lg border bg-gray-50 p-4 text-xs text-gray-700">
            {JSON.stringify(rawParsed, null, 2)}
          </pre>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && compareItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowCompareModal(false)}
        >
          <div
            className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-white pb-2">
              <h3 className="text-lg font-semibold text-gray-900">Versiyon Karşılaştırma</h3>
              <Button
                onClick={() => setShowCompareModal(false)}
                variant="ghost"
                size="md"
                className="h-8 w-8 p-1"
                leftIcon={<X size={20} />}
              />
            </div>

            {(() => {
              const currentIdx = history.findIndex(h => h.id === compareItem.id);
              const prevItem = history[currentIdx + 1];
              if (!prevItem)
                return (
                  <p className="text-gray-500">Karşılaştırma için önceki versiyon bulunamadı.</p>
                );

              const currentDate = new Date(compareItem.reportDate).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
              const prevDate = new Date(prevItem.reportDate).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
              const diff = getScoreDiff(compareItem.overallScore, prevItem.overallScore);

              return (
                <div className="space-y-4">
                  {/* Score comparison */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="mb-1 text-xs text-gray-500">Önceki ({prevDate})</p>
                      <p
                        className={`text-3xl font-bold ${prevItem.overallScore >= 85 ? 'text-green-700' : prevItem.overallScore >= 60 ? 'text-yellow-700' : 'text-red-700'}`}
                      >
                        {prevItem.overallScore}
                      </p>
                    </div>
                    <div className="flex items-center justify-center p-4">
                      <div className={`flex items-center gap-1 text-2xl font-bold ${diff.color}`}>
                        {diff.icon && <diff.icon size={24} />}
                        {diff.value}
                      </div>
                    </div>
                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                      <p className="mb-1 text-xs text-gray-500">Güncel ({currentDate})</p>
                      <p
                        className={`text-3xl font-bold ${compareItem.overallScore >= 85 ? 'text-green-700' : compareItem.overallScore >= 60 ? 'text-yellow-700' : 'text-red-700'}`}
                      >
                        {compareItem.overallScore}
                      </p>
                    </div>
                  </div>

                  {/* Category comparison */}
                  <div>
                    <h4 className="mb-2 font-semibold text-gray-700">Kategori Değişimleri</h4>
                    <div className="space-y-2">
                      {compareItem.categorySummary?.map(cat => {
                        const prevCat = prevItem.categorySummary?.find(c => c.name === cat.name);
                        const catDiff = prevCat ? getScoreDiff(cat.score, prevCat.score) : null;
                        return (
                          <div key={cat.name} className="flex items-center gap-2 text-sm">
                            <span className="w-40 truncate text-gray-600">{cat.name}</span>
                            <span className="text-gray-900">{prevCat?.score || '-'}</span>
                            <span className="text-gray-700">→</span>
                            <span className="font-medium text-gray-900">
                              {cat.score}/{cat.maxScore}
                            </span>
                            {catDiff && catDiff.value !== '0' && (
                              <span className={`text-xs font-medium ${catDiff.color}`}>
                                ({catDiff.value})
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
