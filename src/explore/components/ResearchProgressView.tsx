// src/explore/components/ResearchProgressView.tsx
// Main progress display for active research
// Sprint: progress-streaming-ui-v1
//
// DEX: Capability Agnosticism
// This component only consumes events - works regardless of underlying model.

import { useEffect } from 'react';
import { PhaseIndicator } from './PhaseIndicator';
import { SourceList } from './SourceList';
import type { ResearchProgressState } from '../hooks/useResearchProgress';

interface ResearchProgressViewProps {
  state: ResearchProgressState;
  onComplete?: (documentId?: string) => void;
  onRetry?: () => void;
  onSourceClick?: (url: string) => void;
}

export function ResearchProgressView({
  state,
  onComplete,
  onRetry,
  onSourceClick,
}: ResearchProgressViewProps) {
  // Trigger onComplete when phase changes to complete
  useEffect(() => {
    if (state.currentPhase === 'complete' && onComplete) {
      onComplete(state.completion?.documentId);
    }
  }, [state.currentPhase, state.completion?.documentId, onComplete]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30
                            border border-slate-200 dark:border-slate-700
                            flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-lg">
                monitoring
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Research Progress
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {getSubtitle(state)}
              </p>
            </div>
          </div>

          <PhaseIndicator phase={state.currentPhase} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current search query */}
        {state.currentQuery && (
          <CurrentQueryDisplay query={state.currentQuery} />
        )}

        {/* Branch progress */}
        {state.currentBranch && (
          <BranchProgress branch={state.currentBranch} />
        )}

        {/* Source list */}
        <div className="pt-2">
          <SourceList
            sources={state.sources}
            onSourceClick={onSourceClick || ((url) => window.open(url, '_blank'))}
          />
        </div>

        {/* Error state */}
        {state.currentPhase === 'error' && state.error && (
          <ErrorDisplay error={state.error} onRetry={onRetry} />
        )}

        {/* Completion state */}
        {state.currentPhase === 'complete' && state.completion && (
          <CompletionDisplay
            duration={state.completion.duration}
            sourceCount={state.completion.sourceCount}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Subcomponents
// =============================================================================

function getSubtitle(state: ResearchProgressState): string {
  switch (state.currentPhase) {
    case 'idle':
      return 'Waiting to start...';
    case 'research':
      return state.currentBranch
        ? `Branch: ${state.currentBranch.label}`
        : 'Collecting evidence...';
    case 'writing':
      return 'Generating document...';
    case 'complete':
      return `Completed in ${formatDuration(state.completion?.duration ?? 0)}`;
    case 'error':
      return 'Research failed';
    default:
      return '';
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

interface CurrentQueryDisplayProps {
  query: string;
}

function CurrentQueryDisplay({ query }: CurrentQueryDisplayProps) {
  const truncated = query.length > 50 ? query.slice(0, 47) + '...' : query;

  return (
    <div className="flex items-start gap-2 p-3 rounded-lg
                    bg-blue-50 dark:bg-blue-900/20
                    border border-blue-200 dark:border-blue-800/50">
      <span className="material-symbols-outlined text-blue-500 animate-pulse">
        search
      </span>
      <div>
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-0.5">
          Searching
        </p>
        <p className="text-sm text-blue-800 dark:text-blue-200 font-mono">
          "{truncated}"
        </p>
      </div>
    </div>
  );
}

interface BranchProgressProps {
  branch: { id: string; label: string };
}

function BranchProgress({ branch }: BranchProgressProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <span className="material-symbols-outlined text-sm">account_tree</span>
      <span>Processing: {branch.label}</span>
    </div>
  );
}

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20
                    border border-red-200 dark:border-red-800/50">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-red-500 text-xl">
          error
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Research Failed
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-1.5 text-sm font-medium
                         bg-red-100 dark:bg-red-900/40
                         text-red-700 dark:text-red-300
                         rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60
                         transition-colors"
            >
              Retry Research
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface CompletionDisplayProps {
  duration: number;
  sourceCount: number;
}

function CompletionDisplay({ duration, sourceCount }: CompletionDisplayProps) {
  return (
    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20
                    border border-green-200 dark:border-green-800/50
                    animate-scale-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40
                        flex items-center justify-center">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl">
            check_circle
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            Research Complete
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            {sourceCount} sources analyzed in {formatDuration(duration)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResearchProgressView;
