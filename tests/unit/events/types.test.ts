// tests/unit/events/types.test.ts
// Sprint: bedrock-event-architecture-v1

import { describe, it, expect } from 'vitest';
import {
  isGroveEvent,
  isSessionEvent,
  isCumulativeEvent,
  type GroveEvent,
  type SessionStartedEvent,
  type JourneyCompletedEvent,
  type QuerySubmittedEvent,
} from '@core/events/types';

describe('Type Guards', () => {
  describe('isGroveEvent', () => {
    it('returns true for valid event', () => {
      const event: SessionStartedEvent = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'SESSION_STARTED',
        sessionId: 'test-session',
        isReturning: false,
      };
      expect(isGroveEvent(event)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isGroveEvent(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isGroveEvent(undefined)).toBe(false);
    });

    it('returns false for non-object', () => {
      expect(isGroveEvent('string')).toBe(false);
      expect(isGroveEvent(123)).toBe(false);
    });

    it('returns false for missing required fields', () => {
      expect(isGroveEvent({ type: 'TEST' })).toBe(false);
      expect(isGroveEvent({ fieldId: 'grove' })).toBe(false);
      expect(isGroveEvent({ timestamp: 123 })).toBe(false);
    });
  });

  describe('isSessionEvent', () => {
    it('returns true for SESSION_STARTED', () => {
      const event: SessionStartedEvent = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'SESSION_STARTED',
        sessionId: 'test-session',
        isReturning: false,
      };
      expect(isSessionEvent(event)).toBe(true);
    });

    it('returns true for SESSION_RESUMED', () => {
      const event: GroveEvent = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'SESSION_RESUMED',
        sessionId: 'test-session',
        previousSessionId: 'old-session',
        minutesSinceLastActivity: 30,
      };
      expect(isSessionEvent(event)).toBe(true);
    });

    it('returns false for non-session events', () => {
      const event: QuerySubmittedEvent = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'QUERY_SUBMITTED',
        sessionId: 'test-session',
        queryId: 'q-123',
        content: 'test query',
      };
      expect(isSessionEvent(event)).toBe(false);
    });
  });

  describe('isCumulativeEvent', () => {
    it('returns true for JOURNEY_COMPLETED', () => {
      const event: JourneyCompletedEvent = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'JOURNEY_COMPLETED',
        sessionId: 'test-session',
        journeyId: 'j-123',
      };
      expect(isCumulativeEvent(event)).toBe(true);
    });

    it('returns true for TOPIC_EXPLORED', () => {
      const event: GroveEvent = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'TOPIC_EXPLORED',
        sessionId: 'test-session',
        topicId: 't-123',
        hubId: 'h-123',
      };
      expect(isCumulativeEvent(event)).toBe(true);
    });

    it('returns true for INSIGHT_CAPTURED', () => {
      const event: GroveEvent = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'INSIGHT_CAPTURED',
        sessionId: 'test-session',
        sproutId: 's-123',
      };
      expect(isCumulativeEvent(event)).toBe(true);
    });

    it('returns false for non-cumulative events', () => {
      const event: SessionStartedEvent = {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'SESSION_STARTED',
        sessionId: 'test-session',
        isReturning: false,
      };
      expect(isCumulativeEvent(event)).toBe(false);
    });
  });
});

describe('Type Narrowing', () => {
  it('narrows event type based on discriminant', () => {
    const event: GroveEvent = {
      fieldId: 'grove',
      timestamp: Date.now(),
      type: 'QUERY_SUBMITTED',
      sessionId: 'test-session',
      queryId: 'q-123',
      content: 'What is Grove?',
    };

    if (event.type === 'QUERY_SUBMITTED') {
      // Type should be narrowed to QuerySubmittedEvent
      expect(event.queryId).toBe('q-123');
      expect(event.content).toBe('What is Grove?');
    }
  });

  it('narrows session event types', () => {
    const events: GroveEvent[] = [
      {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'SESSION_STARTED',
        sessionId: 'test-session',
        isReturning: true,
        previousSessionId: 'old-session',
      },
      {
        fieldId: 'grove',
        timestamp: Date.now(),
        type: 'QUERY_SUBMITTED',
        sessionId: 'test-session',
        queryId: 'q-123',
        content: 'test',
      },
    ];

    const sessionEvents = events.filter(isSessionEvent);
    expect(sessionEvents).toHaveLength(1);
    expect(sessionEvents[0].type).toBe('SESSION_STARTED');
  });
});
