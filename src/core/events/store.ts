// src/core/events/store.ts
// Sprint: bedrock-event-architecture-v1

import type {
  GroveEvent,
  GroveEventLog,
  JourneyCompletedEvent,
  TopicExploredEvent,
  InsightCapturedEvent,
} from './types';
import { isCumulativeEvent } from './types';
import { validateEvent } from './schema';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

export const DEFAULT_FIELD_ID = 'grove';
export const STORAGE_KEY = 'grove-event-log';

// ─────────────────────────────────────────────────────────────────
// SESSION ID GENERATION
// ─────────────────────────────────────────────────────────────────

/**
 * Generate a unique session ID.
 * Format: session-{timestamp}-{random}
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `session-${timestamp}-${random}`;
}

// ─────────────────────────────────────────────────────────────────
// EVENT LOG FACTORY
// ─────────────────────────────────────────────────────────────────

/**
 * Create a fresh event log with optional overrides.
 *
 * @param options - Partial log to merge
 * @returns New GroveEventLog
 */
export function createEventLog(options: Partial<GroveEventLog> = {}): GroveEventLog {
  return {
    version: 3,
    fieldId: options.fieldId ?? DEFAULT_FIELD_ID,
    currentSessionId: options.currentSessionId ?? generateSessionId(),
    sessionEvents: options.sessionEvents ?? [],
    cumulativeEvents: options.cumulativeEvents ?? {
      journeyCompletions: [],
      topicExplorations: [],
      insightCaptures: [],
    },
    sessionCount: options.sessionCount ?? 1,
    lastSessionAt: options.lastSessionAt ?? Date.now(),
  };
}

// ─────────────────────────────────────────────────────────────────
// EVENT OPERATIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Append an event to the log.
 * Validates the event and routes to appropriate array.
 *
 * @param log - Event log to append to
 * @param event - Event to append
 * @returns Updated event log (new object)
 */
export function appendEvent(log: GroveEventLog, event: GroveEvent): GroveEventLog {
  // Validate event
  validateEvent(event);

  // Route cumulative events to their arrays
  if (isCumulativeEvent(event)) {
    return appendCumulativeEvent(log, event);
  }

  // Session events go to sessionEvents array
  return {
    ...log,
    sessionEvents: [...log.sessionEvents, event],
  };
}

/**
 * Append a cumulative event to the appropriate array.
 */
function appendCumulativeEvent(
  log: GroveEventLog,
  event: JourneyCompletedEvent | TopicExploredEvent | InsightCapturedEvent
): GroveEventLog {
  switch (event.type) {
    case 'JOURNEY_COMPLETED':
      return {
        ...log,
        sessionEvents: [...log.sessionEvents, event],
        cumulativeEvents: {
          ...log.cumulativeEvents,
          journeyCompletions: [...log.cumulativeEvents.journeyCompletions, event],
        },
      };

    case 'TOPIC_EXPLORED':
      return {
        ...log,
        sessionEvents: [...log.sessionEvents, event],
        cumulativeEvents: {
          ...log.cumulativeEvents,
          topicExplorations: [...log.cumulativeEvents.topicExplorations, event],
        },
      };

    case 'INSIGHT_CAPTURED':
      return {
        ...log,
        sessionEvents: [...log.sessionEvents, event],
        cumulativeEvents: {
          ...log.cumulativeEvents,
          insightCaptures: [...log.cumulativeEvents.insightCaptures, event],
        },
      };
  }
}

/**
 * Clear session events (called on new session).
 *
 * @param log - Event log to clear
 * @returns Updated event log with empty sessionEvents
 */
export function clearSessionEvents(log: GroveEventLog): GroveEventLog {
  return {
    ...log,
    sessionEvents: [],
  };
}

/**
 * Start a new session.
 * Clears session events and increments session count.
 *
 * @param log - Current event log
 * @returns Updated event log with new session
 */
export function startNewSession(log: GroveEventLog): GroveEventLog {
  const newSessionId = generateSessionId();

  return {
    ...log,
    currentSessionId: newSessionId,
    sessionEvents: [],
    sessionCount: log.sessionCount + 1,
    lastSessionAt: Date.now(),
  };
}

// ─────────────────────────────────────────────────────────────────
// EVENT CREATION HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Create event base properties.
 *
 * @param log - Event log for context
 * @param type - Event type
 * @returns Base event properties
 */
export function createEventBase(
  log: GroveEventLog,
  type: string
): { fieldId: string; timestamp: number; type: string; sessionId: string } {
  return {
    fieldId: log.fieldId,
    timestamp: Date.now(),
    type,
    sessionId: log.currentSessionId,
  };
}

// ─────────────────────────────────────────────────────────────────
// QUERY HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Get events by type from session events.
 */
export function getEventsByType<T extends GroveEvent>(
  log: GroveEventLog,
  type: T['type']
): T[] {
  return log.sessionEvents.filter(e => e.type === type) as T[];
}

/**
 * Get the last event of a specific type.
 */
export function getLastEventOfType<T extends GroveEvent>(
  log: GroveEventLog,
  type: T['type']
): T | null {
  for (let i = log.sessionEvents.length - 1; i >= 0; i--) {
    if (log.sessionEvents[i].type === type) {
      return log.sessionEvents[i] as T;
    }
  }
  return null;
}

/**
 * Get total event count in session.
 */
export function getSessionEventCount(log: GroveEventLog): number {
  return log.sessionEvents.length;
}

/**
 * Get total event count across all sessions (cumulative only).
 */
export function getCumulativeEventCount(log: GroveEventLog): number {
  return (
    log.cumulativeEvents.journeyCompletions.length +
    log.cumulativeEvents.topicExplorations.length +
    log.cumulativeEvents.insightCaptures.length
  );
}
