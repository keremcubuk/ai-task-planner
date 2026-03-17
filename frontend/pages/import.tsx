import { useState } from 'react';
import { useRouter } from 'next/router';
import { Upload, Globe, FileSpreadsheet } from 'lucide-react';
import FileImport from '../components/import/FileImport';
import ConfluenceCrawler from '../components/import/ConfluenceCrawler';
import { Button } from '../components/ui';

type ImportMode = 'select' | 'file' | 'confluence';

export default function ImportPage() {
  const [mode, setMode] = useState<ImportMode>('select');
  const router = useRouter();

  if (mode === 'file') {
    return <FileImport onBack={() => setMode('select')} />;
  }

  if (mode === 'confluence') {
    return <ConfluenceCrawler onBack={() => setMode('select')} />;
  }

  // Mode Selection Screen
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Upload className="h-6 w-6" /> Import Tasks
        </h1>
        <p className="mb-6 text-gray-600">Choose an import method:</p>

        <div className="space-y-4">
          <Button
            variant="outline"
            size="md"
            onClick={() => setMode('file')}
            className="h-auto w-full justify-start p-4"
          >
            <FileSpreadsheet className="h-8 w-8 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">File Import (CSV / XLSX)</div>
              <div className="text-sm text-gray-500">Import tasks from a spreadsheet file</div>
            </div>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setMode('confluence')}
            className="h-auto w-full justify-start p-4"
          >
            <Globe className="h-8 w-8 text-purple-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Confluence Crawler</div>
              <div className="text-sm text-gray-500">Crawl tasks from a Confluence page table</div>
            </div>
          </Button>
        </div>

        <div className="mt-6 text-center">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
