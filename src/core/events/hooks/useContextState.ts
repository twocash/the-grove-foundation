// src/core/events/hooks/useContextState.ts
// Sprint: bedrock-event-hooks-v1

import { useMemo } from 'react';
import { useGroveEvents } from './useGroveEvents';
import { projectContext } from '../projections';
import type { ContextState } from '../projections/types';

// Re-export type for convenience
export type { ContextState };

/**
 * Get the current context state derived from events.
 * Includes stage, entropy, active moments, and exploration metrics.
 *
 * Named useContextState to avoid collision with React's useContext.
 *
 * @returns ContextState for component rendering decisions
 *
 * @example
 * ```tsx
 * function StageIndicator() {
 *   const context = useContextState();
 *
 *   return (
 *     <div>
 *       <p>Stage: {context.stage}</p>
 *       <p>Entropy: {context.entropy.toFixed(2)}</p>
 *       <p>Topics explored: {context.topicsExplored.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useContextState(): ContextState {
  const log = useGroveEvents();

  return useMemo(
    () => projectContext(log),
    [log]
  );
}
