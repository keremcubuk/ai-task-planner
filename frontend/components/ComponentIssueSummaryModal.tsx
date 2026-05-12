'use client';

import React, { useCallback, useState } from 'react';
import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Badge } from './ui';
import { CompIssueScope, CompIssueSummary, generateComponentIssueSummary } from '../lib/api';

interface ComponentIssueSummaryModalProps {
  isOpen: boolean;
  componentName: string | null;
  onClose: () => void;
  ollamaAvailable: boolean;
}

interface ScopeState {
  loading: boolean;
  generating: boolean;
  error: string | null;
  data: CompIssueSummary | null;
  loaded: boolean;
}

const initialScopeState = (): ScopeState => ({
  loading: false,
  generating: false,
  error: null,
  data: null,
  loaded: false,
});

const SCOPE_LABEL: Record<CompIssueScope, string> = {
  open: 'Açık Sorunlar',
  all: 'Tümü',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR');
  } catch {
    return iso;
  }
}

function ScopePanel({
  state,
  scope,
  ollamaAvailable,
  onGenerate,
}: {
  state: ScopeState;
  scope: CompIssueScope;
  ollamaAvailable: boolean;
  onGenerate: (force: boolean) => void;
}) {
  if (state.loading) {
    return <div className="py-12 text-center text-sm text-gray-500">Yükleniyor...</div>;
  }

  if (state.error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <div className="mb-2 flex items-center gap-2 font-medium">
          <AlertTriangle size={16} /> Hata
        </div>
        <p>{state.error}</p>
        <button
          onClick={() => onGenerate(false)}
          disabled={state.generating || !ollamaAvailable}
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <RefreshCw size={14} /> Tekrar Dene
        </button>
      </div>
    );
  }

  if (!state.data) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-sm text-gray-600">
          Bu kapsam ({SCOPE_LABEL[scope]}) için henüz AI özeti üretilmedi.
        </p>
        <button
          onClick={() => onGenerate(false)}
          disabled={state.generating || !ollamaAvailable}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          title={ollamaAvailable ? '' : 'Ollama erişilemiyor'}
        >
          <Sparkles size={16} />
          {state.generating ? 'Üretiliyor...' : 'Özet Üret'}
        </button>
        {!ollamaAvailable && (
          <p className="mt-2 text-xs text-gray-500">
            Ollama (localhost:11434) çalışmıyor. Önce yerel Ollama servisini başlatın.
          </p>
        )}
      </div>
    );
  }

  const { data } = state;
  const stale = data.isStale === true;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color="blue" size="sm" rounded="md">
            {data.taskCount} ticket özetlendi
          </Badge>
          {typeof data.currentTaskCount === 'number' &&
            data.currentTaskCount !== data.taskCount && (
              <Badge color="gray" size="sm" rounded="md">
                Şu an: {data.currentTaskCount}
              </Badge>
            )}
          {stale && (
            <Badge color="yellow" size="sm" rounded="md">
              ⚠️ Güncel değil
            </Badge>
          )}
        </div>
        <button
          onClick={() => onGenerate(true)}
          disabled={state.generating || !ollamaAvailable}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          title={ollamaAvailable ? '' : 'Ollama erişilemiyor'}
        >
          <RefreshCw size={14} />
          {state.generating ? 'Üretiliyor...' : 'Yeniden Üret'}
        </button>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">Özet</h4>
        <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
          {data.summary}
        </div>
      </div>

      {data.focusAreas.length > 0 && (
        <div className="rounded-lg border bg-indigo-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-indigo-900">Odaklanılacak Konular</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-indigo-900">
            {data.focusAreas.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>Model: {data.model}</span>
        <span>Üretim: {formatDate(data.createdAt)}</span>
        <span>Son güncelleme: {formatDate(data.updatedAt)}</span>
      </div>
    </div>
  );
}

export function ComponentIssueSummaryModal({
  isOpen,
  componentName,
  onClose,
  ollamaAvailable,
}: ComponentIssueSummaryModalProps) {
  const [activeScope, setActiveScope] = useState<CompIssueScope>('open');
  const [scopeState, setScopeState] = useState<Record<CompIssueScope, ScopeState>>({
    open: initialScopeState(),
    all: initialScopeState(),
  });

  const updateState = useCallback((scope: CompIssueScope, patch: Partial<ScopeState>) => {
    setScopeState(prev => ({ ...prev, [scope]: { ...prev[scope], ...patch } }));
  }, []);

  const generate = useCallback(
    async (scope: CompIssueScope, force: boolean) => {
      if (!componentName) return;
      updateState(scope, { generating: true, error: null });
      try {
        const data = await generateComponentIssueSummary(componentName, scope, {
          force,
        });
        updateState(scope, { generating: false, data, loaded: true });
      } catch (err: unknown) {
        let msg = 'Özet üretilemedi';
        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as { response?: { data?: { message?: string } } }).response;
          if (response?.data?.message) msg = response.data.message;
        } else if (err instanceof Error) {
          msg = err.message;
        }
        updateState(scope, { generating: false, error: msg });
      }
    },
    [componentName, updateState]
  );

  // Note: State reset is handled by key={componentName} in parent component
  // Auto-load is disabled to avoid setState in effect - users click "Özet Üret" to load

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={componentName ? `AI Özet: ${componentName}` : 'AI Özet'}
    >
      {componentName && (
        <div>
          <div className="mb-4 flex border-b">
            {(['open', 'all'] as CompIssueScope[]).map(scope => (
              <button
                key={scope}
                onClick={() => setActiveScope(scope)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeScope === scope
                    ? 'border-b-2 border-indigo-600 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {SCOPE_LABEL[scope]}
              </button>
            ))}
          </div>

          <ScopePanel
            state={scopeState[activeScope]}
            scope={activeScope}
            ollamaAvailable={ollamaAvailable}
            onGenerate={force => generate(activeScope, force)}
          />
        </div>
      )}
    </Modal>
  );
}
