// tests/unit/events/store.test.ts
// Sprint: bedrock-event-architecture-v1

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FIELD_ID,
  STORAGE_KEY,
  generateSessionId,
  createEventLog,
  appendEvent,
  clearSessionEvents,
  startNewSession,
  createEventBase,
  getEventsByType,
  getLastEventOfType,
  getSessionEventCount,
  getCumulativeEventCount,
} from '@core/events/store';
import type { GroveEvent, GroveEventLog } from '@core/events/types';

// ─────────────────────────────────────────────────────────────────
// TEST FIXTURES
// ─────────────────────────────────────────────────────────────────

const NOW = 1704067200000; // 2024-01-01 00:00:00 UTC

function createTestLog(): GroveEventLog {
  return createEventLog({
    currentSessionId: 'test-session',
  });
}

// ─────────────────────────────────────────────────────────────────
// CONSTANTS TESTS
// ─────────────────────────────────────────────────────────────────

describe('Store Constants', () => {
  it('DEFAULT_FIELD_ID is grove', () => {
    expect(DEFAULT_FIELD_ID).toBe('grove');
  });

  it('STORAGE_KEY is grove-event-log', () => {
    expect(STORAGE_KEY).toBe('grove-event-log');
  });
});

// ─────────────────────────────────────────────────────────────────
// SESSION ID TESTS
// ─────────────────────────────────────────────────────────────────

describe('generateSessionId', () => {
  it('generates unique session IDs', () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();

    expect(id1).not.toBe(id2);
  });

  it('generates non-empty string', () => {
    const id = generateSessionId();

    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('generates reasonable length ID', () => {
    const id = generateSessionId();

    // UUID-like or similar format
    expect(id.length).toBeGreaterThan(8);
  });
});

// ─────────────────────────────────────────────────────────────────
// EVENT LOG FACTORY TESTS
// ─────────────────────────────────────────────────────────────────

describe('createEventLog', () => {
  it('creates log with default values', () => {
    const log = createEventLog();

    expect(log.version).toBe(3);
    expect(log.fieldId).toBe(DEFAULT_FIELD_ID);
    expect(log.currentSessionId).toBeTruthy();
    expect(log.sessionEvents).toEqual([]);
    expect(log.cumulativeEvents.journeyCompletions).toEqual([]);
    expect(log.cumulativeEvents.topicExplorations).toEqual([]);
    expect(log.cumulativeEvents.insightCaptures).toEqual([]);
    expect(log.sessionCount).toBe(1);
    expect(log.lastSessionAt).toBeGreaterThan(0);
  });

  it('accepts custom options', () => {
    const log = createEventLog({
      fieldId: 'custom-field',
      currentSessionId: 'custom-session',
      sessionCount: 5,
    });

    expect(log.fieldId).toBe('custom-field');
    expect(log.currentSessionId).toBe('custom-session');
    expect(log.sessionCount).toBe(5);
  });

  it('merges cumulative events', () => {
    const log = createEventLog({
      cumulativeEvents: {
        journeyCompletions: [{
          fieldId: 'grove',
          timestamp: NOW,
          type: 'JOURNEY_COMPLETED',
          sessionId: 'test',
          journeyId: 'j-1',
        }],
        topicExplorations: [],
        insightCaptures: [],
      },
    });

    expect(log.cumulativeEvents.journeyCompletions).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// EVENT OPERATIONS TESTS
// ─────────────────────────────────────────────────────────────────

describe('appendEvent', () => {
  it('appends session event', () => {
    const log = createTestLog();
    const event: GroveEvent = {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'SESSION_STARTED',
      sessionId: 'test-session',
      isReturning: false,
    };

    const updated = appendEvent(log, event);

    expect(updated.sessionEvents).toHaveLength(1);
    expect(updated.sessionEvents[0].type).toBe('SESSION_STARTED');
  });

  it('appends journey completed to cumulative', () => {
    const log = createTestLog();
    const event: GroveEvent = {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'JOURNEY_COMPLETED',
      sessionId: 'test-session',
      journeyId: 'j-1',
    };

    const updated = appendEvent(log, event);

    expect(updated.sessionEvents).toHaveLength(1);
    expect(updated.cumulativeEvents.journeyCompletions).toHaveLength(1);
  });

  it('appends topic explored to cumulative', () => {
    const log = createTestLog();
    const event: GroveEvent = {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'TOPIC_EXPLORED',
      sessionId: 'test-session',
      topicId: 't-1',
      hubId: 'h-1',
    };

    const updated = appendEvent(log, event);

    expect(updated.sessionEvents).toHaveLength(1);
    expect(updated.cumulativeEvents.topicExplorations).toHaveLength(1);
  });

  it('appends insight captured to cumulative', () => {
    const log = createTestLog();
    const event: GroveEvent = {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'INSIGHT_CAPTURED',
      sessionId: 'test-session',
      sproutId: 's-1',
    };

    const updated = appendEvent(log, event);

    expect(updated.sessionEvents).toHaveLength(1);
    expect(updated.cumulativeEvents.insightCaptures).toHaveLength(1);
  });

  it('returns new object (immutable)', () => {
    const log = createTestLog();
    const event: GroveEvent = {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'SESSION_STARTED',
      sessionId: 'test-session',
      isReturning: false,
    };

    const updated = appendEvent(log, event);

    expect(updated).not.toBe(log);
    expect(updated.sessionEvents).not.toBe(log.sessionEvents);
  });
});

describe('clearSessionEvents', () => {
  it('clears session events', () => {
    let log = createTestLog();
    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'SESSION_STARTED',
      sessionId: 'test-session',
      isReturning: false,
    });

    const cleared = clearSessionEvents(log);

    expect(cleared.sessionEvents).toEqual([]);
  });

  it('preserves cumulative events', () => {
    let log = createTestLog();
    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'JOURNEY_COMPLETED',
      sessionId: 'test-session',
      journeyId: 'j-1',
    });

    const cleared = clearSessionEvents(log);

    expect(cleared.cumulativeEvents.journeyCompletions).toHaveLength(1);
  });

  it('returns new object (immutable)', () => {
    const log = createTestLog();
    const cleared = clearSessionEvents(log);

    expect(cleared).not.toBe(log);
  });
});

describe('startNewSession', () => {
  it('clears session events', () => {
    let log = createTestLog();
    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'SESSION_STARTED',
      sessionId: 'test-session',
      isReturning: false,
    });

    const newSession = startNewSession(log);

    expect(newSession.sessionEvents).toEqual([]);
  });

  it('generates new session ID', () => {
    const log = createTestLog();
    const newSession = startNewSession(log);

    expect(newSession.currentSessionId).not.toBe(log.currentSessionId);
  });

  it('increments session count', () => {
    const log = createTestLog();
    const newSession = startNewSession(log);

    expect(newSession.sessionCount).toBe(log.sessionCount + 1);
  });

  it('updates lastSessionAt', () => {
    const log = createTestLog();
    const before = log.lastSessionAt;

    // Small delay to ensure different timestamp
    const newSession = startNewSession(log);

    expect(newSession.lastSessionAt).toBeGreaterThanOrEqual(before);
  });

  it('preserves cumulative events', () => {
    let log = createTestLog();
    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'JOURNEY_COMPLETED',
      sessionId: 'test-session',
      journeyId: 'j-1',
    });

    const newSession = startNewSession(log);

    expect(newSession.cumulativeEvents.journeyCompletions).toHaveLength(1);
  });
});

