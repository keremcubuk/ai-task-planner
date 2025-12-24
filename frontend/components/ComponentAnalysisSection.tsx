import React from 'react';
import { ChevronDown, ChevronUp, Cpu, Layers } from 'lucide-react';
import { ComponentAnalysisResult, OllamaStatus } from '../lib/api';

interface ComponentAnalysisSectionProps {
  ollamaStatus: OllamaStatus | null;
  useOllama: boolean;
  setUseOllama: (value: boolean) => void;
  loadComponentAnalysis: () => void;
  componentLoading: boolean;
  componentData: ComponentAnalysisResult | null;
  expandedComponents: Set<string>;
  toggleComponentExpand: (componentName: string) => void;
  onTaskClick: (taskId: number) => void;
}

export function ComponentAnalysisSection({
  ollamaStatus,
  useOllama,
  setUseOllama,
  loadComponentAnalysis,
  componentLoading,
  componentData,
  expandedComponents,
  toggleComponentExpand,
  onTaskClick,
}: ComponentAnalysisSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Layers size={20} /> UI Component Analysis
        </h3>
        <div className="flex items-center gap-4">
          {/* Ollama Status Indicator */}
          <div className="flex items-center gap-2">
            <Cpu
              size={16}
              className={
                ollamaStatus?.available ? 'text-green-500' : 'text-gray-400'
              }
            />
            <span
              className={`text-sm ${
                ollamaStatus?.available ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {ollamaStatus?.available
                ? 'Ollama Active'
                : 'Ollama Offline (Pattern Mode)'}
            </span>
          </div>
          {/* Toggle for Ollama usage */}
          {ollamaStatus?.available && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useOllama}
                onChange={(e) => setUseOllama(e.target.checked)}
                className="rounded border-gray-300"
              />
              Use AI
            </label>
          )}
          <button
            onClick={loadComponentAnalysis}
            disabled={componentLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
          >
            {componentLoading ? 'Analyzing...' : 'Analyze Components'}
          </button>
        </div>
      </div>

      {componentData && (
        <div>
          <div className="text-sm text-gray-500 mb-4">
            Analyzed {componentData.analyzedTasks} of {componentData.totalTasks}{' '}
            tasks. Found {componentData.components.length} unique components.
          </div>

          {componentData.components.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No UI components detected in task descriptions.
            </div>
          ) : (
            <div className="space-y-2">
              {componentData.components.map((component) => {
                const criticalityScore =
                  component.activeTasks > 0
                    ? (component.activeTasks / component.count) * 100
                    : 0;
                const isCritical = component.activeTasks >= 3;

                return (
                  <div
                    key={component.name}
                    className={`border rounded-lg ${
                      isCritical ? 'border-red-300 bg-red-50' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleComponentExpand(component.name)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {component.name}
                        </span>

                        {/* Active Tasks Badge */}
                        {component.activeTasks > 0 && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            {component.activeTasks} aktif
                          </span>
                        )}

                        {/* Completed Tasks Badge */}
                        {component.completedTasks > 0 && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            {component.completedTasks} tamamlandı
                          </span>
                        )}

                        {/* Total Badge */}
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Toplam: {component.count}
                        </span>

                        {/* Critical Warning */}
                        {isCritical && (
                          <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
                            ⚠️ KRİTİK
                          </span>
                        )}
                      </div>
                      {expandedComponents.has(component.name) ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </button>

                    {expandedComponents.has(component.name) && (
                      <div className="px-4 pb-3 border-t bg-gray-50">
                        <div className="pt-3">
                          {/* Statistics */}
                          <div className="mb-3 p-3 bg-white rounded border text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-gray-500">
                                  Kritiklik Skoru:
                                </span>
                                <span
                                  className={`ml-2 font-bold ${
                                    criticalityScore > 50
                                      ? 'text-red-600'
                                      : 'text-green-600'
                                  }`}
                                >
                                  {criticalityScore.toFixed(0)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Toplam Sorun:
                                </span>
                                <span className="ml-2 font-bold text-gray-900">
                                  {component.count}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Active Tasks Section */}
                          {component.tasks.filter(
                            (t) => t.status !== 'done' && t.status !== 'completed',
                          ).length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                                🔴 Aktif Sorunlar ({component.activeTasks})
                              </h4>
                              <div className="space-y-2">
                                {component.tasks
                                  .filter(
                                    (t) =>
                                      t.status !== 'done' &&
                                      t.status !== 'completed',
                                  )
                                  .map((task) => (
                                    <div
                                      key={task.id}
                                      className="text-sm bg-white p-2 rounded border border-red-200"
                                    >
                                      <div className="flex items-start gap-2">
                                        <a
                                          href={`/tasks/${task.id}`}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            onTaskClick(task.id);
                                          }}
                                          className="text-indigo-600 hover:text-indigo-800 font-medium flex-1"
                                        >
                                          #{task.id}: {task.title}
                                        </a>
                                        {task.severity && (
                                          <span
                                            className={`text-xs px-2 py-0.5 rounded ${
                                              task.severity === 'critical'
                                                ? 'bg-red-100 text-red-800'
                                                : task.severity === 'major'
                                                  ? 'bg-orange-100 text-orange-800'
                                                  : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                          >
                                            {task.severity}
                                          </span>
                                        )}
                                      </div>
                                      {task.description && (
                                        <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Completed Tasks Section */}
                          {component.tasks.filter(
                            (t) => t.status === 'done' || t.status === 'completed',
                          ).length > 0 && (
                            <div>
                              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                                ✅ Geçmiş Sorunlar ({component.completedTasks})
                              </h4>
                              <div className="space-y-2">
                                {component.tasks
                                  .filter(
                                    (t) =>
                                      t.status === 'done' ||
                                      t.status === 'completed',
                                  )
                                  .slice(0, 5)
                                  .map((task) => (
                                    <div
                                      key={task.id}
                                      className="text-sm bg-white p-2 rounded border border-green-200 opacity-75"
                                    >
                                      <a
                                        href={`/tasks/${task.id}`}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          onTaskClick(task.id);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                                      >
                                        #{task.id}: {task.title}
                                      </a>
                                      {task.description && (
                                        <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                                          {task.description}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                {component.tasks.filter(
                                  (t) =>
                                    t.status === 'done' ||
                                    t.status === 'completed',
                                ).length > 5 && (
                                  <p className="text-xs text-gray-500 italic">
                                    +
                                    {component.tasks.filter(
                                      (t) =>
                                        t.status === 'done' ||
                                        t.status === 'completed',
                                    ).length - 5}{' '}
                                    daha fazla tamamlanmış task
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!componentData && !componentLoading && (
        <div className="text-gray-500 text-center py-8">
          Click &quot;Analyze Components&quot; to detect UI components mentioned in
          task descriptions.
          <br />
          <span className="text-sm">
            {ollamaStatus?.available
              ? 'Using Ollama LLM for intelligent detection.'
              : 'Using pattern matching (install Ollama for better results).'}
          </span>
        </div>
      )}
    </div>
  );
}
