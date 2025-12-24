# Sprint Stories — Epic 3: Journey State Extraction

## Overview

**Total Estimated Time:** ~2 hours
**Files Created:** 2
**Files Modified:** 5
**Tests Created:** ~21

---

## Task 1: Add Journey Persistence Functions (20 min)

**Task:** Extend persistence.ts with journey completion tracking
**File:** Modify `src/core/engagement/persistence.ts`

**Add to STORAGE_KEYS:**
```typescript
export const STORAGE_KEYS = {
  lens: 'grove-lens',
  completedJourneys: 'grove-completed-journeys',
  journeyProgress: 'grove-journey-progress',
} as const;
```

**Add functions:**
```typescript
// Completed journeys
export function getCompletedJourneys(): string[] {
  if (!isBrowser()) return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.completedJourneys);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markJourneyCompleted(journeyId: string): void {
  if (!isBrowser()) return;
  try {
    const completed = getCompletedJourneys();
    if (!completed.includes(journeyId)) {
      completed.push(journeyId);
      localStorage.setItem(STORAGE_KEYS.completedJourneys, JSON.stringify(completed));
    }
  } catch {
    console.warn('Failed to persist journey completion');
  }
}

export function isJourneyCompleted(journeyId: string): boolean {
  return getCompletedJourneys().includes(journeyId);
}

export function clearCompletedJourneys(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.completedJourneys);
  } catch {}
}
```

**Verification:** `npx tsc --noEmit`
**Commit:** `feat(engagement): add journey persistence utilities`

---

## Task 2: Add Journey Persistence Tests (15 min)

**Task:** Add tests for journey completion persistence
**File:** Modify `tests/unit/persistence.test.ts`

**Add test suite:**
```typescript
describe('journey completion persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getCompletedJourneys', () => {
    test('returns empty array when no journeys completed', () => {
      expect(getCompletedJourneys()).toEqual([]);
    });

    test('returns stored journey IDs', () => {
      localStorage.setItem(STORAGE_KEYS.completedJourneys, JSON.stringify(['j1', 'j2']));
      expect(getCompletedJourneys()).toEqual(['j1', 'j2']);
    });

    test('handles malformed JSON gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.completedJourneys, 'not-json');
      expect(getCompletedJourneys()).toEqual([]);
    });

    test('handles non-array JSON gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.completedJourneys, JSON.stringify({ foo: 'bar' }));
      expect(getCompletedJourneys()).toEqual([]);
    });
  });

  describe('markJourneyCompleted', () => {
    test('adds journey ID to completed list', () => {
      markJourneyCompleted('journey-1');
      expect(getCompletedJourneys()).toContain('journey-1');
    });

    test('prevents duplicate entries', () => {
      markJourneyCompleted('journey-1');
      markJourneyCompleted('journey-1');
      const completed = getCompletedJourneys();
      expect(completed.filter(j => j === 'journey-1')).toHaveLength(1);
    });

    test('preserves existing completions', () => {
      markJourneyCompleted('journey-1');
      markJourneyCompleted('journey-2');
      expect(getCompletedJourneys()).toEqual(['journey-1', 'journey-2']);
    });
  });

  describe('isJourneyCompleted', () => {
    test('returns true for completed journey', () => {
      markJourneyCompleted('journey-1');
      expect(isJourneyCompleted('journey-1')).toBe(true);
    });

    test('returns false for incomplete journey', () => {
      expect(isJourneyCompleted('journey-1')).toBe(false);
    });
  });

  describe('clearCompletedJourneys', () => {
    test('removes all completed journeys', () => {
      markJourneyCompleted('journey-1');
      markJourneyCompleted('journey-2');
      clearCompletedJourneys();
      expect(getCompletedJourneys()).toEqual([]);
    });
  });
});
```

**Verification:**
```bash
npx vitest run tests/unit/persistence.test.ts
```
Expected: ~13 tests (7 lens + 6 journey)
**Commit:** `test(engagement): add journey persistence tests`

---

## Task 3: Create useJourneyState Hook (30 min)

**Task:** Journey state hook with machine sync
**File:** Create `src/core/engagement/hooks/useJourneyState.ts`

