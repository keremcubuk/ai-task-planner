import React, { useEffect, useState } from 'react';
import { InputSelectMulti } from './ui';
import { fetchTasks } from '../lib/api';

interface AiScoreSelectProps {
  selectedValues: string[];
  onToggleValue: (value: string) => void;
  onSelectAll: (values: string[]) => void;
}

export const AiScoreSelect: React.FC<AiScoreSelectProps> = ({
  selectedValues,
  onToggleValue,
  onSelectAll,
}) => {
  const [aiPriorities, setAiPriorities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        const response = await fetchTasks({});
        // Ensure response is an array
        const tasks = Array.isArray(response) ? response : [];
        // Get unique aiPriority values and sort descending
        const priorities = [...new Set(tasks.map(t => t.aiPriority))]
          .filter(p => p !== null && p !== undefined)
          .sort((a, b) => b - a)
          .map(p => p.toString());
        setAiPriorities(priorities);
      } catch (error) {
        console.error('Failed to fetch AI priorities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPriorities();
  }, []);

  const handleToggleAll = () => {
    if (selectedValues.length === aiPriorities.length) {
      // Deselect all
      onSelectAll([]);
    } else {
      // Select all
      onSelectAll(aiPriorities);
    }
  };

  return (
    <InputSelectMulti
      label="AI Priority"
      selectedValues={selectedValues}
      availableValues={aiPriorities}
      onToggleValue={onToggleValue}
      onToggleAll={handleToggleAll}
      searchPlaceholder="Search priorities..."
      selectedCountText="priorities"
      disabled={loading}
    />
  );
};
