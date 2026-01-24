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
    console.log(`[ResearchExecution] Starting research for sprout: ${sprout.id}`);

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
      if (result.success && result.document) {
        // Transition to completed
        await transitionStatus(sprout.id, 'completed', 'Research pipeline completed', 'system');

        // Update with results - including the full ResearchDocument for display
        // S22-WP: Include branches and evidence for DocumentViewer display
        await updateResults(sprout.id, {
          // S22-WP: Raw research data for evidence display in center panel
          branches: result.branches,
          evidence: result.rawEvidence,
          synthesis: {
            documentId: result.document.id,
            model: result.document.metadata?.modelId || 'unknown',
            generatedAt: result.document.metadata?.generatedAt || new Date().toISOString(),
            wordCount: result.document.metadata?.wordCount || 0,
            status: 'complete',
          },
          execution: {
            startedAt: result.execution.startedAt,
            completedAt: result.execution.completedAt,
            apiCallCount: 0, // Not tracked in pipeline result
            errorMessage: undefined,
          },
          // Store full document for direct display (results-wiring-v1)
          researchDocument: result.document,
        });
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
