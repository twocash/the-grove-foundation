// src/explore/context/ResearchExecutionContext.tsx
// Research Execution Context - Orchestrates pipeline execution with progress streaming
// Sprint: progress-streaming-ui-v1 (wiring phase)
//
// This context bridges:
// - ResearchSproutContext (sprout CRUD)
// - useResearchProgress (progress UI state)
// - executeResearchPipeline (actual execution)

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { ResearchSprout } from '@core/schema/research-sprout';
import { executeResearchPipeline, type PipelineProgressEvent, type PipelineResult } from '../services/research-pipeline';
import { useResearchProgress, type ResearchProgressState } from '../hooks/useResearchProgress';
import { useResearchSprouts } from './ResearchSproutContext';

// =============================================================================
// Types
// =============================================================================

export interface ResearchExecutionContextValue {
  /** Current progress state */
  progressState: ResearchProgressState;

  /** Currently executing sprout ID (if any) */
  executingSproutId: string | null;

  /** Start research execution for a sprout */
  startResearch: (sprout: ResearchSprout) => Promise<PipelineResult>;

  /** Reset progress state (for new execution) */
  resetProgress: () => void;

  /** Manually push an event (for testing/simulation) */
  pushEvent: (event: PipelineProgressEvent) => void;
}

// =============================================================================
// Context
// =============================================================================

const ResearchExecutionContext = createContext<ResearchExecutionContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface ResearchExecutionProviderProps {
  children: ReactNode;
}

export function ResearchExecutionProvider({ children }: ResearchExecutionProviderProps) {
  // Progress state management
  const { state: progressState, pushEvent, reset: resetProgress } = useResearchProgress();

  // Sprout context for status transitions and result updates
  const { transitionStatus, updateResults } = useResearchSprouts();

  // Track executing sprout
  const [executingSproutId, setExecutingSproutId] = React.useState<string | null>(null);

  // Main execution function
  const startResearch = useCallback(async (sprout: ResearchSprout): Promise<PipelineResult> => {
    console.log(`[ResearchExecution] Starting research for sprout: ${sprout.id} with ${sprout.branches?.length || 0} branches`);

    // Reset progress for new execution
    resetProgress();
    setExecutingSproutId(sprout.id);

    try {
      // Transition sprout to active
      await transitionStatus(sprout.id, 'active', 'Starting research pipeline', 'system');
      console.log(`[ResearchExecution] Sprout ${sprout.id} transitioned to active`);

      // Execute pipeline with progress callback
      const result = await executeResearchPipeline(
        sprout,
        undefined, // Use default config
        (event) => {
          // Forward events to progress hook
          console.log(`[ResearchExecution] Progress event:`, event.type);
          pushEvent(event);
        }
      );

      console.log(`[ResearchExecution] Pipeline completed:`, result.success ? 'SUCCESS' : 'FAILED');

      // Update sprout with results
      // S22-WP: Pipeline now returns evidence-only (no document)
      // Document generation is user-triggered from right panel
      if (result.success) {
        // Transition to completed - research is done, user can now trigger Writer
        await transitionStatus(sprout.id, 'completed', 'Research completed - ready for writing', 'system');

        // S22-WP: Store evidence-only results + canonical research
        // Document will be added later when user triggers Writer from right panel

        // S23-SFR DEBUG: Log canonical research BEFORE calling updateResults
        console.log(`[ResearchExecution] BEFORE updateResults - canonical research:`, {
          hasCanonical: !!result.canonicalResearch,
          title: result.canonicalResearch?.title?.slice(0, 50),
          sectionsCount: result.canonicalResearch?.sections?.length || 0,
          sourcesCount: result.canonicalResearch?.sources?.length || 0,
          findingsCount: result.canonicalResearch?.key_findings?.length || 0,
          execSummaryLength: result.canonicalResearch?.executive_summary?.length || 0,
          rawKeys: result.canonicalResearch ? Object.keys(result.canonicalResearch) : [],
        });

        await updateResults(sprout.id, {
          // Raw research data for evidence display in center panel
          branches: result.branches,
          evidence: result.rawEvidence,
          // S22-WP: 100% lossless canonical research for full-fidelity display
          canonicalResearch: result.canonicalResearch,
          // No synthesis yet - Writer is user-triggered
          execution: {
            startedAt: result.execution.startedAt,
            completedAt: result.execution.completedAt,
            apiCallCount: 0,
            errorMessage: undefined,
          },
          // researchDocument will be set when user triggers Writer
        });

        console.log(`[ResearchExecution] AFTER updateResults - Evidence saved: ${result.rawEvidence?.length || 0} items`);
        console.log(`[ResearchExecution] AFTER updateResults - Canonical research saved: ${result.canonicalResearch?.title || 'none'}`);
        console.log(`[ResearchExecution] User can now trigger Writer from right panel`);
      } else if (result.error) {
        // Transition to blocked on error
        await transitionStatus(
          sprout.id,
          'blocked',
          `Pipeline error: ${result.error.message}`,
          'system'
        );

        // S22-WP: Preserve research data even if writing failed (partial success)
        await updateResults(sprout.id, {
          branches: result.branches,
          evidence: result.rawEvidence,
          // S22-WP: Include canonical research on partial failure
          canonicalResearch: result.canonicalResearch,
          execution: {
            startedAt: result.execution.startedAt,
            completedAt: result.execution.completedAt,
            apiCallCount: 0,
            errorMessage: result.error.message,
          },
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ResearchExecution] Execution failed:`, errorMessage);

      // Push error event
      pushEvent({
        type: 'pipeline-error',
        phase: 'research',
        message: errorMessage,
      });

      // Transition to blocked
      try {
        await transitionStatus(sprout.id, 'blocked', errorMessage, 'system');
      } catch {
        console.error('[ResearchExecution] Failed to transition sprout to blocked');
      }

      return {
        success: false,
        error: { phase: 'research', message: errorMessage },
        execution: {
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          researchDuration: 0,
          writingDuration: 0,
        },
      };
    } finally {
      setExecutingSproutId(null);
    }
  }, [resetProgress, transitionStatus, updateResults, pushEvent]);

  // Memoized context value
  const value = useMemo<ResearchExecutionContextValue>(() => ({
    progressState,
    executingSproutId,
    startResearch,
    resetProgress,
    pushEvent,
  }), [progressState, executingSproutId, startResearch, resetProgress, pushEvent]);

  return (
    <ResearchExecutionContext.Provider value={value}>
      {children}
    </ResearchExecutionContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Access research execution context
 */
export function useResearchExecution(): ResearchExecutionContextValue {
  const context = useContext(ResearchExecutionContext);
  if (!context) {
    throw new Error(
      'useResearchExecution must be used within a ResearchExecutionProvider'
    );
  }
  return context;
}

// =============================================================================
// Exports
// =============================================================================

export type { ResearchExecutionContextValue };
