// tests/unit/events/projections.test.ts
// Sprint: bedrock-event-architecture-v1

import { describe, it, expect } from 'vitest';
import {
  // Session projection
  projectSession,
  extractSessionId,
  hasActiveLens,
  getInteractionCount,
  INITIAL_SESSION_STATE,
  // Telemetry projection
  projectToCumulativeMetricsV2,
  projectComputedMetrics,
  getJourneyCompletionCount,
  getUniqueTopicsExplored,
  getSproutCaptureCount,
  // Context projection
  projectContext,
  computeStage,
  computeEntropy,
  INITIAL_CONTEXT_STATE,
  // Moment projection
  projectMomentContext,
  deriveFlags,
  deriveCooldowns,
  deriveActiveMoments,
  getMomentsShown,
  INITIAL_MOMENT_CONTEXT,
  // Stream projection
  projectStream,
  getLastStreamItems,
  getQueryResponsePairs,
  hasActiveQuery,
  INITIAL_STREAM_STATE,
} from '@core/events/projections';
import type { GroveEvent, GroveEventLog } from '@core/events/types';

// ─────────────────────────────────────────────────────────────────
// TEST FIXTURES
// ─────────────────────────────────────────────────────────────────

const NOW = 1704067200000; // 2024-01-01 00:00:00 UTC
const FIVE_MINUTES_AGO = NOW - 5 * 60 * 1000;
const TEN_MINUTES_AGO = NOW - 10 * 60 * 1000;

function createBaseEvent(type: string, overrides = {}): GroveEvent {
  return {
    fieldId: 'grove',
    timestamp: NOW,
    sessionId: 'session-123',
    type,
    ...overrides,
  } as GroveEvent;
}

function createEmptyLog(): GroveEventLog {
  return {
    version: 3,
    fieldId: 'grove',
    currentSessionId: 'session-123',
    sessionEvents: [],
    cumulativeEvents: {
      journeyCompletions: [],
      topicExplorations: [],
      insightCaptures: [],
    },
    sessionCount: 1,
    lastSessionAt: NOW,
  };
}

// ─────────────────────────────────────────────────────────────────
// SESSION PROJECTION TESTS
// ─────────────────────────────────────────────────────────────────