describe('createEventBase', () => {
  it('creates base with required fields from log', () => {
    const log = createEventLog();
    const base = createEventBase(log, 'SESSION_STARTED');

    expect(base.fieldId).toBe(DEFAULT_FIELD_ID);
    expect(base.sessionId).toBe(log.currentSessionId);
    expect(base.type).toBe('SESSION_STARTED');
    expect(base.timestamp).toBeGreaterThan(0);
  });

  it('uses current timestamp', () => {
    const log = createEventLog();
    const before = Date.now();
    const base = createEventBase(log, 'QUERY_SUBMITTED');
    const after = Date.now();

    expect(base.timestamp).toBeGreaterThanOrEqual(before);
    expect(base.timestamp).toBeLessThanOrEqual(after);
  });
});

// ─────────────────────────────────────────────────────────────────
// QUERY HELPERS TESTS
// ─────────────────────────────────────────────────────────────────

describe('getEventsByType', () => {
  it('filters events by type', () => {
    let log = createTestLog();
    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'SESSION_STARTED',
      sessionId: 'test-session',
      isReturning: false,
    });
    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'QUERY_SUBMITTED',
      sessionId: 'test-session',
      queryId: 'q-1',
      content: 'test',
    });

    const sessionEvents = getEventsByType(log, 'SESSION_STARTED');
    expect(sessionEvents).toHaveLength(1);
    expect(sessionEvents[0].type).toBe('SESSION_STARTED');

    const queryEvents = getEventsByType(log, 'QUERY_SUBMITTED');
    expect(queryEvents).toHaveLength(1);
    expect(queryEvents[0].type).toBe('QUERY_SUBMITTED');
  });

  it('returns empty array when no matches', () => {
    const log = createTestLog();
    const events = getEventsByType(log, 'JOURNEY_COMPLETED');
    expect(events).toEqual([]);
  });
});

describe('getLastEventOfType', () => {
  it('returns last event of type', () => {
    let log = createTestLog();
    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'QUERY_SUBMITTED',
      sessionId: 'test-session',
      queryId: 'q-1',
      content: 'first',
    });
    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW + 1000,
      type: 'QUERY_SUBMITTED',
      sessionId: 'test-session',
      queryId: 'q-2',
      content: 'second',
    });

    const last = getLastEventOfType(log, 'QUERY_SUBMITTED');
    expect(last).toBeDefined();
    expect((last as any).queryId).toBe('q-2');
  });

  it('returns null when no matches', () => {
    const log = createTestLog();
    const last = getLastEventOfType(log, 'JOURNEY_COMPLETED');
    expect(last).toBeNull();
  });
});

describe('getSessionEventCount', () => {
  it('counts session events', () => {
    let log = createTestLog();
    expect(getSessionEventCount(log)).toBe(0);

    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'SESSION_STARTED',
      sessionId: 'test-session',
      isReturning: false,
    });
    expect(getSessionEventCount(log)).toBe(1);

    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'QUERY_SUBMITTED',
      sessionId: 'test-session',
      queryId: 'q-1',
      content: 'test',
    });
    expect(getSessionEventCount(log)).toBe(2);
  });
});

describe('getCumulativeEventCount', () => {
  it('counts all cumulative events', () => {
    let log = createTestLog();
    expect(getCumulativeEventCount(log)).toBe(0);

    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'JOURNEY_COMPLETED',
      sessionId: 'test-session',
      journeyId: 'j-1',
    });
    expect(getCumulativeEventCount(log)).toBe(1);

    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'TOPIC_EXPLORED',
      sessionId: 'test-session',
      topicId: 't-1',
      hubId: 'h-1',
    });
    expect(getCumulativeEventCount(log)).toBe(2);

    log = appendEvent(log, {
      fieldId: 'grove',
      timestamp: NOW,
      type: 'INSIGHT_CAPTURED',
      sessionId: 'test-session',
      sproutId: 's-1',
    });
    expect(getCumulativeEventCount(log)).toBe(3);
  });
});
