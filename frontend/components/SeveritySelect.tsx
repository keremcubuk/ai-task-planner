import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SeveritySelectProps {
  value: string;
  onChange: (value: string) => void;
}

const SEVERITIES = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'low', label: 'Low' }
];

export const SeveritySelect: React.FC<SeveritySelectProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = SEVERITIES.find(s => s.value === value)?.label || 'All Severities';

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500 uppercase">Severity</label>
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left text-sm border border-gray-300 rounded-md px-3 py-2 flex justify-between items-center bg-white h-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <span className="truncate text-gray-900 block">{selectedLabel}</span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="p-1">
              {SEVERITIES.map(s => (
                <div 
                  key={s.value}
                  onClick={() => {
                    onChange(s.value);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer rounded hover:bg-gray-50 ${
                    value === s.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
