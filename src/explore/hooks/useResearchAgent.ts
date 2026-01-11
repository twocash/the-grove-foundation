// src/explore/hooks/useResearchAgent.ts
// React hook for Research Agent
// Sprint: sprout-research-v1, Phase 5b
//
// This hook provides React integration for the Research Agent service,
// managing execution state and progress tracking.

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  createResearchAgent,
  type ResearchAgent,
  type ResearchAgentConfig,
  type ResearchProgressEvent,
  type ResearchExecutionResult,
} from '../services/research-agent';
import type { ResearchSprout } from '@core/schema/research-sprout';

// =============================================================================
// Types
// =============================================================================

/**
 * Hook configuration
 */
export interface UseResearchAgentOptions extends ResearchAgentConfig {
  /** Called on progress events */
  onProgress?: (event: ResearchProgressEvent) => void;

  /** Called when execution completes */
  onComplete?: (result: ResearchExecutionResult) => void;

  /** Called when execution fails */
  onError?: (error: Error) => void;
}

/**
 * Execution state
 */
export interface ResearchExecutionState {
  /** Whether agent is currently executing */
  isExecuting: boolean;

  /** Current sprout being processed */
  currentSproutId: string | null;

  /** Progress events from current execution */
  progressEvents: ResearchProgressEvent[];

  /** Current branch being processed */
  currentBranchId: string | null;

  /** Last execution result */
  lastResult: ResearchExecutionResult | null;

  /** Last error message */
  lastError: string | null;
}

/**
 * Hook result
 */
export interface UseResearchAgentResult {
  /** Current execution state */
  state: ResearchExecutionState;

  /** Execute research for a sprout */
  execute: (sprout: ResearchSprout) => Promise<ResearchExecutionResult>;

  /** Cancel ongoing execution */
  cancel: () => void;

  /** Clear progress and results */
  reset: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const INITIAL_STATE: ResearchExecutionState = {
  isExecuting: false,
  currentSproutId: null,
  progressEvents: [],
  currentBranchId: null,
  lastResult: null,
  lastError: null,
};

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to manage research agent execution
 *
 * @example
 * ```tsx
 * const { state, execute, cancel } = useResearchAgent({
 *   simulationMode: true,
 *   onProgress: (event) => console.log('Progress:', event),
 *   onComplete: (result) => console.log('Done:', result),
 * });
 *
 * // Execute research
 * const result = await execute(sprout);
 * ```
 */
export function useResearchAgent(
  options: UseResearchAgentOptions = {}
): UseResearchAgentResult {
  const {
    onProgress,
    onComplete,
    onError,
    ...config
  } = options;

  // State
  const [state, setState] = useState<ResearchExecutionState>(INITIAL_STATE);

  // Agent ref (persists across renders)
  const agentRef = useRef<ResearchAgent | null>(null);

  // Callback refs (avoid stale closures)
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onProgress, onComplete, onError]);

  // Create agent on mount
  useEffect(() => {
    agentRef.current = createResearchAgent(config);

    return () => {
      // Cancel any ongoing execution on unmount
      agentRef.current?.cancel();
      agentRef.current = null;
    };
    // Only recreate if config changes significantly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.simulationMode, config.maxApiCalls]);

  // Progress handler
  const handleProgress = useCallback((event: ResearchProgressEvent) => {
    setState(prev => {
      const newState = {
        ...prev,
        progressEvents: [...prev.progressEvents, event],
      };

      // Track current branch
      if (event.type === 'branch-started') {
        newState.currentBranchId = event.branchId;
      } else if (event.type === 'branch-completed') {
        newState.currentBranchId = null;
      } else if (event.type === 'error') {
        newState.lastError = event.message;
      }

      return newState;
    });

    // Call user callback
    onProgressRef.current?.(event);
  }, []);

  // Execute research
  const execute = useCallback(async (sprout: ResearchSprout): Promise<ResearchExecutionResult> => {
    if (!agentRef.current) {
      throw new Error('Research agent not initialized');
    }

    if (state.isExecuting) {
      throw new Error('Agent is already executing');
    }

    // Reset state for new execution
    setState({
      ...INITIAL_STATE,
      isExecuting: true,
      currentSproutId: sprout.id,
    });

    try {
      const result = await agentRef.current.execute(sprout, handleProgress);

      setState(prev => ({
        ...prev,
        isExecuting: false,
        currentSproutId: null,
        currentBranchId: null,
        lastResult: result,
        lastError: result.execution.errorMessage ?? null,
      }));

      // Call completion callback
      if (result.success) {
        onCompleteRef.current?.(result);
      } else if (result.execution.errorMessage) {
        onErrorRef.current?.(new Error(result.execution.errorMessage));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      setState(prev => ({
        ...prev,
        isExecuting: false,
        currentSproutId: null,
        currentBranchId: null,
        lastError: errorMessage,
      }));

      onErrorRef.current?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [state.isExecuting, handleProgress]);

  // Cancel execution
  const cancel = useCallback(() => {
    agentRef.current?.cancel();
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // Memoized result
  const result = useMemo<UseResearchAgentResult>(() => ({
    state,
    execute,
    cancel,
    reset,
  }), [state, execute, cancel, reset]);

  return result;
}

// =============================================================================
// Convenience Hooks
// =============================================================================

/**
 * Hook to check if agent is currently executing
 */
export function useIsResearchExecuting(): boolean {
  const { state } = useResearchAgent();
  return state.isExecuting;
}

/**
 * Hook to get current execution progress
 */
export function useResearchProgress(): ResearchProgressEvent[] {
  const { state } = useResearchAgent();
  return state.progressEvents;
}

// =============================================================================
// Exports
// =============================================================================

export type {
  UseResearchAgentOptions,
  ResearchExecutionState,
  UseResearchAgentResult,
};
