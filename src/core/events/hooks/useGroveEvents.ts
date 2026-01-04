// src/core/events/hooks/useGroveEvents.ts
// Sprint: bedrock-event-hooks-v1

import { useContext } from 'react';
import { GroveEventContext } from './context';
import type { GroveEventLog } from '../types';

/**
 * Access the full GroveEventLog.
 * Must be used within GroveEventProvider.
 *
 * @returns The current event log state
 * @throws Error if used outside provider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const log = useGroveEvents();
 *   console.log('Session events:', log.sessionEvents.length);
 *   return <div>Events: {log.sessionEvents.length}</div>;
 * }
 * ```
 */
export function useGroveEvents(): GroveEventLog {
  const context = useContext(GroveEventContext);

  if (!context) {
    throw new Error(
      'useGroveEvents must be used within a GroveEventProvider. ' +
      'Wrap your app with <GroveEventProvider> to use this hook.'
    );
  }

  return context.log;
}
