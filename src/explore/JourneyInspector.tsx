// src/explore/JourneyInspector.tsx
// Journey detail and action inspector panel

import { useMemo } from 'react';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';

interface JourneyInspectorProps {
  journeyId: string;
}

export function JourneyInspector({ journeyId }: JourneyInspectorProps) {
  const { getJourney, startJourney, exitJourney, activeJourneyId, visitedNodes, schema } = useNarrativeEngine();
  const { navigateTo, closeInspector } = useWorkspaceUI();

  const journey = getJourney(journeyId);
  const isActive = activeJourneyId === journeyId;

  // Calculate journey progress
  const progress = useMemo(() => {
    if (!isActive || !schema?.nodes || !journey) return { visited: 0, total: 0, percent: 0 };

    // Count nodes that belong to this journey
    const journeyNodes = Object.values(schema.nodes).filter(
      (n) => n.journeyId === journeyId
    );
    const visited = visitedNodes.length;
    const total = journeyNodes.length;
    const percent = total > 0 ? Math.round((visited / total) * 100) : 0;

    return { visited, total, percent };
  }, [isActive, schema?.nodes, journey, journeyId, visitedNodes]);

  if (!journey) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <p>Journey not found</p>
      </div>
    );
  }

  const handleStart = () => {
    startJourney(journeyId);
    navigateTo(['explore']);
    closeInspector();
  };

  const handleContinue = () => {
    navigateTo(['explore']);
    closeInspector();
  };

  const handleExit = () => {
    exitJourney();
    closeInspector();
  };

  return (
    <div className="p-5 space-y-6">
      {/* Journey Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-border-light dark:border-slate-700 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
            {journey.icon || 'map'}
          </span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {journey.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>{journey.estimatedMinutes} min</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-4 bg-stone-50 dark:bg-slate-900/50 rounded-xl border border-border-light dark:border-slate-700">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {journey.description}
        </p>
      </div>

      {/* Target Aha */}
      {journey.targetAha && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg mt-0.5">
              lightbulb
            </span>
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">
                Key Insight
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200 italic">
                "{journey.targetAha}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress (if active) */}
      {isActive && progress.total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Progress</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {progress.visited} / {progress.total} nodes
            </span>
          </div>
          <div className="h-2 bg-stone-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        {isActive ? (
          <>
            <button
              onClick={handleContinue}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              Continue Journey
            </button>
            <button
              onClick={handleExit}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <span className="material-symbols-outlined text-lg">stop</span>
              Exit Journey
            </button>
          </>
        ) : (
          <button
            onClick={handleStart}
            className="w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 shadow-md transition-all"
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Start Journey
          </button>
        )}
      </div>

      {/* Linked Hub Info */}
      {journey.linkedHubId && (
        <div className="border-t border-border-light dark:border-border-dark pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-sm">hub</span>
            <span>Linked to {journey.linkedHubId} topic hub</span>
          </div>
        </div>
      )}
    </div>
  );
}
