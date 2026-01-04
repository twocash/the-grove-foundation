// tests/unit/events/hooks.test.tsx
// Sprint: bedrock-event-hooks-v1

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  GroveEventProvider,
  useGroveEvents,
  useDispatch,
  useStartNewSession,
  useEventHelpers,
  useSession,
  useContextState,
  useTelemetry,
  useMomentContext,
  useStream,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
} from '@core/events/hooks';
import { createEventLog } from '@core/events/store';
import type { GroveEventLog, GroveEvent } from '@core/events/types';

// ─────────────────────────────────────────────────────────────────
// TEST FIXTURES
// ─────────────────────────────────────────────────────────────────

const NOW = 1704067200000; // 2024-01-01 00:00:00 UTC

function createTestLog(): GroveEventLog {
  return createEventLog({
    currentSessionId: 'test-session',
    fieldId: 'grove',
  });
}

function createWrapper(log?: GroveEventLog) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <GroveEventProvider initialLog={log} disablePersistence>
        {children}
      </GroveEventProvider>
    );
  };
}

// ─────────────────────────────────────────────────────────────────
// PROVIDER TESTS
// ─────────────────────────────────────────────────────────────────

describe('GroveEventProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('initializes with provided log', () => {
    const testLog = createTestLog();
    const { result } = renderHook(() => useGroveEvents(), {
      wrapper: createWrapper(testLog),
    });

    expect(result.current.currentSessionId).toBe('test-session');
    expect(result.current.fieldId).toBe('grove');
  });

  it('creates fresh log when no storage and no initial log', () => {
    const { result } = renderHook(() => useGroveEvents(), {
      wrapper: createWrapper(),
    });

    expect(result.current.version).toBe(3);
    expect(result.current.sessionEvents).toEqual([]);
  });

  it('persists to localStorage when enabled', () => {
    function PersistWrapper({ children }: { children: React.ReactNode }) {
      return (
        <GroveEventProvider>
          {children}
        </GroveEventProvider>
      );
    }

    const { result } = renderHook(() => useDispatch(), {
      wrapper: PersistWrapper,
    });

    // Dispatch an event
    act(() => {
      result.current({
        type: 'SESSION_STARTED',
        fieldId: 'grove',
        timestamp: NOW,
        sessionId: 'test',
        isReturning: false,
      });
    });

    // Check localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.sessionEvents).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// CORE HOOKS TESTS
// ─────────────────────────────────────────────────────────────────

describe('useGroveEvents', () => {
  it('throws outside provider', () => {
    expect(() => {
      renderHook(() => useGroveEvents());
    }).toThrow('useGroveEvents must be used within a GroveEventProvider');
  });

  it('returns full event log', () => {
    const testLog = createTestLog();
    const { result } = renderHook(() => useGroveEvents(), {
      wrapper: createWrapper(testLog),
    });

    expect(result.current).toHaveProperty('version', 3);
    expect(result.current).toHaveProperty('sessionEvents');
    expect(result.current).toHaveProperty('cumulativeEvents');
  });
});

describe('useDispatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws outside provider', () => {
    expect(() => {
      renderHook(() => useDispatch());
    }).toThrow('useDispatch must be used within a GroveEventProvider');
  });

  it('adds valid event to log', () => {
    const testLog = createTestLog();
    const { result } = renderHook(
      () => ({
        dispatch: useDispatch(),
        log: useGroveEvents(),
      }),
      { wrapper: createWrapper(testLog) }
    );

    expect(result.current.log.sessionEvents).toHaveLength(0);

    act(() => {
      result.current.dispatch({
        type: 'SESSION_STARTED',
        fieldId: 'grove',
        timestamp: NOW,
        sessionId: 'test-session',
        isReturning: false,
      });
    });

    expect(result.current.log.sessionEvents).toHaveLength(1);
    expect(result.current.log.sessionEvents[0].type).toBe('SESSION_STARTED');
  });

  it('throws on invalid event', () => {
    const testLog = createTestLog();
    const { result } = renderHook(() => useDispatch(), {
      wrapper: createWrapper(testLog),
    });

    expect(() => {
      act(() => {
        result.current({
          type: 'INVALID_TYPE',
          fieldId: 'grove',
          timestamp: NOW,
          sessionId: 'test',
        } as unknown as GroveEvent);
      });
    }).toThrow();
  });
});

