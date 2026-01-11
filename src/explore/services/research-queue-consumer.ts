// src/explore/services/research-queue-consumer.ts
// Research Queue Consumer - Picks up pending sprouts for execution
// Sprint: sprout-research-v1, Phase 5a
//
// This service watches for research sprouts in 'pending' status and
// transitions them to 'active' for execution by the Research Agent (Phase 5b).
//
// PATTERN: Pull-based consumer with optimistic locking
// - Polls for pending sprouts on interval
// - Claims sprouts via status transition
// - Delegates execution to ResearchAgent

import type {
  ResearchSprout,
  ResearchSproutStatus,
} from '@core/schema/research-sprout';

// =============================================================================
// Types
// =============================================================================

/**
 * Callback to query pending sprouts from context
 */
export type QueryPendingFn = () => ResearchSprout[];

/**
 * Callback to transition sprout status
 */
export type TransitionStatusFn = (
  id: string,
  newStatus: ResearchSproutStatus,
  reason: string,
  actor?: string
) => Promise<ResearchSprout>;

/**
 * Callback when a sprout is claimed for execution
 * Returns true if execution should proceed, false to release the claim
 */
export type OnClaimFn = (sprout: ResearchSprout) => Promise<boolean>;

/**
 * Queue consumer configuration
 */
export interface QueueConsumerConfig {
  /** Polling interval in milliseconds (default: 5000ms) */
  pollInterval?: number;

  /** Maximum concurrent sprouts to process (default: 1) */
  maxConcurrent?: number;

  /** Agent ID for status transitions (default: 'research-agent') */
  agentId?: string;

  /** Whether to auto-start polling (default: false) */
  autoStart?: boolean;
}

/**
 * Queue consumer state
 */
export interface QueueConsumerState {
  /** Whether the consumer is actively polling */
  isRunning: boolean;

  /** IDs of sprouts currently being processed */
  processingIds: string[];

  /** Total sprouts claimed since start */
  claimedCount: number;

  /** Total sprouts completed since start */
  completedCount: number;

  /** Last error message if any */
  lastError: string | null;

  /** Last poll timestamp */
  lastPollAt: string | null;
}

/**
 * Queue consumer instance
 */
export interface QueueConsumer {
  /** Current state */
  getState(): QueueConsumerState;

  /** Start polling for pending sprouts */
  start(): void;

  /** Stop polling (allows current processing to finish) */
  stop(): void;

  /** Manually trigger a poll cycle */
  poll(): Promise<void>;

  /** Check if a specific sprout is being processed */
  isProcessing(sproutId: string): boolean;

  /** Mark a sprout as completed (called by Research Agent) */
  markCompleted(sproutId: string): void;

  /** Mark a sprout as failed (called by Research Agent) */
  markFailed(sproutId: string, error: string): void;

  /** Clean up resources */
  dispose(): void;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: Required<QueueConsumerConfig> = {
  pollInterval: 5000,    // 5 seconds
  maxConcurrent: 1,      // Process one at a time
  agentId: 'research-agent',
  autoStart: false,
};

// =============================================================================
// Factory
// =============================================================================

/**
 * Create a queue consumer instance
 *
 * @param queryPending - Function to query pending sprouts
 * @param transitionStatus - Function to transition sprout status
 * @param onClaim - Callback when a sprout is claimed (for execution)
 * @param config - Consumer configuration
 */
export function createQueueConsumer(
  queryPending: QueryPendingFn,
  transitionStatus: TransitionStatusFn,
  onClaim: OnClaimFn,
  config: QueueConsumerConfig = {}
): QueueConsumer {
  // Merge config with defaults
  const cfg: Required<QueueConsumerConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Internal state
  let isRunning = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  const processingIds = new Set<string>();
  let claimedCount = 0;
  let completedCount = 0;
  let lastError: string | null = null;
  let lastPollAt: string | null = null;

  // Get current state
  function getState(): QueueConsumerState {
    return {
      isRunning,
      processingIds: Array.from(processingIds),
      claimedCount,
      completedCount,
      lastError,
      lastPollAt,
    };
  }

  // Claim a sprout (transition to active)
  async function claimSprout(sprout: ResearchSprout): Promise<boolean> {
    try {
      // Transition to active status
      await transitionStatus(
        sprout.id,
        'active',
        `Claimed by ${cfg.agentId} for execution`,
        cfg.agentId
      );

      // Track as processing
      processingIds.add(sprout.id);
      claimedCount++;

      // Notify via callback
      const shouldProceed = await onClaim(sprout);

      if (!shouldProceed) {
        // Callback rejected - release claim
        processingIds.delete(sprout.id);
        await transitionStatus(
          sprout.id,
          'pending',
          'Released by agent - execution rejected',
          cfg.agentId
        );
        return false;
      }

      return true;
    } catch (error) {
      // Claim failed (likely race condition or invalid state)
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`[QueueConsumer] Failed to claim sprout ${sprout.id}:`, lastError);
      return false;
    }
  }