describe('Session Projection', () => {
  describe('projectSession', () => {
    it('returns initial state for empty events', () => {
      const state = projectSession([], NOW);
      expect(state).toEqual(INITIAL_SESSION_STATE);
    });

    it('processes SESSION_STARTED event', () => {
      const events: GroveEvent[] = [
        createBaseEvent('SESSION_STARTED', {
          timestamp: TEN_MINUTES_AGO,
          isReturning: false,
        }),
      ];

      const state = projectSession(events, NOW);
      expect(state.sessionId).toBe('session-123');
      expect(state.isReturning).toBe(false);
      expect(state.minutesActive).toBeCloseTo(10, 0);
    });

    it('processes LENS_ACTIVATED event', () => {
      const events: GroveEvent[] = [
        createBaseEvent('SESSION_STARTED', { isReturning: false }),
        createBaseEvent('LENS_ACTIVATED', {
          lensId: 'ghost',
          source: 'selection',
          isCustom: false,
        }),
      ];

      const state = projectSession(events, NOW);
      expect(state.lensId).toBe('ghost');
      expect(state.lensSource).toBe('selection');
      expect(state.isCustomLens).toBe(false);
    });

    it('counts interactions from query events', () => {
      const events: GroveEvent[] = [
        createBaseEvent('SESSION_STARTED', { isReturning: false }),
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q1', content: 'test' }),
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q2', content: 'test2' }),
      ];

      const state = projectSession(events, NOW);
      expect(state.interactionCount).toBe(2);
    });
  });

  describe('extractSessionId', () => {
    it('extracts sessionId from events', () => {
      const events: GroveEvent[] = [
        createBaseEvent('SESSION_STARTED', { isReturning: false }),
      ];
      expect(extractSessionId(events)).toBe('session-123');
    });

    it('returns null for empty events', () => {
      expect(extractSessionId([])).toBeNull();
    });
  });

  describe('hasActiveLens', () => {
    it('returns false when no lens', () => {
      const events: GroveEvent[] = [
        createBaseEvent('SESSION_STARTED', { isReturning: false }),
      ];
      expect(hasActiveLens(events)).toBe(false);
    });

    it('returns true when lens is set', () => {
      const events: GroveEvent[] = [
        createBaseEvent('SESSION_STARTED', { isReturning: false }),
        createBaseEvent('LENS_ACTIVATED', { lensId: 'ghost', source: 'selection', isCustom: false }),
      ];
      expect(hasActiveLens(events)).toBe(true);
    });
  });

  describe('getInteractionCount', () => {
    it('counts query submissions from events', () => {
      const events: GroveEvent[] = [
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q1', content: 'test' }),
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q2', content: 'test2' }),
        createBaseEvent('FORK_SELECTED', { forkId: 'f1', forkType: 'deep_dive', label: 'test', responseId: 'r1' }),
      ];
      // getInteractionCount only counts QUERY_SUBMITTED events
      expect(getInteractionCount(events)).toBe(2);
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// TELEMETRY PROJECTION TESTS
// ─────────────────────────────────────────────────────────────────

describe('Telemetry Projection', () => {
  describe('projectToCumulativeMetricsV2', () => {
    it('projects empty log to V2 format', () => {
      const log = createEmptyLog();
      const v2 = projectToCumulativeMetricsV2(log);

      expect(v2.version).toBe(2);
      expect(v2.fieldId).toBe('grove');
      expect(v2.journeyCompletions).toEqual([]);
      expect(v2.topicExplorations).toEqual([]);
      expect(v2.sproutCaptures).toEqual([]);
    });

    it('projects journey completions', () => {
      const log = createEmptyLog();
      log.cumulativeEvents.journeyCompletions = [
        {
          fieldId: 'grove',
          timestamp: NOW,
          type: 'JOURNEY_COMPLETED',
          sessionId: 'session-123',
          journeyId: 'j-1',
          durationMs: 60000,
          waypointsVisited: 5,
        },
      ];

      const v2 = projectToCumulativeMetricsV2(log);
      expect(v2.journeyCompletions).toHaveLength(1);
      expect(v2.journeyCompletions[0].journeyId).toBe('j-1');
    });
  });

  describe('getJourneyCompletionCount', () => {
    it('counts journey completions', () => {
      const log = createEmptyLog();
      log.cumulativeEvents.journeyCompletions = [
        createBaseEvent('JOURNEY_COMPLETED', { journeyId: 'j-1' }),
        createBaseEvent('JOURNEY_COMPLETED', { journeyId: 'j-2' }),
      ] as any;

      expect(getJourneyCompletionCount(log)).toBe(2);
    });
  });

  describe('getUniqueTopicsExplored', () => {
    it('returns unique topic IDs', () => {
      const log = createEmptyLog();
      log.cumulativeEvents.topicExplorations = [
        createBaseEvent('TOPIC_EXPLORED', { topicId: 't-1', hubId: 'h-1' }),
        createBaseEvent('TOPIC_EXPLORED', { topicId: 't-1', hubId: 'h-1' }), // duplicate
        createBaseEvent('TOPIC_EXPLORED', { topicId: 't-2', hubId: 'h-1' }),
      ] as any;

      const uniqueTopics = getUniqueTopicsExplored(log);
      expect(uniqueTopics).toHaveLength(2);
      expect(uniqueTopics).toContain('t-1');
      expect(uniqueTopics).toContain('t-2');
    });
  });

  describe('getSproutCaptureCount', () => {
    it('counts sprout captures', () => {
      const log = createEmptyLog();
      log.cumulativeEvents.insightCaptures = [
        createBaseEvent('INSIGHT_CAPTURED', { sproutId: 's-1' }),
        createBaseEvent('INSIGHT_CAPTURED', { sproutId: 's-2' }),
      ] as any;

      expect(getSproutCaptureCount(log)).toBe(2);
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// CONTEXT PROJECTION TESTS
// ─────────────────────────────────────────────────────────────────

describe('Context Projection', () => {
  describe('computeStage', () => {
    it('returns ARRIVAL for new users', () => {
      expect(computeStage(0, 0)).toBe('ARRIVAL');
    });

    it('returns ORIENTED after some interactions', () => {
      expect(computeStage(2, 1)).toBe('ORIENTED');
    });

    it('returns EXPLORING after more engagement', () => {
      expect(computeStage(5, 3)).toBe('EXPLORING');
    });

    it('returns ENGAGED after significant engagement', () => {
      expect(computeStage(10, 10)).toBe('ENGAGED');
    });
  });

  describe('computeEntropy', () => {
    it('returns 0 for no exchanges', () => {
      expect(computeEntropy({
        hubsVisited: [],
        exchangeCount: 0,
        pivotCount: 0,
        consecutiveHubRepeats: 0,
      })).toBe(0);
    });

    it('returns low entropy for repetitive patterns', () => {
      const entropy = computeEntropy({
        hubsVisited: ['hub-1'],
        exchangeCount: 5,
        pivotCount: 0,
        consecutiveHubRepeats: 3,
      });
      expect(entropy).toBeLessThan(0.5);
    });

    it('returns higher entropy for diverse exploration', () => {
      const entropy = computeEntropy({
        hubsVisited: ['hub-1', 'hub-2', 'hub-3', 'hub-4'],
        exchangeCount: 8,
        pivotCount: 3,
        consecutiveHubRepeats: 0,
      });
      expect(entropy).toBeGreaterThan(0.3);
    });
  });

  describe('projectContext', () => {
    it('returns initial state for empty log', () => {
      const log = createEmptyLog();
      const context = projectContext(log, NOW);

      expect(context.stage).toBe('ARRIVAL');
      expect(context.session.sessionId).toBe('');
    });

    it('projects full context from populated log', () => {
      const log = createEmptyLog();
      log.sessionEvents = [
        createBaseEvent('SESSION_STARTED', { timestamp: TEN_MINUTES_AGO, isReturning: false }),
        createBaseEvent('LENS_ACTIVATED', { lensId: 'ghost', source: 'selection', isCustom: false }),
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q1', content: 'test' }),
      ];

      const context = projectContext(log, NOW);
      expect(context.session.lensId).toBe('ghost');
      expect(context.session.interactionCount).toBe(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// MOMENT PROJECTION TESTS
// ─────────────────────────────────────────────────────────────────

describe('Moment Projection', () => {
  describe('projectMomentContext', () => {
    it('returns initial context for empty log', () => {
      const log = createEmptyLog();
      const context = projectMomentContext(log, NOW);

      expect(context.stage).toBe('ARRIVAL');
      expect(context.exchangeCount).toBe(0);
      expect(context.flags).toEqual({});
    });

    it('tracks cumulative metrics', () => {
      const log = createEmptyLog();
      log.sessionEvents = [
        createBaseEvent('SESSION_STARTED', { isReturning: false }),
      ];
      log.cumulativeEvents.journeyCompletions = [
        createBaseEvent('JOURNEY_COMPLETED', { journeyId: 'j-1' }),
      ] as any;

      const context = projectMomentContext(log, NOW);
      expect(context.journeysCompleted).toBe(1);
    });
  });

  describe('deriveFlags', () => {
    it('returns empty flags for empty events', () => {
      const events: GroveEvent[] = [];
      const flags = deriveFlags(events);
      expect(flags).toEqual({});
    });

    it('sets journeyCompleted flag from session events', () => {
      const events: GroveEvent[] = [
        createBaseEvent('JOURNEY_COMPLETED', { journeyId: 'j-1' }),
      ];

      const flags = deriveFlags(events);
      expect(flags.journeyCompleted).toBe(true);
    });

    it('sets journeyStarted flag', () => {
      const events: GroveEvent[] = [
        createBaseEvent('JOURNEY_STARTED', { journeyId: 'j-1', lensId: 'l-1', waypointCount: 5 }),
      ];

      const flags = deriveFlags(events);
      expect(flags.journeyStarted).toBe(true);
    });
  });

  describe('deriveCooldowns', () => {
    it('returns empty cooldowns for no moments', () => {
      const events: GroveEvent[] = [];
      const cooldowns = deriveCooldowns(events);
      expect(cooldowns).toEqual({});
    });

    it('stores timestamp from moment surfaced', () => {
      const events: GroveEvent[] = [
        createBaseEvent('MOMENT_SURFACED', {
          timestamp: FIVE_MINUTES_AGO,
          momentId: 'm-1',
          surface: 'inline',
          priority: 1,
        }),
      ];

      const cooldowns = deriveCooldowns(events);
      expect(cooldowns['m-1']).toBe(FIVE_MINUTES_AGO);
    });
  });

  describe('deriveActiveMoments', () => {
    it('returns empty for no surfaced moments', () => {
      const events: GroveEvent[] = [];
      const active = deriveActiveMoments(events);
      expect(active).toEqual([]);
    });

    it('returns unresolved moments as active', () => {
      const events: GroveEvent[] = [
        createBaseEvent('MOMENT_SURFACED', { momentId: 'm-1', surface: 'inline', priority: 1 }),
        createBaseEvent('MOMENT_SURFACED', { momentId: 'm-2', surface: 'modal', priority: 2 }),
        createBaseEvent('MOMENT_RESOLVED', { momentId: 'm-1', resolution: 'actioned' }),
      ];

      const active = deriveActiveMoments(events);
      expect(active).toContain('m-2');
      expect(active).not.toContain('m-1');
    });
  });

  describe('getMomentsShown', () => {
    it('returns all surfaced moment IDs', () => {
      const events: GroveEvent[] = [
        createBaseEvent('MOMENT_SURFACED', { momentId: 'm-1', surface: 'inline', priority: 1 }),
        createBaseEvent('MOMENT_SURFACED', { momentId: 'm-2', surface: 'modal', priority: 2 }),
      ];

      const shown = getMomentsShown(events);
      expect(shown).toContain('m-1');
      expect(shown).toContain('m-2');
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// STREAM PROJECTION TESTS
// ─────────────────────────────────────────────────────────────────

describe('Stream Projection', () => {
  describe('projectStream', () => {
    it('returns initial state for empty events', () => {
      const state = projectStream([]);
      expect(state).toEqual(INITIAL_STREAM_STATE);
    });

    it('reconstructs query-response pairs', () => {
      const events: GroveEvent[] = [
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q1', content: 'What is Grove?' }),
        createBaseEvent('RESPONSE_COMPLETED', { responseId: 'r1', queryId: 'q1', hasNavigation: true, spanCount: 3 }),
      ];

      const state = projectStream(events);
      expect(state.items).toHaveLength(2);
      expect(state.items[0].type).toBe('query');
      expect(state.items[1].type).toBe('response');
    });

    it('tracks current item as query when pending', () => {
      const events: GroveEvent[] = [
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q1', content: 'test' }),
      ];

      const state = projectStream(events);
      // When only query exists, currentItem is null (response not yet received)
      expect(state.currentItem).toBeNull();
      expect(state.items[0].id).toBe('q1');
    });

    it('sets current item to response when completed', () => {
      const events: GroveEvent[] = [
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q1', content: 'test' }),
        createBaseEvent('RESPONSE_COMPLETED', { responseId: 'r1', queryId: 'q1', hasNavigation: false, spanCount: 1 }),
      ];

      const state = projectStream(events);
      expect(state.currentItem).not.toBeNull();
      expect(state.currentItem?.id).toBe('r1');
    });
  });

  describe('getLastStreamItems', () => {
    it('returns last N items', () => {
      const events: GroveEvent[] = [
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q1', content: 'one' }),
        createBaseEvent('RESPONSE_COMPLETED', { responseId: 'r1', queryId: 'q1', hasNavigation: false, spanCount: 1 }),
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q2', content: 'two' }),
        createBaseEvent('RESPONSE_COMPLETED', { responseId: 'r2', queryId: 'q2', hasNavigation: false, spanCount: 1 }),
      ];

      const last2 = getLastStreamItems(events, 2);
      expect(last2).toHaveLength(2);
    });
  });

  describe('getQueryResponsePairs', () => {
    it('returns matched pairs as tuples', () => {
      const events: GroveEvent[] = [
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q1', content: 'test' }),
        createBaseEvent('RESPONSE_COMPLETED', { responseId: 'r1', queryId: 'q1', hasNavigation: false, spanCount: 1 }),
      ];

      const pairs = getQueryResponsePairs(events);
      expect(pairs).toHaveLength(1);
      // Pairs are [query, response] tuples
      const [query, response] = pairs[0];
      expect(query.id).toBe('q1');
      expect(response.id).toBe('r1');
    });
  });

  describe('hasActiveQuery', () => {
    it('returns true when query pending', () => {
      const events: GroveEvent[] = [
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q1', content: 'test' }),
      ];
      expect(hasActiveQuery(events)).toBe(true);
    });

    it('returns false when all queries answered', () => {
      const events: GroveEvent[] = [
        createBaseEvent('QUERY_SUBMITTED', { queryId: 'q1', content: 'test' }),
        createBaseEvent('RESPONSE_COMPLETED', { responseId: 'r1', queryId: 'q1', hasNavigation: false, spanCount: 1 }),
      ];
      expect(hasActiveQuery(events)).toBe(false);
    });
  });
});
