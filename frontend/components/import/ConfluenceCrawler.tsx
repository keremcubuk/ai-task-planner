import { useState } from 'react';
import { useRouter } from 'next/router';
import { Globe, ArrowLeft, Check, Loader2, Key } from 'lucide-react';
import {
  crawlConfluence,
  confirmConfluenceTasks,
  extractConfluenceCookies,
  ConfluenceTask,
} from '../../lib/api';

interface ConfluenceCrawlerProps {
  onBack: () => void;
}

type ConfluenceStep = 'input' | 'preview' | 'success';

interface CrawlResult {
  url: string;
  success: boolean;
  pageTitle?: string;
  projectStatus?: string;
  rowCount: number;
  error?: string;
}

export default function ConfluenceCrawler({ onBack }: ConfluenceCrawlerProps) {
  const [confluenceStep, setConfluenceStep] = useState<ConfluenceStep>('input');
  const [confluenceUrls, setConfluenceUrls] = useState(''); // Changed to support multiple URLs
  const [confluenceCookies, setConfluenceCookies] = useState('');
  const [crawledTasks, setCrawledTasks] = useState<ConfluenceTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [pageTitle, setPageTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [crawlProgress, setCrawlProgress] = useState({ current: 0, total: 0 });
  const [crawlResults, setCrawlResults] = useState<CrawlResult[]>([]);
  const [extractingCookies, setExtractingCookies] = useState(false);
  const router = useRouter();

  const handleConfluenceCrawl = async () => {
    if (!confluenceUrls.trim()) {
      setError('Please enter at least one Confluence URL');
      return;
    }

    // Parse URLs - split by newline and filter empty lines
    const urls = confluenceUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urls.length === 0) {
      setError('Please enter at least one valid URL');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    const allTasks: ConfluenceTask[] = [];
    const results: CrawlResult[] = [];
    let firstPageTitle = '';

    setCrawlProgress({ current: 0, total: urls.length });
    setCrawlResults([]);

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        setCrawlProgress({ current: i + 1, total: urls.length });

        try {
          const result = await crawlConfluence(url, confluenceCookies || undefined);
          if (result.success && result.tasks.length > 0) {
            allTasks.push(...result.tasks);
            if (!firstPageTitle) {
              firstPageTitle = result.pageTitle;
            }
            results.push({
              url,
              success: true,
              pageTitle: result.pageTitle,
              projectStatus: result.projectStatus,
              rowCount: result.tasks.length,
            });
          } else {
            results.push({
              url,
              success: false,
              rowCount: 0,
              error: result.error || 'No tasks found',
            });
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to crawl';
          results.push({
            url,
            success: false,
            rowCount: 0,
            error: errorMessage,
          });
          console.error(`Error crawling ${url}:`, err);
        }
      }

      setCrawlResults(results);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (allTasks.length > 0) {
        setCrawledTasks(allTasks);
        setSelectedTasks(new Set(allTasks.map((_, i) => i)));
        setPageTitle(urls.length > 1 ? `Multiple Pages (${urls.length})` : firstPageTitle);
        setConfluenceStep('preview');

        if (failCount > 0) {
          setMessage(
            `✅ ${successCount} successful, ❌ ${failCount} failed. Total: ${allTasks.length} tasks found.`
          );
        } else {
          setMessage(
            `✅ All ${successCount} pages crawled successfully! Total: ${allTasks.length} tasks found.`
          );
        }
      } else {
        const errorDetails = results
          .filter(r => !r.success)
          .map(r => `• ${r.url}: ${r.error}`)
          .join('\n');
        setError(`No tasks found.\n\n${errorDetails}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to crawl Confluence pages';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
      setCrawlProgress({ current: 0, total: 0 });
    }
  };

  const handleConfirmTasks = async () => {
    const tasksToImport = crawledTasks.filter((_, i) => selectedTasks.has(i));
    if (tasksToImport.length === 0) {
      setError('Please select at least one task');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await confirmConfluenceTasks(tasksToImport);
      setMessage(result.message);
      setConfluenceStep('success');
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      setError('Failed to save tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const toggleAll = () => {
    if (selectedTasks.size === crawledTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(crawledTasks.map((_, i) => i)));
    }
  };

  // Input Step
  if (confluenceStep === 'input') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8">
        <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-lg">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-700">
            <Globe className="h-6 w-6" /> Confluence Crawler
          </h1>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Confluence Page URLs *
            </label>
            <textarea
              value={confluenceUrls}
              onChange={e => setConfluenceUrls(e.target.value)}
              placeholder="https://your-company.atlassian.net/wiki/spaces/PROJECT1/pages/123\nhttps://your-company.atlassian.net/wiki/spaces/PROJECT2/pages/456\n\nEnter one URL per line for bulk crawling"
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              💡 You can enter multiple URLs (one per line) to crawl multiple pages at once.
            </p>
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                🍪 Authentication Cookies (Optional - for SSO/Private Pages)
              </label>
              <button
                onClick={async () => {
                  if (!confluenceUrls.trim()) {
                    setError('Please enter at least one URL first');
                    return;
                  }
                  const firstUrl = confluenceUrls.split('\n')[0].trim();
                  if (!firstUrl) return;

                  try {
                    const baseUrl = new URL(firstUrl).origin;
                    setExtractingCookies(true);
                    setError('');
                    setMessage('Opening browser for login... Please login and wait.');

                    const result = await extractConfluenceCookies(baseUrl);
                    if (result.success) {
                      setConfluenceCookies(result.cookies);
                      setMessage('✅ Cookies extracted successfully!');
                    } else {
                      setError(result.error || 'Failed to extract cookies');
                    }
                  } catch {
                    setError('Invalid URL or extraction failed');
                  } finally {
                    setExtractingCookies(false);
                  }
                }}
                disabled={extractingCookies || !confluenceUrls.trim()}
                className="flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
              >
                {extractingCookies ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Extracting...
                  </>
                ) : (
                  <>
                    <Key className="h-3 w-3" /> Auto Extract
                  </>
                )}
              </button>
            </div>
            <textarea
              value={confluenceCookies}
              onChange={e => setConfluenceCookies(e.target.value)}
              placeholder='[{"name": "cloud.session.token", "value": "your_token_here", "domain": ".atlassian.net"}]'
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs text-gray-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <div className="mt-2 rounded-md bg-blue-50 p-3">
              <p className="mb-1 text-xs font-medium text-blue-800">🔐 Two ways to authenticate:</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-blue-700">
                    1. Auto Extract (Recommended):
                  </p>
                  <p className="ml-2 text-xs text-blue-600">
                    Click &quot;Auto Extract&quot; button → Browser opens → Login manually → Cookies
                    auto-saved
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700">2. Manual Copy:</p>
                  <p className="ml-2 text-xs text-blue-600">
                    Browser DevTools (F12) → Application → Cookies → Copy as JSON
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-blue-600 italic">
                💡 Leave empty if your pages are public or don&apos;t require authentication.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-center text-sm font-medium text-red-600">{error}</div>
          )}

          <button
            onClick={handleConfluenceCrawl}
            disabled={loading || !confluenceUrls.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {crawlProgress.total > 0
                  ? `Crawling ${crawlProgress.current}/${crawlProgress.total}...`
                  : 'Crawling...'}
              </>
            ) : (
              <>
                <Globe className="h-5 w-5" /> Crawl Pages
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Preview Step
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="border-b bg-purple-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-purple-800">Preview: {pageTitle}</h1>
                <p className="text-sm text-purple-600">
                  {selectedTasks.size} of {crawledTasks.length} tasks selected
                </p>
                {crawlResults.length > 1 && (
                  <div className="mt-2 text-xs text-purple-700">
                    📊 Crawled {crawlResults.length} pages:{' '}
                    {crawlResults.filter(r => r.success).length} ✅ successful,{' '}
                    {crawlResults.filter(r => !r.success).length} ❌ failed
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setConfluenceStep('input');
                    setCrawledTasks([]);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handleConfirmTasks}
                  disabled={loading || selectedTasks.size === 0}
                  className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Confirm Import
                </button>
              </div>
            </div>
          </div>

          {error && <div className="bg-red-50 p-4 text-sm text-red-600">{error}</div>}
          {message && <div className="bg-green-50 p-4 text-sm text-green-600">{message}</div>}

          {crawlResults.length > 0 && (
            <div className="border-b bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">📋 Crawl Results Summary</h3>
              <div className="space-y-2">
                {crawlResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`rounded p-2 text-xs ${
                      result.success
                        ? 'border border-green-200 bg-green-50'
                        : 'border border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{result.success ? '✅' : '❌'}</span>
                      <div className="flex-1">
                        <div className="font-mono break-all text-gray-600">{result.url}</div>
                        {result.success ? (
                          <div className="mt-1 text-gray-700">
                            <span className="font-semibold">{result.pageTitle}</span>
                            {result.projectStatus && (
                              <span className="ml-2 rounded bg-white px-2 py-0.5 text-xs">
                                Status:{' '}
                                {result.projectStatus === 'done' ? '✓ DONE' : '⏳ IN PROGRESS'}
                              </span>
                            )}
                            <span className="ml-2 font-medium text-green-700">
                              → {result.rowCount} tasks
                            </span>
                          </div>
                        ) : (
                          <div className="mt-1 text-red-700">Error: {result.error}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTasks.size === crawledTasks.length}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-left font-bold text-gray-700">
                    Project Name
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-left font-bold text-gray-700">
                    Project Status
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-left font-bold text-gray-700">
                    Source
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-left font-bold text-gray-700">
                    Task ID
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-left font-bold text-gray-700">
                    Task Name
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-left font-bold text-gray-700">
                    Progress
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-left font-bold text-gray-700">
                    Assigned To
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-left font-bold text-gray-700">
                    Priority
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-left font-bold text-gray-700">
                    Description
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-left font-bold text-gray-700">
                    Created Date
                  </th>
                  <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2 text-left font-bold text-gray-700">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {crawledTasks.map((task, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-gray-50 ${selectedTasks.has(index) ? '' : 'opacity-50'}`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(index)}
                        onChange={() => toggleTask(index)}
                        className="rounded"
                      />
                    </td>
                    <td
                      className="max-w-[150px] truncate px-3 py-2 text-gray-700"
                      title={task.projectName}
                    >
                      {task.projectName}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          task.projectStatus === 'done'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {task.projectStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
                        {task.source}
                      </span>
                    </td>
                    <td
                      className="max-w-[100px] truncate px-3 py-2 font-mono text-xs text-gray-700"
                      title={task.taskId}
                    >
                      {task.taskId}
                    </td>
                    <td
                      className="max-w-[200px] truncate px-3 py-2 text-gray-700"
                      title={task.taskName}
                    >
                      {task.taskName}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          task.progress === 'done'
                            ? 'bg-green-100 text-green-800'
                            : task.progress === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.progress}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{task.assignedTo}</td>
                    <td className="px-3 py-2 text-gray-700">{task.priority}</td>
                    <td
                      className="max-w-[200px] truncate px-3 py-2 text-gray-700"
                      title={task.description}
                    >
                      {task.description}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                      {task.createdDate ? new Date(task.createdDate).toLocaleDateString() : ''}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