  // Poll for pending sprouts
  async function poll(): Promise<void> {
    if (!isRunning) return;

    lastPollAt = new Date().toISOString();
    lastError = null;

    try {
      // Check capacity
      if (processingIds.size >= cfg.maxConcurrent) {
        // At capacity, skip this poll
        return;
      }

      // Query pending sprouts
      const pending = queryPending();

      if (pending.length === 0) {
        // Nothing to process
        return;
      }

      // Filter out already-processing sprouts (in case of stale queries)
      const available = pending.filter(s => !processingIds.has(s.id));

      if (available.length === 0) {
        return;
      }

      // Calculate how many we can claim
      const slotsAvailable = cfg.maxConcurrent - processingIds.size;
      const toClaim = available.slice(0, slotsAvailable);

      // Claim sprouts (sequentially to avoid race conditions)
      for (const sprout of toClaim) {
        await claimSprout(sprout);

        // Recheck capacity after each claim
        if (processingIds.size >= cfg.maxConcurrent) {
          break;
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error('[QueueConsumer] Poll error:', lastError);
    }
  }

  // Start polling
  function start(): void {
    if (isRunning) return;

    isRunning = true;

    // Initial poll
    poll();

    // Start interval
    pollTimer = setInterval(poll, cfg.pollInterval);

    console.log(`[QueueConsumer] Started with ${cfg.pollInterval}ms interval`);
  }

  // Stop polling
  function stop(): void {
    if (!isRunning) return;

    isRunning = false;

    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }

    console.log('[QueueConsumer] Stopped');
  }

  // Check if processing
  function isProcessing(sproutId: string): boolean {
    return processingIds.has(sproutId);
  }

  // Mark completed
  function markCompleted(sproutId: string): void {
    if (processingIds.has(sproutId)) {
      processingIds.delete(sproutId);
      completedCount++;
    }
  }

  // Mark failed
  function markFailed(sproutId: string, error: string): void {
    if (processingIds.has(sproutId)) {
      processingIds.delete(sproutId);
      lastError = error;
    }
  }

  // Dispose
  function dispose(): void {
    stop();
    processingIds.clear();
  }

  // Create consumer instance
  const consumer: QueueConsumer = {
    getState,
    start,
    stop,
    poll,
    isProcessing,
    markCompleted,
    markFailed,
    dispose,
  };

  // Auto-start if configured
  if (cfg.autoStart) {
    start();
  }

  return consumer;
}

// =============================================================================
// React Hook Integration (for Phase 5b+)
// =============================================================================

/**
 * Hook options for useQueueConsumer
 */
export interface UseQueueConsumerOptions extends QueueConsumerConfig {
  /** Called when a sprout is ready for execution */
  onExecute?: (sprout: ResearchSprout) => Promise<void>;
}

/**
 * Create a queue consumer bound to React lifecycle
 *
 * Usage:
 * ```tsx
 * const { state, start, stop } = useQueueConsumer({
 *   onExecute: async (sprout) => {
 *     // Execute research...
 *   }
 * });
 * ```
 *
 * NOTE: This is a factory for hooks, not a hook itself.
 * The actual hook will be created in Phase 5b when we have the Research Agent.
 */
export function createQueueConsumerHookFactory(
  queryPending: QueryPendingFn,
  transitionStatus: TransitionStatusFn
) {
  return function useQueueConsumer(options: UseQueueConsumerOptions = {}) {
    const { onExecute, ...config } = options;

    // This will be implemented in Phase 5b
    // For now, return placeholder
    return {
      consumer: null as QueueConsumer | null,
      state: {
        isRunning: false,
        processingIds: [] as string[],
        claimedCount: 0,
        completedCount: 0,
        lastError: null as string | null,
        lastPollAt: null as string | null,
      },
      start: () => {},
      stop: () => {},
    };
  };
}

// =============================================================================
// Exports
// =============================================================================

export type {
  QueryPendingFn,
  TransitionStatusFn,
  OnClaimFn,
};
