// tests/unit/events/integration.test.tsx
// Sprint: bedrock-event-integration-v1
// Integration tests for feature-flagged event system

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  GroveEventProvider,
  ExploreEventProvider,
  useEventBridge,
  useSafeEventBridge,
  useIsEventSystemEnabled,
  GROVE_EVENT_SYSTEM_FLAG,
  useGroveEvents,
} from '@core/events/hooks';

// ─────────────────────────────────────────────────────────────────
// TEST FIXTURES
// ─────────────────────────────────────────────────────────────────

const NOW = 1704067200000; // 2024-01-01 00:00:00 UTC

// Helper to set feature flag via URL or localStorage
function setFeatureFlag(enabled: boolean, method: 'url' | 'localStorage' = 'localStorage') {
  if (method === 'url') {
    // Mock URL params
    const url = new URL(window.location.href);
    if (enabled) {
      url.searchParams.set('grove-events', 'true');
    } else {
      url.searchParams.set('grove-events', 'false');
    }
    Object.defineProperty(window, 'location', {
      value: { ...window.location, href: url.href, search: url.search },
      writable: true
    });
  } else {
    localStorage.setItem('grove-event-system-override', enabled ? 'true' : 'false');
  }
}

function clearFeatureFlag() {
  localStorage.removeItem('grove-event-system-override');
}

// ─────────────────────────────────────────────────────────────────
// FEATURE FLAG TESTS
// ─────────────────────────────────────────────────────────────────

