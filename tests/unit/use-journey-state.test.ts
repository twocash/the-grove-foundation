// tests/unit/use-journey-state.test.ts
// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createActor } from 'xstate';
import { engagementMachine } from '../../src/core/engagement';
import { useJourneyState } from '../../src/core/engagement/hooks/useJourneyState';
import { clearCompletedJourneys } from '../../src/core/engagement/persistence';

const mockJourney = {
  id: 'test-journey',
  name: 'Test Journey',
  hubId: 'test-hub',
  steps: [
    { id: 'step-1', title: 'Step 1', content: 'Content 1' },
    { id: 'step-2', title: 'Step 2', content: 'Content 2' },
    { id: 'step-3', title: 'Step 3', content: 'Content 3' },
  ],
};

describe('useJourneyState', () => {
  let actor: ReturnType<typeof createActor<typeof engagementMachine>>;

  beforeEach(() => {
    localStorage.clear();
    actor = createActor(engagementMachine);
    actor.start();
    // Set lens first (required for journey)
    actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
  });

  afterEach(() => {
    actor.stop();
    clearCompletedJourneys();
  });

  describe('state derivation', () => {
    test('derives journey as null initially', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));
      expect(result.current.journey).toBeNull();
    });

    test('derives isActive as false initially', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));
      expect(result.current.isActive).toBe(false);
    });

    test('derives isComplete as false initially', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));
      expect(result.current.isComplete).toBe(false);
    });

    test('derives journey from machine context after start', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));

      act(() => {
        result.current.startJourney(mockJourney);
      });

      expect(result.current.journey).toEqual(mockJourney);
      expect(result.current.isActive).toBe(true);
    });
  });

  describe('computed values', () => {
    test('currentStep returns null when no journey', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));
      expect(result.current.currentStep).toBeNull();
    });

    test('currentStep returns first step after start', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));

      act(() => {
        result.current.startJourney(mockJourney);
      });

      expect(result.current.currentStep).toEqual(mockJourney.steps[0]);
    });

    test('progressPercent is 0 when no journey', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));
      expect(result.current.progressPercent).toBe(0);
    });

    test('progressPercent calculates correctly', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));

      act(() => {
        result.current.startJourney(mockJourney);
      });

      // Step 1 of 3 = 33%
      expect(result.current.progressPercent).toBe(33);

      act(() => {
        result.current.advanceStep();
      });

      // Step 2 of 3 = 67%
      expect(result.current.progressPercent).toBe(67);
    });
  });

  describe('actions', () => {
    test('startJourney starts journey', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));

      act(() => {
        result.current.startJourney(mockJourney);
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.journey).toEqual(mockJourney);
    });

    test('advanceStep increments progress', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));

      act(() => {
        result.current.startJourney(mockJourney);
      });

      expect(result.current.journeyProgress).toBe(0);

      act(() => {
        result.current.advanceStep();
      });

      expect(result.current.journeyProgress).toBe(1);
      expect(result.current.currentStep).toEqual(mockJourney.steps[1]);
    });

    test('completeJourney transitions to complete state', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));

      act(() => {
        result.current.startJourney(mockJourney);
        result.current.completeJourney();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isComplete).toBe(true);
    });

    test('exitJourney clears journey and returns to lens state', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));

      act(() => {
        result.current.startJourney(mockJourney);
        result.current.exitJourney();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.journey).toBeNull();
    });
  });

  describe('completion tracking', () => {
    test('completedJourneys returns empty array initially', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));
      expect(result.current.completedJourneys).toEqual([]);
    });

    test('isJourneyCompleted returns false for incomplete', () => {
      const { result } = renderHook(() => useJourneyState({ actor }));
      expect(result.current.isJourneyCompleted('test-journey')).toBe(false);
    });

    test('persists completion when journey completes', async () => {
      const { result } = renderHook(() => useJourneyState({ actor }));

      act(() => {
        result.current.startJourney(mockJourney);
        result.current.completeJourney();
      });

      // Wait for effect to run
      await waitFor(() => {
        expect(result.current.isJourneyCompleted('test-journey')).toBe(true);
      });
    });
  });
});
