// tests/unit/events/schema.test.ts
// Sprint: bedrock-event-architecture-v1

import { describe, it, expect } from 'vitest';
import {
  validateEvent,
  safeValidateEvent,
  validateEventLog,
  GroveEventSchema,
  SessionStartedEventSchema,
  QuerySubmittedEventSchema,
  GroveEventLogSchema,
} from '@core/events/schema';

describe('Event Validation', () => {
  describe('SessionStartedEventSchema', () => {
    it('validates valid session started event', () => {
      const event = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'SESSION_STARTED',
        sessionId: 'session-123',
        isReturning: false,
      };

      const result = SessionStartedEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('allows optional previousSessionId', () => {
      const event = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'SESSION_STARTED',
        sessionId: 'session-123',
        isReturning: true,
        previousSessionId: 'old-session',
      };

      const result = SessionStartedEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('rejects missing required fields', () => {
      const event = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'SESSION_STARTED',
        // missing sessionId, isReturning
      };

      const result = SessionStartedEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects empty fieldId', () => {
      const event = {
        fieldId: '',
        timestamp: Date.now(),
        type: 'SESSION_STARTED',
        sessionId: 'session-123',
        isReturning: false,
      };

      const result = SessionStartedEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe('QuerySubmittedEventSchema', () => {
    it('validates valid query event', () => {
      const event = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'QUERY_SUBMITTED',
        sessionId: 'session-123',
        queryId: 'query-123',
        content: 'What is Grove?',
      };

      const result = QuerySubmittedEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('allows optional intent and sourceResponseId', () => {
      const event = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'QUERY_SUBMITTED',
        sessionId: 'session-123',
        queryId: 'query-123',
        content: 'Tell me more',
        intent: 'deep_dive',
        sourceResponseId: 'response-456',
      };

      const result = QuerySubmittedEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('rejects invalid intent value', () => {
      const event = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'QUERY_SUBMITTED',
        sessionId: 'session-123',
        queryId: 'query-123',
        content: 'test',
        intent: 'invalid_intent',
      };

      const result = QuerySubmittedEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe('GroveEventSchema (discriminated union)', () => {
    it('validates and discriminates SESSION_STARTED', () => {
      const event = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'SESSION_STARTED',
        sessionId: 'session-123',
        isReturning: false,
      };

      const result = GroveEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('SESSION_STARTED');
      }
    });

    it('validates and discriminates JOURNEY_COMPLETED', () => {
      const event = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'JOURNEY_COMPLETED',
        sessionId: 'session-123',
        journeyId: 'journey-123',
        durationMs: 60000,
        waypointsVisited: 5,
      };

      const result = GroveEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('JOURNEY_COMPLETED');
      }
    });

    it('validates all 15 event types', () => {
      const events = [
        { type: 'SESSION_STARTED', isReturning: false },
        { type: 'SESSION_RESUMED', previousSessionId: 's-1', minutesSinceLastActivity: 10 },
        { type: 'LENS_ACTIVATED', lensId: 'l-1', source: 'selection', isCustom: false },
        { type: 'QUERY_SUBMITTED', queryId: 'q-1', content: 'test' },
        { type: 'RESPONSE_COMPLETED', responseId: 'r-1', queryId: 'q-1', hasNavigation: false, spanCount: 0 },
        { type: 'FORK_SELECTED', forkId: 'f-1', forkType: 'deep_dive', label: 'Test', responseId: 'r-1' },
        { type: 'PIVOT_TRIGGERED', conceptId: 'c-1', sourceText: 'test', responseId: 'r-1' },
        { type: 'HUB_ENTERED', hubId: 'h-1', source: 'query' },
        { type: 'JOURNEY_STARTED', journeyId: 'j-1', lensId: 'l-1', waypointCount: 5 },
        { type: 'JOURNEY_ADVANCED', journeyId: 'j-1', waypointId: 'w-1', position: 1 },
        { type: 'JOURNEY_COMPLETED', journeyId: 'j-1' },
        { type: 'INSIGHT_CAPTURED', sproutId: 's-1' },
        { type: 'TOPIC_EXPLORED', topicId: 't-1', hubId: 'h-1' },
        { type: 'MOMENT_SURFACED', momentId: 'm-1', surface: 'inline', priority: 1 },
        { type: 'MOMENT_RESOLVED', momentId: 'm-1', resolution: 'actioned' },
      ];

      const baseFields = {
        fieldId: 'grove',
        timestamp: Date.now(),
        sessionId: 'session-123',
      };

      for (const eventData of events) {
        const event = { ...baseFields, ...eventData };
        const result = GroveEventSchema.safeParse(event);
        expect(result.success).toBe(true);
      }
    });

    it('rejects unknown event type', () => {
      const event = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'UNKNOWN_EVENT',
        sessionId: 'session-123',
      };

      const result = GroveEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe('validateEvent function', () => {
    it('returns validated event on success', () => {
      const event = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'SESSION_STARTED',
        sessionId: 'session-123',
        isReturning: false,
      };

      const validated = validateEvent(event);
      expect(validated.type).toBe('SESSION_STARTED');
    });

    it('throws on invalid event', () => {
      const event = {
        type: 'INVALID',
      };

      expect(() => validateEvent(event)).toThrow();
    });
  });

  describe('safeValidateEvent function', () => {
    it('returns success result for valid event', () => {
      const event = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'SESSION_STARTED',
        sessionId: 'session-123',
        isReturning: false,
      };

      const result = safeValidateEvent(event);
      expect(result.success).toBe(true);
    });

    it('returns error result for invalid event', () => {
      const event = {
        type: 'INVALID',
      };

      const result = safeValidateEvent(event);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});

describe('EventLog Validation', () => {
  describe('GroveEventLogSchema', () => {
    it('validates valid event log', () => {
      const log = {
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
        lastSessionAt: Date.now(),
      };

      const result = GroveEventLogSchema.safeParse(log);
      expect(result.success).toBe(true);
    });

    it('validates event log with events', () => {
      const now = Date.now();
      const log = {
        version: 3,
        fieldId: 'grove',
        currentSessionId: 'session-123',
        sessionEvents: [
          {
            fieldId: 'grove',
            timestamp: now,
            type: 'SESSION_STARTED',
            sessionId: 'session-123',
            isReturning: false,
          },
        ],
        cumulativeEvents: {
          journeyCompletions: [
            {
              fieldId: 'grove',
              timestamp: now,
              type: 'JOURNEY_COMPLETED',
              sessionId: 'session-123',
              journeyId: 'j-1',
            },
          ],
          topicExplorations: [],
          insightCaptures: [],
        },
        sessionCount: 1,
        lastSessionAt: now,
      };

      const result = GroveEventLogSchema.safeParse(log);
      expect(result.success).toBe(true);
    });

    it('rejects wrong version', () => {
      const log = {
        version: 2, // Wrong version
        fieldId: 'grove',
        currentSessionId: 'session-123',
        sessionEvents: [],
        cumulativeEvents: {
          journeyCompletions: [],
          topicExplorations: [],
          insightCaptures: [],
        },
        sessionCount: 1,
        lastSessionAt: Date.now(),
      };

      const result = GroveEventLogSchema.safeParse(log);
      expect(result.success).toBe(false);
    });

    it('rejects missing cumulativeEvents', () => {
      const log = {
        version: 3,
        fieldId: 'grove',
        currentSessionId: 'session-123',
        sessionEvents: [],
        // missing cumulativeEvents
        sessionCount: 1,
        lastSessionAt: Date.now(),
      };

      const result = GroveEventLogSchema.safeParse(log);
      expect(result.success).toBe(false);
    });
  });

  describe('validateEventLog function', () => {
    it('returns validated log on success', () => {
      const log = {
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
        lastSessionAt: Date.now(),
      };

      const validated = validateEventLog(log);
      expect(validated.version).toBe(3);
    });

    it('throws on invalid log', () => {
      const log = {
        version: 1,
      };

      expect(() => validateEventLog(log)).toThrow();
    });
  });
});
