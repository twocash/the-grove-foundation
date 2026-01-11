// src/explore/hooks/useResearchQueueConsumer.ts
// React hook for Research Queue Consumer
// Sprint: sprout-research-v1, Phase 5a
//
// This hook connects the queue consumer service to React state and
// the ResearchSproutContext. It provides the bridge for the Research
// Agent (Phase 5b) to process pending sprouts.

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useResearchSprouts } from '../context/ResearchSproutContext';
import {
  createQueueConsumer,
  type QueueConsumer,
  type QueueConsumerConfig,
  type QueueConsumerState,
} from '../services/research-queue-consumer';
import type { ResearchSprout } from '@core/schema/research-sprout';

// =============================================================================
// Types
// =============================================================================

/**
 * Hook configuration
 */
export interface UseResearchQueueConsumerOptions extends QueueConsumerConfig {
  /**
   * Callback when a sprout is claimed and ready for execution
   * Return false to reject the claim and release the sprout
   */
  onClaim?: (sprout: ResearchSprout) => Promise<boolean>;

  /**
   * Whether the consumer is enabled (default: true)
   * When false, the consumer won't process any sprouts
   */
  enabled?: boolean;
}

/**
 * Hook return value
 */
export interface UseResearchQueueConsumerResult {
  /** Current consumer state */
  state: QueueConsumerState;

  /** Start the queue consumer */
  start: () => void;

  /** Stop the queue consumer */
  stop: () => void;

  /** Manually trigger a poll */
  poll: () => Promise<void>;

  /** Check if a sprout is being processed */
  isProcessing: (sproutId: string) => boolean;

  /** Mark a sprout as completed */
  markCompleted: (sproutId: string) => void;

  /** Mark a sprout as failed */
  markFailed: (sproutId: string, error: string) => void;
}

// =============================================================================
// Default State
// =============================================================================

const DEFAULT_STATE: QueueConsumerState = {
  isRunning: false,
  processingIds: [],
  claimedCount: 0,
  completedCount: 0,
  lastError: null,
  lastPollAt: null,
};

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to manage the research queue consumer
 *
 * This hook:
 * 1. Creates a queue consumer instance
 * 2. Binds it to the ResearchSproutContext
 * 3. Provides React state updates for consumer status
 * 4. Cleans up on unmount
 *
 * @example
 * ```tsx
 * const { state, start, stop, markCompleted } = useResearchQueueConsumer({
 *   onClaim: async (sprout) => {
 *     console.log('Processing:', sprout.id);
 *     // Start research agent execution...
 *     return true; // Accept the claim
 *   },
 *   pollInterval: 3000,
 * });
 *
 * // Start processing
 * useEffect(() => {
 *   start();
 *   return () => stop();
 * }, []);
 * ```
 */
export function useResearchQueueConsumer(
  options: UseResearchQueueConsumerOptions = {}
): UseResearchQueueConsumerResult {
  const {
    onClaim,
    enabled = true,
    ...config
  } = options;

  // Get context methods
  const { query, transitionStatus } = useResearchSprouts();

  // Track consumer state in React
  const [state, setState] = useState<QueueConsumerState>(DEFAULT_STATE);

  // Consumer instance ref (persists across renders)
  const consumerRef = useRef<QueueConsumer | null>(null);

  // Stable callback refs
  const onClaimRef = useRef(onClaim);
  onClaimRef.current = onClaim;

  // Query function for pending sprouts
  const queryPending = useCallback(() => {
    const result = query({ statuses: ['pending'] });
    return result.sprouts;
  }, [query]);

  // Claim handler that calls user callback
  const handleClaim = useCallback(async (sprout: ResearchSprout): Promise<boolean> => {
    if (onClaimRef.current) {
      return onClaimRef.current(sprout);
    }
    // Default: accept all claims
    return true;
  }, []);

  // Update state from consumer
  const syncState = useCallback(() => {
    if (consumerRef.current) {
      setState(consumerRef.current.getState());
    }
  }, []);

  // Create consumer on mount
  useEffect(() => {
    if (!enabled) {
      // Consumer disabled, clean up if exists
      if (consumerRef.current) {
        consumerRef.current.dispose();
        consumerRef.current = null;
        setState(DEFAULT_STATE);
      }
      return;
    }

    // Create new consumer
    consumerRef.current = createQueueConsumer(
      queryPending,
      transitionStatus,
      handleClaim,
      config
    );

    // Initial state sync
    syncState();

    // Cleanup on unmount
    return () => {
      if (consumerRef.current) {
        consumerRef.current.dispose();
        consumerRef.current = null;
      }
    };
    // Only recreate if enabled changes or context functions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, queryPending, transitionStatus, handleClaim]);

  // Sync state periodically while running
  useEffect(() => {
    if (!state.isRunning) return;

    // Sync state every second while running
    const syncInterval = setInterval(syncState, 1000);

    return () => clearInterval(syncInterval);
  }, [state.isRunning, syncState]);

  // Actions
  const start = useCallback(() => {
    if (consumerRef.current && enabled) {
      consumerRef.current.start();
      syncState();
    }
  }, [enabled, syncState]);

  const stop = useCallback(() => {
    if (consumerRef.current) {
      consumerRef.current.stop();
      syncState();
    }
  }, [syncState]);

  const poll = useCallback(async () => {
    if (consumerRef.current && enabled) {
      await consumerRef.current.poll();
      syncState();
    }
  }, [enabled, syncState]);

  const isProcessing = useCallback((sproutId: string): boolean => {
    return consumerRef.current?.isProcessing(sproutId) ?? false;
  }, []);

  const markCompleted = useCallback((sproutId: string) => {
    if (consumerRef.current) {
      consumerRef.current.markCompleted(sproutId);
      syncState();
    }
  }, [syncState]);

  const markFailed = useCallback((sproutId: string, error: string) => {
    if (consumerRef.current) {
      consumerRef.current.markFailed(sproutId, error);
      syncState();
    }
  }, [syncState]);

  // Memoized result
  const result = useMemo<UseResearchQueueConsumerResult>(() => ({
    state,
    start,
    stop,
    poll,
    isProcessing,
    markCompleted,
    markFailed,
  }), [state, start, stop, poll, isProcessing, markCompleted, markFailed]);

  return result;
}

// =============================================================================
// Convenience Hooks
// =============================================================================

/**
 * Hook to check if queue consumer is processing any sprouts
 */
export function useIsQueueProcessing(): boolean {
  const { state } = useResearchQueueConsumer({ enabled: false });
  return state.processingIds.length > 0;
}

/**
 * Hook to get queue consumer statistics
 */
export function useQueueConsumerStats(): Pick<
  QueueConsumerState,
  'claimedCount' | 'completedCount' | 'lastError'
> {
  const { state } = useResearchQueueConsumer({ enabled: false });
  return {
    claimedCount: state.claimedCount,
    completedCount: state.completedCount,
    lastError: state.lastError,
  };
}

// =============================================================================
// Exports
// =============================================================================

export type {
  UseResearchQueueConsumerOptions,
  UseResearchQueueConsumerResult,
};
