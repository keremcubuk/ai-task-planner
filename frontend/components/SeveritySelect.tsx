import React from 'react';
import { InputSelect } from './ui';

interface SeveritySelectProps {
  value: string;
  onChange: (value: string) => void;
}

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'low', label: 'Low' },
];

export const SeveritySelect: React.FC<SeveritySelectProps> = ({ value, onChange }) => {
  return (
    <InputSelect
      label="Severity"
      value={value}
      onChange={onChange}
      options={SEVERITY_OPTIONS}
      placeholder="All Severities"
      size="md"
    />
  );
};