describe('useStartNewSession', () => {
  it('clears session events and increments count', () => {
    const testLog = createTestLog();
    const { result } = renderHook(
      () => ({
        startNewSession: useStartNewSession(),
        log: useGroveEvents(),
        dispatch: useDispatch(),
      }),
      { wrapper: createWrapper(testLog) }
    );

    // Add an event first
    act(() => {
      result.current.dispatch({
        type: 'SESSION_STARTED',
        fieldId: 'grove',
        timestamp: Date.now(),
        sessionId: 'test-session',
        isReturning: false,
      });
    });

    expect(result.current.log.sessionEvents).toHaveLength(1);
    const originalSessionId = result.current.log.currentSessionId;
    const originalCount = result.current.log.sessionCount;

    // Start new session
    act(() => {
      result.current.startNewSession();
    });

    expect(result.current.log.sessionEvents).toHaveLength(0);
    expect(result.current.log.currentSessionId).not.toBe(originalSessionId);
    expect(result.current.log.sessionCount).toBe(originalCount + 1);
  });
});

describe('useEventHelpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits sessionStarted event', () => {
    const testLog = createTestLog();
    const { result } = renderHook(
      () => ({
        helpers: useEventHelpers(),
        log: useGroveEvents(),
      }),
      { wrapper: createWrapper(testLog) }
    );

    act(() => {
      result.current.helpers.emit.sessionStarted(true, 'old-session');
    });

    expect(result.current.log.sessionEvents).toHaveLength(1);
    const event = result.current.log.sessionEvents[0];
    expect(event.type).toBe('SESSION_STARTED');
    expect((event as any).isReturning).toBe(true);
    expect((event as any).previousSessionId).toBe('old-session');
  });

  it('emits lensActivated event', () => {
    const testLog = createTestLog();
    const { result } = renderHook(
      () => ({
        helpers: useEventHelpers(),
        log: useGroveEvents(),
      }),
      { wrapper: createWrapper(testLog) }
    );

    act(() => {
      result.current.helpers.emit.lensActivated('engineer', 'selection', false);
    });

    expect(result.current.log.sessionEvents).toHaveLength(1);
    const event = result.current.log.sessionEvents[0];
    expect(event.type).toBe('LENS_ACTIVATED');
    expect((event as any).lensId).toBe('engineer');
  });

  it('emits querySubmitted event', () => {
    const testLog = createTestLog();
    const { result } = renderHook(
      () => ({
        helpers: useEventHelpers(),
        log: useGroveEvents(),
      }),
      { wrapper: createWrapper(testLog) }
    );

    act(() => {
      result.current.helpers.emit.querySubmitted('q-1', 'What is Grove?');
    });

    expect(result.current.log.sessionEvents).toHaveLength(1);
    const event = result.current.log.sessionEvents[0];
    expect(event.type).toBe('QUERY_SUBMITTED');
    expect((event as any).content).toBe('What is Grove?');
  });

  it('emits journeyCompleted event (cumulative)', () => {
    const testLog = createTestLog();
    const { result } = renderHook(
      () => ({
        helpers: useEventHelpers(),
        log: useGroveEvents(),
      }),
      { wrapper: createWrapper(testLog) }
    );

    act(() => {
      result.current.helpers.emit.journeyCompleted('j-1', 300000, 5);
    });

    expect(result.current.log.sessionEvents).toHaveLength(1);
    expect(result.current.log.cumulativeEvents.journeyCompletions).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// PROJECTION HOOKS TESTS
// ─────────────────────────────────────────────────────────────────

describe('useSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial session state', () => {
    const testLog = createTestLog();
    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(testLog),
    });

    expect(result.current.lensId).toBeNull();
    expect(result.current.interactionCount).toBe(0);
  });

  it('updates when lens is activated', () => {
    const testLog = createTestLog();
    const { result } = renderHook(
      () => ({
        session: useSession(),
        helpers: useEventHelpers(),
      }),
      { wrapper: createWrapper(testLog) }
    );

    act(() => {
      result.current.helpers.emit.lensActivated('engineer', 'selection', false);
    });

    expect(result.current.session.lensId).toBe('engineer');
  });

  it('tracks interaction count', () => {
    const testLog = createTestLog();
    const { result } = renderHook(
      () => ({
        session: useSession(),
        helpers: useEventHelpers(),
      }),
      { wrapper: createWrapper(testLog) }
    );

    act(() => {
      result.current.helpers.emit.querySubmitted('q-1', 'Hello');
      result.current.helpers.emit.querySubmitted('q-2', 'World');
    });

    expect(result.current.session.interactionCount).toBe(2);
  });
});

