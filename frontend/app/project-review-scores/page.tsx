'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, Upload, X } from 'lucide-react';
import {
  getReviewScores,
  ReviewScoreSummary,
  crawlReviewScore,
  saveReviewScore,
  importReviewMarkdown,
} from '../../lib/api';
import { ReviewScoreCard } from '../../components/ReviewScoreCard';
import { Button, InputField, InputSelect, PageHeader, StatCard, StatCardRow } from '@components/ui';

type StatusFilter = 'all' | 'critical' | 'warning' | 'good';
type SortOption = 'score-asc' | 'score-desc' | 'name' | 'date';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'critical', label: '🔴 Critical' },
  { value: 'warning', label: '🟡 Warning' },
  { value: 'good', label: '🟢 Good' },
];

const sortOptions = [
  { value: 'score-asc', label: 'Score ↑' },
  { value: 'score-desc', label: 'Score ↓' },
  { value: 'name', label: 'A-Z' },
  { value: 'date', label: 'Latest' },
];

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
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setActionMessage(err?.response?.data?.message || err?.message || 'Import failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter
  const filtered = scores.filter(s => {
    const matchesSearch = s.projectName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
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
        return new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
      default:
        return 0;
    }
  });

  // Stats
  const totalCount = scores.length;
  const criticalCount = scores.filter(s => s.status === 'critical').length;
  const warningCount = scores.filter(s => s.status === 'warning').length;
  const goodCount = scores.filter(s => s.status === 'good').length;
  const avgScore =
    totalCount > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.overallScore, 0) / totalCount)
      : 0;

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Review Scores"
        description="Track and manage project review scores and quality metrics"
      >
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCrawlModal(true)}
            variant="primary"
            size="md"
            leftIcon={<RefreshCw size={16} />}
          >
            Confluence&apos;tan Çek
          </Button>
          <Button
            onClick={() => setShowImportModal(true)}
            variant="secondary"
            size="md"
            leftIcon={<Upload size={16} />}
          >
            Markdown Import
          </Button>
        </div>
      </PageHeader>

      {/* Action message */}
      {actionMessage && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          {actionMessage}
          <button onClick={() => setActionMessage('')} className="ml-2 text-blue-600 underline">
            Kapat
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="flex flex-col items-center gap-4 md:flex-row">
        {/* Search & Filters */}
        <div className="w-full md:w-7/12">
          <div className="flex items-center rounded-lg bg-white p-4 shadow">
            <div className="relative flex w-full gap-4">
              <InputField
                type="search"
                placeholder="Search projects..."
                value={search}
                onChange={setSearch}
                icon={<Search size={20} />}
                iconPosition="left"
                className="flex-1"
              />
              <InputSelect
                value={statusFilter}
                onChange={value => setStatusFilter(value as StatusFilter)}
                options={statusOptions}
              />
              <InputSelect
                value={sortBy}
                onChange={value => setSortBy(value as SortOption)}
                options={sortOptions}
              />
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <StatCardRow className="w-full md:w-5/12">
          <StatCard label="Avg Score" value={avgScore} valueColor="blue" size="sm" />
          <StatCard label="Total" value={totalCount} size="sm" />
          <StatCard label="Good" value={goodCount} valueColor="green" bgColor="green" size="sm" />
          <StatCard
            label="Warning"
            value={warningCount}
            valueColor="yellow"
            bgColor="yellow"
            size="sm"
          />
          <StatCard
            label="Critical"
            value={criticalCount}
            valueColor="red"
            bgColor="red"
            size="sm"
          />
        </StatCardRow>
      </div>

      {/* Project cards grid */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map(score => (
            <ReviewScoreCard
              key={score.id}
              score={score}
              onClick={() =>
                router.push(`/project-review-scores/${encodeURIComponent(score.projectName)}`)
              }
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500">
          {scores.length === 0
            ? 'No review scores yet. Import from Confluence or upload a markdown file.'
            : `No projects found matching "${search}"`}
        </div>
      )}

      {/* Crawl Modal */}
      {showCrawlModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setShowCrawlModal(false);
            setCrawlUrl('');
          }}
        >
          <div
            className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 mb-4 flex items-center justify-between bg-white pb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Confluence&apos;tan Review Score Çek
              </h3>
              <Button
                onClick={() => {
                  setShowCrawlModal(false);
                  setCrawlUrl('');
                }}
                variant="ghost"
                size="md"
                className="h-8 w-8 p-1"
                leftIcon={<X size={24} />}
              />
            </div>
            <p className="mb-4 text-sm text-gray-600">
              AI Reports sayfasının Confluence URL&apos;ini girin. Sayfa içeriği parse edilerek skor
              bilgileri çıkarılacaktır.
            </p>
            <input
              type="text"
              placeholder="https://your-confluence.atlassian.net/wiki/spaces/.../pages/..."
              value={crawlUrl}
              onChange={e => setCrawlUrl(e.target.value)}
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowCrawlModal(false);
                  setCrawlUrl('');
                }}
                variant="ghost"
                size="sm"
              >
                İptal
              </Button>
              <Button
                onClick={handleCrawl}
                disabled={actionLoading || !crawlUrl}
                variant="primary"
                size="sm"
                loading={actionLoading}
              >
                {actionLoading ? 'Çekiliyor...' : 'Çek ve Kaydet'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 mb-4 flex items-center justify-between bg-white pb-2">
              <h3 className="text-lg font-semibold text-gray-900">Markdown Import</h3>
              <Button
                onClick={() => setShowImportModal(false)}
                variant="ghost"
                size="md"
                className="h-8 w-8 p-1"
                leftIcon={<X size={24} />}
              />
            </div>
            <p className="mb-4 text-sm text-gray-600">
              AI Review Score markdown içeriğini buraya yapıştırın.
            </p>
            <textarea
              placeholder="# 📊 Proje Code Review Raporu..."
              value={importMarkdown}
              onChange={e => setImportMarkdown(e.target.value)}
              rows={12}
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900"
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowImportModal(false);
                  setImportMarkdown('');
                }}
                variant="ghost"
                size="sm"
              >
                İptal
              </Button>
              <Button
                onClick={handleImport}
                disabled={actionLoading || !importMarkdown}
                variant="primary"
                size="sm"
                loading={actionLoading}
              >
                {actionLoading ? 'İmport ediliyor...' : 'Import Et'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
