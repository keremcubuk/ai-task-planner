import React from 'react';
import { ChevronDown, ChevronUp, Cpu, Layers } from 'lucide-react';
import { ComponentAnalysisResult, OllamaStatus } from '../lib/api';
import { Badge } from './ui';

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
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
          <Layers size={20} /> UI Component Analysis
        </h3>
        <div className="flex items-center gap-4">
          {/* Ollama Status Indicator */}
          <div className="flex items-center gap-2">
            <Cpu
              size={16}
              className={ollamaStatus?.available ? 'text-green-500' : 'text-gray-400'}
            />
            <span
              className={`text-sm ${ollamaStatus?.available ? 'text-green-600' : 'text-gray-500'}`}
            >
              {ollamaStatus?.available ? 'Ollama Active' : 'Ollama Offline (Pattern Mode)'}
            </span>
          </div>
          {/* Toggle for Ollama usage */}
          {ollamaStatus?.available && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useOllama}
                onChange={e => setUseOllama(e.target.checked)}
                className="rounded border-gray-300"
              />
              Use AI
            </label>
          )}
          <button
            onClick={loadComponentAnalysis}
            disabled={componentLoading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {componentLoading ? 'Analyzing...' : 'Analyze Components'}
          </button>
        </div>
      </div>

      {componentData && (
        <div>
          <div className="mb-4 text-sm text-gray-500">
            Analyzed {componentData.analyzedTasks} of {componentData.totalTasks} tasks. Found{' '}
            {componentData.components.length} unique components.
          </div>

          {componentData.components.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No UI components detected in task descriptions.
            </div>
          ) : (
            <div className="space-y-2">
              {componentData.components.map(component => {
                const criticalityScore =
                  component.activeTasks > 0 ? (component.activeTasks / component.count) * 100 : 0;
                const isCritical = component.activeTasks >= 3;

                return (
                  <div
                    key={component.name}
                    className={`rounded-lg border ${isCritical ? 'border-red-300 bg-red-50' : ''}`}
                  >
                    <button
                      onClick={() => toggleComponentExpand(component.name)}
                      className="flex w-full items-center justify-between px-4 py-3 hover:rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-medium text-gray-900">{component.name}</span>

                        {/* Active Tasks Badge */}
                        {component.activeTasks > 0 && (
                          <Badge color="red" size="sm" rounded="md">
                            {component.activeTasks} aktif
                          </Badge>
                        )}

                        {/* Completed Tasks Badge */}
                        {component.completedTasks > 0 && (
                          <Badge color="green" size="sm" rounded="md">
                            {component.completedTasks} tamamlandı
                          </Badge>
                        )}

                        {/* Total Badge */}
                        <Badge color="gray" size="sm" rounded="md">
                          Toplam: {component.count}
                        </Badge>

                        {/* Critical Warning */}
                        {isCritical && (
                          <Badge color="red" variant="solid" size="sm" rounded="md">
                            ⚠️ KRİTİK
                          </Badge>
                        )}
                      </div>
                      {expandedComponents.has(component.name) ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </button>

                    {expandedComponents.has(component.name) && (
                      <div className="border-t bg-gray-50 px-4 pb-3">
                        <div className="pt-3">
                          {/* Statistics */}
                          <div className="mb-3 rounded border bg-white p-3 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-gray-500">Kritiklik Skoru:</span>
                                <span
                                  className={`ml-2 font-bold ${
                                    criticalityScore > 50 ? 'text-red-600' : 'text-green-600'
                                  }`}
                                >
                                  {criticalityScore.toFixed(0)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Toplam Sorun:</span>
                                <span className="ml-2 font-bold text-gray-900">
                                  {component.count}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Active Tasks Section */}
                          {component.tasks.filter(
                            t => t.status !== 'done' && t.status !== 'completed'
                          ).length > 0 && (
                            <div className="mb-4">
                              <h4 className="mb-2 flex items-center gap-2 font-semibold text-red-700">
                                🔴 Aktif Sorunlar ({component.activeTasks})
                              </h4>
                              <div className="space-y-2">
                                {component.tasks
                                  .filter(t => t.status !== 'done' && t.status !== 'completed')
                                  .map(task => (
                                    <div
                                      key={task.id}
                                      className="rounded border border-red-200 bg-white p-2 text-sm"
                                    >
                                      <div className="flex items-start gap-2">
                                        <a
                                          href={`/tasks/${task.id}`}
                                          onClick={e => {
                                            e.preventDefault();
                                            onTaskClick(task.id);
                                          }}
                                          className="flex-1 font-medium text-indigo-600 hover:text-indigo-800"
                                        >
                                          #{task.id}: {task.title}
                                        </a>
                                        {task.severity && (
                                          <span
                                            className={`rounded px-2 py-0.5 text-xs ${
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
                                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
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
                            t => t.status === 'done' || t.status === 'completed'
                          ).length > 0 && (
                            <div>
                              <h4 className="mb-2 flex items-center gap-2 font-semibold text-green-700">
                                ✅ Geçmiş Sorunlar ({component.completedTasks})
                              </h4>
                              <div className="space-y-2">
                                {component.tasks
                                  .filter(t => t.status === 'done' || t.status === 'completed')
                                  .slice(0, 5)
                                  .map(task => (
                                    <div
                                      key={task.id}
                                      className="rounded border border-green-200 bg-white p-2 text-sm opacity-75"
                                    >
                                      <a
                                        href={`/tasks/${task.id}`}
                                        onClick={e => {
                                          e.preventDefault();
                                          onTaskClick(task.id);
                                        }}
                                        className="font-medium text-indigo-600 hover:text-indigo-800"
                                      >
                                        #{task.id}: {task.title}
                                      </a>
                                      {task.description && (
                                        <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                                          {task.description}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                {component.tasks.filter(
                                  t => t.status === 'done' || t.status === 'completed'
                                ).length > 5 && (
                                  <p className="text-xs text-gray-500 italic">
                                    +
                                    {component.tasks.filter(
                                      t => t.status === 'done' || t.status === 'completed'
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
        <div className="py-8 text-center text-gray-500">
          Click &quot;Analyze Components&quot; to detect UI components mentioned in task
          descriptions.
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