describe('useContextState', () => {
  it('returns initial context state', () => {
    const testLog = createTestLog();
    const { result } = renderHook(() => useContextState(), {
      wrapper: createWrapper(testLog),
    });

    expect(result.current.stage).toBe('ARRIVAL');
    expect(result.current.entropy).toBe(0);
  });
});

describe('useTelemetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns V2 compatible metrics', () => {
    const testLog = createTestLog();
    const { result } = renderHook(() => useTelemetry(), {
      wrapper: createWrapper(testLog),
    });

    expect(result.current.metrics.version).toBe(2);
    expect(result.current.metrics.fieldId).toBe('grove');
  });

  it('returns computed metrics', () => {
    const testLog = createTestLog();
    const { result } = renderHook(() => useTelemetry(), {
      wrapper: createWrapper(testLog),
    });

    expect(result.current.computed).toHaveProperty('journeysCompleted');
    expect(result.current.computed).toHaveProperty('topicsExplored');
  });

  it('updates computed metrics on journey completion', () => {
    const testLog = createTestLog();
    const { result } = renderHook(
      () => ({
        telemetry: useTelemetry(),
        helpers: useEventHelpers(),
      }),
      { wrapper: createWrapper(testLog) }
    );

    expect(result.current.telemetry.computed.journeysCompleted).toBe(0);

    act(() => {
      result.current.helpers.emit.journeyCompleted('j-1');
    });

    expect(result.current.telemetry.computed.journeysCompleted).toBe(1);
  });
});

describe('useMomentContext', () => {
  it('returns moment evaluation context', () => {
    const testLog = createTestLog();
    const { result } = renderHook(() => useMomentContext(), {
      wrapper: createWrapper(testLog),
    });

    expect(result.current).toHaveProperty('stage');
    expect(result.current).toHaveProperty('exchangeCount');
    expect(result.current).toHaveProperty('flags');
    expect(result.current).toHaveProperty('cooldowns');
  });
});

describe('useStream', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty stream initially', () => {
    const testLog = createTestLog();
    const { result } = renderHook(() => useStream(), {
      wrapper: createWrapper(testLog),
    });

    expect(result.current.items).toEqual([]);
  });

  it('tracks queries in stream', () => {
    const testLog = createTestLog();
    const { result } = renderHook(
      () => ({
        stream: useStream(),
        helpers: useEventHelpers(),
      }),
      { wrapper: createWrapper(testLog) }
    );

    act(() => {
      result.current.helpers.emit.querySubmitted('q-1', 'Hello');
    });

    expect(result.current.stream.items).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// MEMOIZATION TESTS
// ─────────────────────────────────────────────────────────────────

describe('Memoization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('useSession returns same object when events unchanged', () => {
    const testLog = createTestLog();
    const { result, rerender } = renderHook(() => useSession(), {
      wrapper: createWrapper(testLog),
    });

    const first = result.current;
    rerender();
    const second = result.current;

    // Same reference means memoization is working
    expect(first).toBe(second);
  });

  it('useSession returns new object when events change', () => {
    const testLog = createTestLog();
    const { result } = renderHook(
      () => ({
        session: useSession(),
        helpers: useEventHelpers(),
      }),
      { wrapper: createWrapper(testLog) }
    );

    const first = result.current.session;

    act(() => {
      result.current.helpers.emit.lensActivated('engineer', 'selection', false);
    });

    const second = result.current.session;

    // Different reference means projection was recomputed
    expect(first).not.toBe(second);
  });
});
