import React from 'react';

export const AiPriorityInfo: React.FC = () => {
  return (
    <div className="space-y-4 text-gray-700">
        <p>The AI Priority score is calculated based on five weighted factors:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-1">1. Severity (3x)</h4>
                <p className="text-xs">Technical impact of the task. Critical issues get higher points.</p>
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <h4 className="font-bold text-green-900 mb-1">2. Due Date (2x)</h4>
                <p className="text-xs">Urgency based on deadline proximity. Overdue tasks get max points.</p>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <h4 className="font-bold text-yellow-900 mb-1">3. Transition (4x)</h4>
                <p className="text-xs">Time since last status change. Stagnant tasks get higher priority.</p>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <h4 className="font-bold text-orange-900 mb-1">4. Task Age (1x)</h4>
                <p className="text-xs">Overall age of task. Normalized to 0-1 range (capped at 30 days).</p>
            </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h4 className="font-bold text-purple-900 mb-2">5. Manual Priority (5x)</h4>
            <p className="text-sm">Manager/Business factor. Highest weight impact.</p>
            <ul className="list-disc list-inside mt-2 text-sm text-purple-800">
                <li>0: Standard Priority</li>
                <li>3: High Importance (Manager Request)</li>
                <li>5: Emergency / &quot;Fire&quot; Mode</li>
            </ul>
        </div>

        <p className="text-xs italic text-gray-500 mt-4 border-t pt-2">
            Score = (Severity × 3) + (Due Date × 2) + (Transition × 4) + (Age × 1) + (Manual × 5)
        </p>
    </div>
  );
};
