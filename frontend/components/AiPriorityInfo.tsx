import React from 'react';

export const AiPriorityInfo: React.FC = () => {
  return (
    <div className="space-y-4 text-gray-700">
      <p>The AI Priority score is calculated based on five weighted factors:</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
          <h4 className="mb-1 font-bold text-blue-900">1. Severity (3x)</h4>
          <p className="text-xs">
            Technical impact of the task. Critical issues get higher points.
          </p>
        </div>

        <div className="rounded-lg border border-green-100 bg-green-50 p-3">
          <h4 className="mb-1 font-bold text-green-900">2. Due Date (2x)</h4>
          <p className="text-xs">
            Urgency based on deadline proximity. Overdue tasks get max points.
          </p>
        </div>

        <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3">
          <h4 className="mb-1 font-bold text-yellow-900">3. Transition (4x)</h4>
          <p className="text-xs">
            Time since last status change. Stagnant tasks get higher priority.
          </p>
        </div>

        <div className="rounded-lg border border-orange-100 bg-orange-50 p-3">
          <h4 className="mb-1 font-bold text-orange-900">4. Task Age (1x)</h4>
          <p className="text-xs">
            Overall age of task. Normalized to 0-1 range (capped at 30 days).
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
        <h4 className="mb-2 font-bold text-purple-900">5. Manual Priority (5x)</h4>
        <p className="text-sm">Manager/Business factor. Highest weight impact.</p>
        <ul className="mt-2 list-inside list-disc text-sm text-purple-800">
          <li>0: Standard Priority</li>
          <li>3: High Importance</li>
          <li>5: Production Issue / Emergency</li>
        </ul>
      </div>

      <p className="mt-4 border-t pt-2 text-xs text-gray-500 italic">
        Score = (Severity × 3) + (Due Date × 2) + (Transition × 4) + (Age × 1) + (Manual × 5)
      </p>
    </div>
  );
};