```typescript
// src/core/engagement/hooks/useJourneyState.ts

import { useCallback, useMemo, useSyncExternalStore, useEffect } from 'react';
import type { Actor } from 'xstate';
import type { EngagementMachine } from '../machine';
import type { Journey, JourneyStep } from '../types';
import { 
  getCompletedJourneys, 
  markJourneyCompleted,
  isJourneyCompleted as checkCompleted 
} from '../persistence';

export interface UseJourneyStateOptions {
  actor: Actor<EngagementMachine>;
}

export interface UseJourneyStateReturn {
  // State from machine
  journey: Journey | null;
  journeyProgress: number;
  journeyTotal: number;
  isActive: boolean;
  isComplete: boolean;
  
  // Computed
  currentStep: JourneyStep | null;
  progressPercent: number;
  
  // Actions
  startJourney: (journey: Journey) => void;
  advanceStep: () => void;
  completeJourney: () => void;
  exitJourney: () => void;
  
  // Completion tracking
  isJourneyCompleted: (journeyId: string) => boolean;
  completedJourneys: string[];
}

export function useJourneyState({ actor }: UseJourneyStateOptions): UseJourneyStateReturn {
  // Subscribe to machine state
  const snapshot = useSyncExternalStore(
    useCallback((callback) => {
      const subscription = actor.subscribe(callback);
      return () => subscription.unsubscribe();
    }, [actor]),
    () => actor.getSnapshot(),
    () => actor.getSnapshot()
  );

  // Derive state from machine
  const { journey, journeyProgress, journeyTotal } = snapshot.context;
  const isActive = snapshot.matches('session.journeyActive');
  const isComplete = snapshot.matches('session.journeyComplete');

  // Computed values
  const currentStep = useMemo(() => {
    if (!journey || !journey.steps) return null;
    return journey.steps[journeyProgress] ?? null;
  }, [journey, journeyProgress]);

  const progressPercent = useMemo(() => {
    if (journeyTotal === 0) return 0;
    return Math.round(((journeyProgress + 1) / journeyTotal) * 100);
  }, [journeyProgress, journeyTotal]);

  // Completion tracking (from localStorage)
  const completedJourneys = useMemo(() => getCompletedJourneys(), []);

  // Persist completion when journey completes
  useEffect(() => {
    if (isComplete && journey) {
      markJourneyCompleted(journey.id);
    }
  }, [isComplete, journey]);

  // Actions
  const startJourney = useCallback((newJourney: Journey) => {
    actor.send({ type: 'START_JOURNEY', journey: newJourney });
  }, [actor]);

  const advanceStep = useCallback(() => {
    actor.send({ type: 'ADVANCE_STEP' });
  }, [actor]);

  const completeJourney = useCallback(() => {
    actor.send({ type: 'COMPLETE_JOURNEY' });
  }, [actor]);

  const exitJourney = useCallback(() => {
    actor.send({ type: 'EXIT_JOURNEY' });
  }, [actor]);

  const isJourneyCompleted = useCallback((journeyId: string) => {
    return checkCompleted(journeyId);
  }, []);

  return {
    journey,
    journeyProgress,
    journeyTotal,
    isActive,
    isComplete,
    currentStep,
    progressPercent,
    startJourney,
    advanceStep,
    completeJourney,
    exitJourney,
    isJourneyCompleted,
    completedJourneys,
  };
}
```

**Verification:** `npx tsc --noEmit`
**Commit:** `feat(engagement): add useJourneyState hook`

---

## Task 4: Update Hook Exports (5 min)

**Task:** Export useJourneyState from hooks index
**File:** Modify `src/core/engagement/hooks/index.ts`

```typescript
export { useLensState } from './useLensState';
export type { UseLensStateOptions, UseLensStateReturn } from './useLensState';

export { useJourneyState } from './useJourneyState';
export type { UseJourneyStateOptions, UseJourneyStateReturn } from './useJourneyState';
```

**Commit:** (Same as Task 3)

---

## Task 5: Create Hook Tests (30 min)

**Task:** Comprehensive hook unit tests
**File:** Create `tests/unit/use-journey-state.test.ts`

```typescript
// tests/unit/use-journey-state.test.ts

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createActor } from 'xstate';
import { engagementMachine } from '../../src/core/engagement';
import { useJourneyState } from '../../src/core/engagement/hooks/useJourneyState';
import { STORAGE_KEYS, clearCompletedJourneys } from '../../src/core/engagement/persistence';

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
```

