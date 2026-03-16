import { useState } from 'react';
import { useRouter } from 'next/router';
import { FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { importCsv, importXlsx } from '../../lib/api';
import { Button } from '../ui';

interface FileImportProps {
  onBack: () => void;
}

export default function FileImport({ onBack }: FileImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async (type: 'csv' | 'xlsx') => {
    if (!file) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      let result;
      if (type === 'csv') {
        result = await importCsv(file);
      } else {
        result = await importXlsx(file);
      }
      
      if (result.count === 0) {
        setError('No tasks imported. Please check your file column names (Title, Description, Status, Severity, etc.)');
      } else {
        setMessage(`Import successful! ${result.count} task(s) imported.`);
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (err) {
      setError('Import failed. Check console.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <Button
          onClick={onBack}
          variant="ghost"
          size="md"
          className="mb-4"
          leftIcon={<ArrowLeft size={16} />}
        >
          Back to Import Options
        </Button>

        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
          <FileSpreadsheet className="w-6 h-6" /> File Import
        </h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File (CSV / XLSX)
          </label>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {error && <div className="mb-4 text-sm text-center font-medium text-red-600">{error}</div>}
        {message && <div className="mb-4 text-sm text-center font-medium text-green-600">{message}</div>}

        <div className="flex gap-4">
          <Button
            onClick={() => handleImport('csv')}
            disabled={!file || loading}
            variant="primary"
            size="md"
            className="flex-1"
            loading={loading}
          >
            Import CSV
          </Button>
          <Button
            onClick={() => handleImport('xlsx')}
            disabled={!file || loading}
            variant="success"
            size="md"
            className="flex-1"
            loading={loading}
          >
            Import XLSX
          </Button>
        </div>
      </div>
    </div>
  );
}
