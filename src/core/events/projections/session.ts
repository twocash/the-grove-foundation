// src/core/events/projections/session.ts
// Sprint: bedrock-event-architecture-v1

import type { GroveEvent } from '../types';
import type { SessionState } from './types';
import { INITIAL_SESSION_STATE } from './types';

/**
 * Project session state from event log.
 * Pure function - no side effects.
 *
 * @param events - Array of events to process
 * @param now - Current timestamp for computing minutesActive (default: Date.now())
 * @returns Derived session state
 */
export function projectSession(events: GroveEvent[], now: number = Date.now()): SessionState {
  const state = events.reduce((state, event) => {
    switch (event.type) {
      case 'SESSION_STARTED':
        return {
          ...state,
          sessionId: event.sessionId,
          startedAt: event.timestamp,
          isReturning: event.isReturning,
        };

      case 'SESSION_RESUMED':
        return {
          ...state,
          sessionId: event.sessionId,
          isReturning: true,
        };

      case 'LENS_ACTIVATED':
        return {
          ...state,
          lensId: event.lensId,
          lensSource: event.source,
          isCustomLens: event.isCustom,
        };

      case 'QUERY_SUBMITTED':
        return {
          ...state,
          interactionCount: state.interactionCount + 1,
        };

      default:
        return state;
    }
  }, INITIAL_SESSION_STATE);

  // Compute minutes active
  const minutesActive = state.startedAt > 0
    ? Math.floor((now - state.startedAt) / 60000)
    : 0;

  return {
    ...state,
    minutesActive,
  };
}

/**
 * Extract session ID from events.
 * Returns the most recent session ID or null.
 */
export function extractSessionId(events: GroveEvent[]): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.type === 'SESSION_STARTED' || event.type === 'SESSION_RESUMED') {
      return event.sessionId;
    }
  }
  return events.length > 0 ? events[0].sessionId : null;
}

/**
 * Check if session has active lens.
 */
export function hasActiveLens(events: GroveEvent[]): boolean {
  const session = projectSession(events);
  return session.lensId !== null;
}

/**
 * Get interaction count from events.
 */
export function getInteractionCount(events: GroveEvent[]): number {
  return events.filter(e => e.type === 'QUERY_SUBMITTED').length;
}