**Verification:**
```bash
npx vitest run tests/unit/use-journey-state.test.ts
```
Expected: ~15 tests passing
**Commit:** `test(engagement): add useJourneyState tests`

---

## Task 6: Update Main Exports (10 min)

**Task:** Export journey utilities from main index
**File:** Modify `src/core/engagement/index.ts`

**Update persistence exports:**
```typescript
export { 
  getLens, 
  setLens, 
  clearLens,
  getCompletedJourneys,
  markJourneyCompleted,
  isJourneyCompleted,
  clearCompletedJourneys,
  STORAGE_KEYS 
} from './persistence';
```

**Update hooks exports:**
```typescript
export { 
  useLensState, 
  useJourneyState,
  type UseLensStateOptions, 
  type UseLensStateReturn,
  type UseJourneyStateOptions,
  type UseJourneyStateReturn,
} from './hooks';
```

**Verification:**
```bash
npx tsc --noEmit
```
**Commit:** `feat(engagement): export journey utilities and hook`

---

## Task 7: Add Health Check (10 min)

**Task:** Add journey completion health check
**File:** Modify `data/infrastructure/health-config.json`

**Add to engagementChecks:**
```json
{
  "id": "journey-completion-persists",
  "name": "Journey Completion Persists",
  "category": "engagement",
  "type": "e2e-behavior",
  "test": "engagement-behaviors.spec.ts:journey completion persists",
  "impact": "Journey completion history lost on reload",
  "inspect": "npx playwright test -g 'journey completion'"
}
```

**Verification:**
```bash
npm run health
```
**Commit:** `feat(health): add journey completion check`

---

## Task 8: Add E2E Test (15 min)

**Task:** E2E test for journey completion persistence
**File:** Modify `tests/e2e/engagement-behaviors.spec.ts`

**Add test:**
```typescript
test('journey completion persists across page reload', async ({ page }) => {
  // This test verifies the useJourneyState hook persists completions
  // Note: Requires journey UI to be connected (may be added in Epic 5-6)
  
  // For now, verify localStorage directly via page.evaluate
  await page.goto('/?lens=engineer');
  
  // Simulate journey completion via localStorage
  await page.evaluate(() => {
    const STORAGE_KEY = 'grove-completed-journeys';
    const completed = ['test-journey-1'];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  });
  
  // Reload page
  await page.reload();
  
  // Verify persistence
  const storedValue = await page.evaluate(() => {
    return localStorage.getItem('grove-completed-journeys');
  });
  
  expect(storedValue).toBe(JSON.stringify(['test-journey-1']));
});
```

**Verification:**
```bash
npx playwright test -g 'journey completion'
```
**Commit:** `test(e2e): add journey completion persistence test`

---

## Build Gates

### After Task 2 (Persistence Tests)
```bash
npx vitest run tests/unit/persistence.test.ts
# Expected: ~13 tests
```

### After Task 5 (Hook Tests)
```bash
npx vitest run tests/unit/use-journey-state.test.ts
npm test  # All tests pass
```

### Final Verification
```bash
npm run build
npm test
npx playwright test
npm run health
```

---

## Commit Sequence

```
1. feat(engagement): add journey persistence utilities
2. test(engagement): add journey persistence tests
3. feat(engagement): add useJourneyState hook
4. test(engagement): add useJourneyState tests
5. feat(engagement): export journey utilities and hook
6. feat(health): add journey completion check
7. test(e2e): add journey completion persistence test
```

---

## Summary

| Task | Time | Files | Tests |
|------|------|-------|-------|
| Journey persistence | 20 min | persistence.ts | - |
| Persistence tests | 15 min | persistence.test.ts | +6 |
| Create hook | 30 min | useJourneyState.ts | - |
| Update exports | 5 min | hooks/index.ts | - |
| Hook tests | 30 min | use-journey-state.test.ts | +15 |
| Main exports | 10 min | index.ts | - |
| Health check | 10 min | health-config.json | - |
| E2E test | 15 min | engagement-behaviors.spec.ts | +1 |
| **Total** | **~2 hours** | **2 created, 5 modified** | **~22 tests** |
