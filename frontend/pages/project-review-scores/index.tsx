import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Search, RefreshCw, Upload } from 'lucide-react';
import {
  getReviewScores,
  ReviewScoreSummary,
  crawlReviewScore,
  saveReviewScore,
  importReviewMarkdown,
} from '../../lib/api';
import { ReviewScoreCard } from '../../components/ReviewScoreCard';

type StatusFilter = 'all' | 'critical' | 'warning' | 'good';
type SortOption = 'score-asc' | 'score-desc' | 'name' | 'date';

export default function ProjectReviewScoresPage() {
  const [scores, setScores] = useState<ReviewScoreSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('score-asc');
  const [showCrawlModal, setShowCrawlModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [crawlUrl, setCrawlUrl] = useState('');
  const [importMarkdown, setImportMarkdown] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    try {
      setLoading(true);
      const data = await getReviewScores();
      setScores(data);
    } catch (error) {
      console.error('Failed to load review scores', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrawl = async () => {
    if (!crawlUrl) return;
    setActionLoading(true);
    setActionMessage('');
    try {
      const result = await crawlReviewScore(crawlUrl);
      if (result.success) {
        const saved = await saveReviewScore(result.parsed, crawlUrl);
        setActionMessage(saved.message);
        setShowCrawlModal(false);
        setCrawlUrl('');
        await loadScores();
      } else {
        setActionMessage(result.error || 'Crawl failed');
      }
    } catch (error: unknown) {
      setActionMessage((error as Error)?.message || 'Error during crawl');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importMarkdown) return;
    setActionLoading(true);
    setActionMessage('');
    try {
      const result = await importReviewMarkdown(importMarkdown);
      setActionMessage(result.message);
      setShowImportModal(false);
      setImportMarkdown('');
      await loadScores();
    } catch (error: unknown) {
      const err = error as any;
      setActionMessage(
        err?.response?.data?.message || err?.message || 'Import failed',
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Filter
  const filtered = scores.filter((s) => {
    const matchesSearch = s.projectName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'score-asc':
        return a.overallScore - b.overallScore;
      case 'score-desc':
        return b.overallScore - a.overallScore;
      case 'name':
        return a.projectName.localeCompare(b.projectName);
      case 'date':
        return (
          new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
        );
      default:
        return 0;
    }
  });

  // Stats
  const totalCount = scores.length;
  const criticalCount = scores.filter((s) => s.status === 'critical').length;
  const warningCount = scores.filter((s) => s.status === 'warning').length;
  const goodCount = scores.filter((s) => s.status === 'good').length;
  const avgScore =
    totalCount > 0
      ? Math.round(
          scores.reduce((sum, s) => sum + s.overallScore, 0) / totalCount,
        )
      : 0;

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Project Review Scores
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCrawlModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <RefreshCw size={16} /> Confluence'tan Çek
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
          >
            <Upload size={16} /> Markdown Import
          </button>
        </div>
      </div>

      {/* Action message */}
      {actionMessage && (
        <div className="p-3 rounded-md bg-blue-50 text-blue-800 text-sm">
          {actionMessage}
          <button
            onClick={() => setActionMessage('')}
            className="ml-2 text-blue-600 underline"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Search & Filters */}
        <div className="w-full md:w-7/12">
          <div className="bg-white p-4 rounded-lg shadow h-full flex items-center">
            <div className="relative w-full flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white text-gray-700 placeholder-gray-500 hover:border-gray-400 transition-colors"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-gray-700 font-medium hover:border-gray-400 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="critical">🔴 Critical</option>
                <option value="warning">🟡 Warning</option>
                <option value="good">🟢 Good</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-gray-700 font-medium hover:border-gray-400 transition-colors"
              >
                <option value="score-asc">Score ↑</option>
                <option value="score-desc">Score ↓</option>
                <option value="name">A-Z</option>
                <option value="date">Latest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="w-full md:w-5/12 flex gap-3 justify-end">
          <div className="bg-white rounded-lg shadow p-3 flex flex-col items-center min-w-[90px]">
            <span className="text-xs text-gray-500">Avg Score</span>
            <span className="text-2xl font-bold text-blue-700">{avgScore}</span>
          </div>
          <div className="bg-white rounded-lg shadow p-3 flex flex-col items-center min-w-[80px]">
            <span className="text-xs text-gray-500">Total</span>
            <span className="text-2xl font-bold text-gray-700">
              {totalCount}
            </span>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-3 flex flex-col items-center min-w-[80px]">
            <span className="text-xs text-green-600">Good</span>
            <span className="text-2xl font-bold text-green-700">
              {goodCount}
            </span>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-3 flex flex-col items-center min-w-[80px]">
            <span className="text-xs text-yellow-600">Warning</span>
            <span className="text-2xl font-bold text-yellow-700">
              {warningCount}
            </span>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-3 flex flex-col items-center min-w-[80px]">
            <span className="text-xs text-red-600">Critical</span>
            <span className="text-2xl font-bold text-red-700">
              {criticalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Project cards grid */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((score) => (
            <ReviewScoreCard
              key={score.id}
              score={score}
              onClick={() =>
                router.push(
                  `/project-review-scores/${encodeURIComponent(score.projectName)}`,
                )
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          {scores.length === 0
            ? 'No review scores yet. Import from Confluence or upload a markdown file.'
            : `No projects found matching "${search}"`}

        </div>
      )}

      {/* Crawl Modal */}
      {showCrawlModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setShowCrawlModal(false);
            setCrawlUrl('');
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Confluence&apos;tan Review Score Çek
              </h3>
              <button
                onClick={() => {
                  setShowCrawlModal(false);
                  setCrawlUrl('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              AI Reports sayfasının Confluence URL&apos;ini girin. Sayfa içeriği
              parse edilerek skor bilgileri çıkarılacaktır.
            </p>
            <input
              type="text"
              placeholder="https://your-confluence.atlassian.net/wiki/spaces/.../pages/..."
              value={crawlUrl}
              onChange={(e) => setCrawlUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCrawlModal(false);
                  setCrawlUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                İptal
              </button>
              <button
                onClick={handleCrawl}
                disabled={actionLoading || !crawlUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                {actionLoading ? 'Çekiliyor...' : 'Çek ve Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowImportModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Markdown Import
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              AI Review Score markdown içeriğini buraya yapıştırın.
            </p>
            <textarea
              placeholder="# 📊 Proje Code Review Raporu..."
              value={importMarkdown}
              onChange={(e) => setImportMarkdown(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 text-sm font-mono text-gray-900"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportMarkdown('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                İptal
              </button>
              <button
                onClick={handleImport}
                disabled={actionLoading || !importMarkdown}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 text-sm disabled:opacity-50"
              >
                {actionLoading ? 'İmport ediliyor...' : 'Import Et'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
