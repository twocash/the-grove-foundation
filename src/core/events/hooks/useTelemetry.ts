// src/core/events/hooks/useTelemetry.ts
// Sprint: bedrock-event-hooks-v1

import { useMemo } from 'react';
import { useGroveEvents } from './useGroveEvents';
import { projectToCumulativeMetricsV2, projectComputedMetrics } from '../projections';
import type { CumulativeMetricsV2, ComputedMetrics } from '../../schema/telemetry';

// Re-export types for convenience
export type { CumulativeMetricsV2, ComputedMetrics };

export interface TelemetryResult {
  /** Raw cumulative metrics (V2 format for backward compatibility) */
  metrics: CumulativeMetricsV2;
  /** Computed metrics (derived values) */
  computed: ComputedMetrics;
}

/**
 * Get telemetry metrics in backward-compatible V2 format.
 * Drop-in replacement for legacy useTelemetry consumers.
 *
 * @returns Object with metrics (V2 format) and computed values
 *
 * @example
 * ```tsx
 * function TelemetryDisplay() {
 *   const { metrics, computed } = useTelemetry();
 *
 *   return (
 *     <div>
 *       <p>Sessions: {metrics.sessionCount}</p>
 *       <p>Journeys completed: {computed.journeysCompleted}</p>
 *       <p>Topics explored: {computed.topicsExplored}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTelemetry(): TelemetryResult {
  const log = useGroveEvents();

  const metrics = useMemo(
    () => projectToCumulativeMetricsV2(log),
    [log]
  );

  const computed = useMemo(
    () => projectComputedMetrics(log),
    [log]
  );

  return { metrics, computed };
}
