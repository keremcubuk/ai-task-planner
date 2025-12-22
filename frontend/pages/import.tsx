import { useState } from 'react';
import { useRouter } from 'next/router';
import { Upload, Globe, FileSpreadsheet } from 'lucide-react';
import FileImport from '../components/import/FileImport';
import ConfluenceCrawler from '../components/import/ConfluenceCrawler';

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
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
          <Upload className="w-6 h-6" /> Import Tasks
        </h1>
        <p className="text-gray-600 mb-6">Choose an import method:</p>

        <div className="space-y-4">
          <button
            onClick={() => setMode('file')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center gap-4"
          >
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">File Import (CSV / XLSX)</div>
              <div className="text-sm text-gray-500">Import tasks from a spreadsheet file</div>
            </div>
          </button>

          <button
            onClick={() => setMode('confluence')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors flex items-center gap-4"
          >
            <Globe className="w-8 h-8 text-purple-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Confluence Crawler</div>
              <div className="text-sm text-gray-500">Crawl tasks from a Confluence page table</div>
            </div>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={() => router.back()} 
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}