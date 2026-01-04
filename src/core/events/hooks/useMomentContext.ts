// src/core/events/hooks/useMomentContext.ts
// Sprint: bedrock-event-hooks-v1

import { useMemo } from 'react';
import { useGroveEvents } from './useGroveEvents';
import { projectMomentContext } from '../projections';
import type { MomentEvaluationContext } from '../projections/types';

// Re-export type for convenience
export type { MomentEvaluationContext };

/**
 * Get the moment evaluation context derived from events.
 * Used by moment-evaluator to determine which moments to surface.
 *
 * @returns MomentEvaluationContext with all required fields for moment evaluation
 *
 * @example
 * ```tsx
 * function MomentEvaluator() {
 *   const context = useMomentContext();
 *
 *   // Use with moment evaluation logic
 *   const moments = evaluateMoments(allMoments, context);
 *
 *   return (
 *     <div>
 *       <p>Stage: {context.stage}</p>
 *       <p>Exchange count: {context.exchangeCount}</p>
 *       <p>Active lens: {context.activeLens ?? 'None'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMomentContext(): MomentEvaluationContext {
  const log = useGroveEvents();

  return useMemo(
    () => projectMomentContext(log),
    [log]
  );
}
