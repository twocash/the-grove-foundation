// src/core/events/hooks/useSession.ts
// Sprint: bedrock-event-hooks-v1

import { useMemo } from 'react';
import { useGroveEvents } from './useGroveEvents';
import { projectSession } from '../projections';
import type { SessionState } from '../projections/types';

// Re-export type for convenience
export type { SessionState };

/**
 * Get the current session state derived from events.
 * Memoized — only recomputes when session events change.
 *
 * @returns SessionState with lens, journey, and interaction info
 *
 * @example
 * ```tsx
 * function SessionInfo() {
 *   const session = useSession();
 *
 *   return (
 *     <div>
 *       <p>Lens: {session.lensId ?? 'None'}</p>
 *       <p>Interactions: {session.interactionCount}</p>
 *       {session.activeJourneyId && (
 *         <p>Journey: {session.journeyProgress}/{session.journeyTotal}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSession(): SessionState {
  const log = useGroveEvents();

  return useMemo(
    () => projectSession(log.sessionEvents),
    [log.sessionEvents]
  );
}
