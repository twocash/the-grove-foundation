// src/core/telemetry/batch.ts
// Telemetry Batching Utility
// Sprint: 4d-prompt-refactor-telemetry-v1

import type { PromptTelemetryEvent } from './types';
import { submitTelemetryBatch } from './client';

// =============================================================================
// BATCHER INTERFACE
// =============================================================================

export interface TelemetryBatcher {
  /** Add an event to the batch queue */
  add: (event: PromptTelemetryEvent) => void;
  /** Flush queued events immediately */
  flush: () => Promise<void>;
}

export interface TelemetryBatcherOptions {
  /** Maximum events before auto-flush (default: 10) */
  maxSize?: number;
  /** Delay before auto-flush in ms (default: 100) */
  flushDelayMs?: number;
  /** Error handler for failed submissions */
  onError?: (error: Error, events: PromptTelemetryEvent[]) => void;
}

// =============================================================================
// BATCHER FACTORY
// =============================================================================

/**
 * Creates a batching queue that flushes after delay or max size
 *
 * @example
 * ```ts
 * const batcher = createTelemetryBatcher({
 *   maxSize: 20,
 *   flushDelayMs: 100,
 *   onError: (err) => console.warn('Batch failed:', err),
 * });
 *
 * // Add events (batched automatically)
 * batcher.add(event1);
 * batcher.add(event2);
 *
 * // Force flush on unmount
 * batcher.flush();
 * ```
 */
export function createTelemetryBatcher(
  options: TelemetryBatcherOptions = {}
): TelemetryBatcher {
  const { maxSize = 10, flushDelayMs = 100, onError } = options;

  let queue: PromptTelemetryEvent[] = [];
  let flushTimeout: ReturnType<typeof setTimeout> | null = null;

  const flush = async (): Promise<void> => {
    if (queue.length === 0) return;

    const batch = [...queue];
    queue = [];

    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }

    try {
      await submitTelemetryBatch(batch);
    } catch (error) {
      // Non-blocking: log error but don't throw
      onError?.(error as Error, batch);
    }
  };

  const add = (event: PromptTelemetryEvent): void => {
    queue.push(event);

    if (queue.length >= maxSize) {
      // Max size reached - flush immediately
      if (flushTimeout) clearTimeout(flushTimeout);
      flush();
    } else if (!flushTimeout) {
      // Start flush timer
      flushTimeout = setTimeout(flush, flushDelayMs);
    }
  };

  return { add, flush };
}