describe('Feature Flag', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('exports GROVE_EVENT_SYSTEM_FLAG constant', () => {
    expect(GROVE_EVENT_SYSTEM_FLAG).toBe('grove-event-system');
  });

  describe('useIsEventSystemEnabled', () => {
    it('returns false by default', () => {
      const { result } = renderHook(() => useIsEventSystemEnabled());
      expect(result.current).toBe(false);
    });

    it('returns true when localStorage override is set', () => {
      setFeatureFlag(true);
      const { result } = renderHook(() => useIsEventSystemEnabled());
      expect(result.current).toBe(true);
    });

    it('returns false when localStorage override is explicitly false', () => {
      setFeatureFlag(false);
      const { result } = renderHook(() => useIsEventSystemEnabled());
      expect(result.current).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// EXPLORE EVENT PROVIDER TESTS
// ─────────────────────────────────────────────────────────────────

describe('ExploreEventProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('passes through children when flag is disabled', () => {
    const { result } = renderHook(
      () => {
        try {
          return { log: useGroveEvents(), hasProvider: true };
        } catch {
          return { log: null, hasProvider: false };
        }
      },
      {
        wrapper: ({ children }) => (
          <ExploreEventProvider>{children}</ExploreEventProvider>
        ),
      }
    );

    // Should throw because no GroveEventProvider
    expect(result.current.hasProvider).toBe(false);
  });

  it('wraps with GroveEventProvider when forceEnabled is true', () => {
    const { result } = renderHook(() => useGroveEvents(), {
      wrapper: ({ children }) => (
        <ExploreEventProvider forceEnabled>{children}</ExploreEventProvider>
      ),
    });

    expect(result.current.version).toBe(3);
    expect(result.current.fieldId).toBe('grove');
  });

  it('wraps with GroveEventProvider when localStorage override is set', () => {
    setFeatureFlag(true);

    const { result } = renderHook(() => useGroveEvents(), {
      wrapper: ({ children }) => (
        <ExploreEventProvider>{children}</ExploreEventProvider>
      ),
    });

    expect(result.current.version).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────
// EVENT BRIDGE TESTS
// ─────────────────────────────────────────────────────────────────

describe('useEventBridge', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('when flag is disabled', () => {
    it('reports isNewSystemEnabled as false', () => {
      const { result } = renderHook(() => useEventBridge(), {
        wrapper: ({ children }) => (
          <GroveEventProvider disablePersistence>
            {children}
          </GroveEventProvider>
        ),
      });

      expect(result.current.isNewSystemEnabled).toBe(false);
    });

    it('reports isProviderAvailable as true when inside provider', () => {
      const { result } = renderHook(() => useEventBridge(), {
        wrapper: ({ children }) => (
          <GroveEventProvider disablePersistence>
            {children}
          </GroveEventProvider>
        ),
      });

      expect(result.current.isProviderAvailable).toBe(true);
    });

    it('has all emit methods available', () => {
      const { result } = renderHook(() => useEventBridge(), {
        wrapper: ({ children }) => (
          <GroveEventProvider disablePersistence>
            {children}
          </GroveEventProvider>
        ),
      });

      expect(typeof result.current.emit.querySubmitted).toBe('function');
      expect(typeof result.current.emit.responseCompleted).toBe('function');
      expect(typeof result.current.emit.lensActivated).toBe('function');
      expect(typeof result.current.emit.journeyStarted).toBe('function');
      expect(typeof result.current.emit.journeyCompleted).toBe('function');
      expect(typeof result.current.emit.hubEntered).toBe('function');
      expect(typeof result.current.emit.insightCaptured).toBe('function');
      expect(typeof result.current.emit.sessionStarted).toBe('function');
    });

    it('does not dispatch to new system when flag is disabled', () => {
      const { result } = renderHook(
        () => ({
          bridge: useEventBridge(),
          log: useGroveEvents(),
        }),
        {
          wrapper: ({ children }) => (
            <GroveEventProvider disablePersistence>
              {children}
            </GroveEventProvider>
          ),
        }
      );

      act(() => {
        result.current.bridge.emit.querySubmitted('q-1', 'Hello world');
      });

      // New system should not have the event when flag is disabled
      expect(result.current.log.sessionEvents).toHaveLength(0);
    });
  });

  describe('when flag is enabled', () => {
    beforeEach(() => {
      setFeatureFlag(true);
    });

    it('reports isNewSystemEnabled as true', () => {
      const { result } = renderHook(() => useEventBridge(), {
        wrapper: ({ children }) => (
          <GroveEventProvider disablePersistence>
            {children}
          </GroveEventProvider>
        ),
      });

      expect(result.current.isNewSystemEnabled).toBe(true);
    });

    it('dispatches querySubmitted to new system', () => {
      const { result } = renderHook(
        () => ({
          bridge: useEventBridge(),
          log: useGroveEvents(),
        }),
        {
          wrapper: ({ children }) => (
            <GroveEventProvider disablePersistence>
              {children}
            </GroveEventProvider>
          ),
        }
      );

      act(() => {
        result.current.bridge.emit.querySubmitted('q-1', 'Hello world', 'deep_dive');
      });

      expect(result.current.log.sessionEvents).toHaveLength(1);
      expect(result.current.log.sessionEvents[0].type).toBe('QUERY_SUBMITTED');
    });

    it('dispatches lensActivated to new system', () => {
      const { result } = renderHook(
        () => ({
          bridge: useEventBridge(),
          log: useGroveEvents(),
        }),
        {
          wrapper: ({ children }) => (
            <GroveEventProvider disablePersistence>
              {children}
            </GroveEventProvider>
          ),
        }
      );

      act(() => {
        result.current.bridge.emit.lensActivated('engineer', 'selection', false);
      });

      expect(result.current.log.sessionEvents).toHaveLength(1);
      expect(result.current.log.sessionEvents[0].type).toBe('LENS_ACTIVATED');
    });

    it('dispatches journeyStarted to new system', () => {
      const { result } = renderHook(
        () => ({
          bridge: useEventBridge(),
          log: useGroveEvents(),
        }),
        {
          wrapper: ({ children }) => (
            <GroveEventProvider disablePersistence>
              {children}
            </GroveEventProvider>
          ),
        }
      );

      act(() => {
        result.current.bridge.emit.journeyStarted('journey-1', 'engineer', 5);
      });

      expect(result.current.log.sessionEvents).toHaveLength(1);
      expect(result.current.log.sessionEvents[0].type).toBe('JOURNEY_STARTED');
    });

    it('dispatches journeyCompleted to cumulative events', () => {
      const { result } = renderHook(
        () => ({
          bridge: useEventBridge(),
          log: useGroveEvents(),
        }),
        {
          wrapper: ({ children }) => (
            <GroveEventProvider disablePersistence>
              {children}
            </GroveEventProvider>
          ),
        }
      );

      act(() => {
        result.current.bridge.emit.journeyCompleted('journey-1', 300000, 5);
      });

      expect(result.current.log.sessionEvents).toHaveLength(1);
      expect(result.current.log.cumulativeEvents.journeyCompletions).toHaveLength(1);
    });

    it('dispatches hubEntered to new system', () => {
      const { result } = renderHook(
        () => ({
          bridge: useEventBridge(),
          log: useGroveEvents(),
        }),
        {
          wrapper: ({ children }) => (
            <GroveEventProvider disablePersistence>
              {children}
            </GroveEventProvider>
          ),
        }
      );

      act(() => {
        result.current.bridge.emit.hubEntered('ratchet-effect', 'query');
      });

      expect(result.current.log.sessionEvents).toHaveLength(1);
      expect(result.current.log.sessionEvents[0].type).toBe('HUB_ENTERED');
    });

    it('dispatches insightCaptured to new system', () => {
      const { result } = renderHook(
        () => ({
          bridge: useEventBridge(),
          log: useGroveEvents(),
        }),
        {
          wrapper: ({ children }) => (
            <GroveEventProvider disablePersistence>
              {children}
            </GroveEventProvider>
          ),
        }
      );

      act(() => {
        result.current.bridge.emit.insightCaptured('sprout-1', { journeyId: 'j-1' });
      });

      expect(result.current.log.sessionEvents).toHaveLength(1);
      expect(result.current.log.sessionEvents[0].type).toBe('INSIGHT_CAPTURED');
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// SAFE EVENT BRIDGE TESTS
// ─────────────────────────────────────────────────────────────────

describe('useSafeEventBridge', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('returns no-op API when outside providers', () => {
    const { result } = renderHook(() => useSafeEventBridge());

    expect(result.current.isNewSystemEnabled).toBe(false);
    expect(result.current.isProviderAvailable).toBe(false);

    // Should not throw when calling emit methods
    expect(() => {
      result.current.emit.querySubmitted('q-1', 'Hello');
      result.current.emit.lensActivated('test', 'selection', false);
    }).not.toThrow();
  });

  it('returns working API when inside provider', () => {
    setFeatureFlag(true);

    const { result } = renderHook(
      () => ({
        bridge: useSafeEventBridge(),
        log: useGroveEvents(),
      }),
      {
        wrapper: ({ children }) => (
          <GroveEventProvider disablePersistence>
            {children}
          </GroveEventProvider>
        ),
      }
    );

    expect(result.current.bridge.isProviderAvailable).toBe(true);
    expect(result.current.bridge.isNewSystemEnabled).toBe(true);

    act(() => {
      result.current.bridge.emit.querySubmitted('q-1', 'Hello');
    });

    expect(result.current.log.sessionEvents).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// BACKWARD COMPATIBILITY TESTS
// ─────────────────────────────────────────────────────────────────

describe('Backward Compatibility', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('legacy engagement bus is not blocked when new system is enabled', () => {
    setFeatureFlag(true);

    // This test verifies that the bridge hook can coexist with legacy
    // The actual dual-write to legacy is async and uses dynamic import,
    // so we verify the new system works and doesn't throw
    const { result } = renderHook(
      () => ({
        bridge: useEventBridge(),
        log: useGroveEvents(),
      }),
      {
        wrapper: ({ children }) => (
          <GroveEventProvider disablePersistence>
            {children}
          </GroveEventProvider>
        ),
      }
    );

    // Should not throw when dual-write attempts to import legacy bus
    act(() => {
      result.current.bridge.emit.querySubmitted('q-1', 'Test query');
      result.current.bridge.emit.lensActivated('engineer', 'selection', false);
      result.current.bridge.emit.journeyStarted('j-1', 'engineer', 5);
      result.current.bridge.emit.journeyCompleted('j-1', 60000, 3);
      result.current.bridge.emit.hubEntered('hub-1', 'query');
      result.current.bridge.emit.insightCaptured('sprout-1', { journeyId: 'j-1' });
      result.current.bridge.emit.sessionStarted(false);
    });

    // Verify new system received all events
    expect(result.current.log.sessionEvents.length).toBeGreaterThan(0);
  });

  it('new system stores events in correct format', () => {
    setFeatureFlag(true);

    const { result } = renderHook(
      () => ({
        bridge: useEventBridge(),
        log: useGroveEvents(),
      }),
      {
        wrapper: ({ children }) => (
          <GroveEventProvider disablePersistence>
            {children}
          </GroveEventProvider>
        ),
      }
    );

    act(() => {
      result.current.bridge.emit.querySubmitted('q-1', 'What is Grove?', 'deep_dive');
    });

    const event = result.current.log.sessionEvents[0];
    expect(event.type).toBe('QUERY_SUBMITTED');
    expect(event.fieldId).toBe('grove');
    expect(event.timestamp).toBe(NOW);
    expect((event as any).queryId).toBe('q-1');
    expect((event as any).content).toBe('What is Grove?');
    expect((event as any).intent).toBe('deep_dive');
  });
});
