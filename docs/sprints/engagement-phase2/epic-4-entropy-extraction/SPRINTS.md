# Sprint Stories — Epic 4: Entropy State Extraction

## Overview

**Total Estimated Time:** ~1.5 hours
**Files Created:** 2
**Files Modified:** 4
**Tests Created:** ~12

---

## Task 1: Add Entropy Configuration (10 min)

**Task:** Add ENTROPY_CONFIG to config.ts
**File:** Modify `src/core/engagement/config.ts`

**Add after VALID_LENSES:**
```typescript
export const ENTROPY_CONFIG = {
  defaultThreshold: 0.7,
  minValue: 0,
  maxValue: 1,
  resetValue: 0,
} as const;

export type EntropyConfig = typeof ENTROPY_CONFIG;
```

**Verification:** `npx tsc --noEmit`
**Commit:** `feat(engagement): add entropy config`

---

## Task 2: Create useEntropyState Hook (25 min)

**Task:** Entropy state hook with machine sync
**File:** Create `src/core/engagement/hooks/useEntropyState.ts`

```typescript
// src/core/engagement/hooks/useEntropyState.ts

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Actor } from 'xstate';
import type { EngagementMachine } from '../machine';
import { ENTROPY_CONFIG } from '../config';

export interface UseEntropyStateOptions {
  actor: Actor<EngagementMachine>;
}

export interface UseEntropyStateReturn {
  // State from machine
  entropy: number;
  entropyThreshold: number;
  
  // Computed
  isHighEntropy: boolean;
  entropyPercent: number;
  
  // Actions
  updateEntropy: (delta: number) => void;
  resetEntropy: () => void;
}

export function useEntropyState({ actor }: UseEntropyStateOptions): UseEntropyStateReturn {
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
  const { entropy, entropyThreshold } = snapshot.context;

  // Computed values
  const isHighEntropy = useMemo(() => {
    return entropy >= entropyThreshold;
  }, [entropy, entropyThreshold]);

  const entropyPercent = useMemo(() => {
    return Math.round(entropy * 100);
  }, [entropy]);

  // Actions
  const updateEntropy = useCallback((delta: number) => {
    const currentEntropy = actor.getSnapshot().context.entropy;
    const clampedDelta = Math.max(
      ENTROPY_CONFIG.minValue - currentEntropy,
      Math.min(ENTROPY_CONFIG.maxValue - currentEntropy, delta)
    );
    
    if (clampedDelta !== 0) {
      actor.send({ type: 'UPDATE_ENTROPY', delta: clampedDelta });
    }
  }, [actor]);

  const resetEntropy = useCallback(() => {
    const currentEntropy = actor.getSnapshot().context.entropy;
    if (currentEntropy !== ENTROPY_CONFIG.resetValue) {
      actor.send({ type: 'UPDATE_ENTROPY', delta: -currentEntropy });
    }
  }, [actor]);

  return {
    entropy,
    entropyThreshold,
    isHighEntropy,
    entropyPercent,
    updateEntropy,
    resetEntropy,
  };
}
```

**Verification:** `npx tsc --noEmit`
**Commit:** `feat(engagement): add useEntropyState hook`

---

## Task 3: Update Hook Exports (5 min)

**Task:** Export useEntropyState from hooks index
**File:** Modify `src/core/engagement/hooks/index.ts`

```typescript
export { useLensState } from './useLensState';
export type { UseLensStateOptions, UseLensStateReturn } from './useLensState';

export { useJourneyState } from './useJourneyState';
export type { UseJourneyStateOptions, UseJourneyStateReturn } from './useJourneyState';

export { useEntropyState } from './useEntropyState';
export type { UseEntropyStateOptions, UseEntropyStateReturn } from './useEntropyState';
```

**Commit:** (Same as Task 2)

---

## Task 4: Create Hook Tests (25 min)

**Task:** Comprehensive hook unit tests
**File:** Create `tests/unit/use-entropy-state.test.ts`

```typescript
// tests/unit/use-entropy-state.test.ts

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createActor } from 'xstate';
import { engagementMachine, ENTROPY_CONFIG } from '../../src/core/engagement';
import { useEntropyState } from '../../src/core/engagement/hooks/useEntropyState';

describe('useEntropyState', () => {
  let actor: ReturnType<typeof createActor<typeof engagementMachine>>;

  beforeEach(() => {
    actor = createActor(engagementMachine);
    actor.start();
  });

  afterEach(() => {
    actor.stop();
  });

  describe('state derivation', () => {
    test('derives entropy from machine context', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      expect(result.current.entropy).toBe(0);
    });

    test('derives entropyThreshold from machine context', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      expect(result.current.entropyThreshold).toBe(ENTROPY_CONFIG.defaultThreshold);
    });
  });

  describe('computed values', () => {
    test('isHighEntropy false when entropy below threshold', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      expect(result.current.isHighEntropy).toBe(false);
    });

    test('isHighEntropy true when entropy at threshold', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      
      act(() => {
        result.current.updateEntropy(0.7);
      });
      
      expect(result.current.isHighEntropy).toBe(true);
    });

    test('isHighEntropy true when entropy above threshold', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      
      act(() => {
        result.current.updateEntropy(0.9);
      });
      
      expect(result.current.isHighEntropy).toBe(true);
    });

    test('entropyPercent calculates correctly', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      
      act(() => {
        result.current.updateEntropy(0.5);
      });
      
      expect(result.current.entropyPercent).toBe(50);
    });
  });

  describe('updateEntropy action', () => {
    test('increases entropy by delta', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      
      act(() => {
        result.current.updateEntropy(0.3);
      });
      
      expect(result.current.entropy).toBe(0.3);
    });

    test('decreases entropy by negative delta', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      
      act(() => {
        result.current.updateEntropy(0.5);
        result.current.updateEntropy(-0.2);
      });
      
      expect(result.current.entropy).toBeCloseTo(0.3);
    });

    test('clamps entropy at maxValue', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      
      act(() => {
        result.current.updateEntropy(1.5);
      });
      
      expect(result.current.entropy).toBe(ENTROPY_CONFIG.maxValue);
    });

    test('clamps entropy at minValue', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      
      act(() => {
        result.current.updateEntropy(-0.5);
      });
      
      expect(result.current.entropy).toBe(ENTROPY_CONFIG.minValue);
    });
  });

  describe('resetEntropy action', () => {
    test('resets entropy to 0', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      
      act(() => {
        result.current.updateEntropy(0.8);
      });
      
      expect(result.current.entropy).toBe(0.8);
      
      act(() => {
        result.current.resetEntropy();
      });
      
      expect(result.current.entropy).toBe(0);
    });

    test('no-op when already at 0', () => {
      const { result } = renderHook(() => useEntropyState({ actor }));
      
      expect(result.current.entropy).toBe(0);
      
      act(() => {
        result.current.resetEntropy();
      });
      
      expect(result.current.entropy).toBe(0);
    });
  });
});
```

**Verification:**
```bash
npx vitest run tests/unit/use-entropy-state.test.ts
```
Expected: ~12 tests passing
**Commit:** `test(engagement): add useEntropyState tests`

---

## Task 5: Update Main Exports (10 min)

**Task:** Export entropy utilities from main index
**File:** Modify `src/core/engagement/index.ts`

**Update config exports:**
```typescript
export { 
  VALID_LENSES, 
  type ValidLens, 
  isValidLens,
  ENTROPY_CONFIG,
  type EntropyConfig,
} from './config';
```

**Update hooks exports:**
```typescript
export { 
  useLensState, 
  useJourneyState,
  useEntropyState,
  type UseLensStateOptions, 
  type UseLensStateReturn,
  type UseJourneyStateOptions,
  type UseJourneyStateReturn,
  type UseEntropyStateOptions,
  type UseEntropyStateReturn,
} from './hooks';
```

**Verification:**
```bash
npx tsc --noEmit
```
**Commit:** `feat(engagement): export entropy utilities and hook`

---

## Task 6: Add Health Check (10 min)

**Task:** Add entropy threshold health check
**File:** Modify `data/infrastructure/health-config.json`

**Add to engagementChecks:**
```json
{
  "id": "entropy-threshold-triggers",
  "name": "Entropy Threshold Detection Works",
  "category": "engagement",
  "type": "unit-test",
  "test": "use-entropy-state.test.ts:isHighEntropy",
  "impact": "Journey offers not triggered when conversation becomes unfocused",
  "inspect": "npx vitest run tests/unit/use-entropy-state.test.ts"
}
```

**Verification:**
```bash
npm run health
```
**Commit:** `feat(health): add entropy threshold check`

---

## Build Gates

### After Task 1 (Config)
```bash
npx tsc --noEmit
```

### After Task 4 (Hook Tests)
```bash
npx vitest run tests/unit/use-entropy-state.test.ts
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
1. feat(engagement): add entropy config
2. feat(engagement): add useEntropyState hook
3. test(engagement): add useEntropyState tests
4. feat(engagement): export entropy utilities and hook
5. feat(health): add entropy threshold check
```

---

## Summary

| Task | Time | Files | Tests |
|------|------|-------|-------|
| Entropy config | 10 min | config.ts | - |
| Create hook | 25 min | useEntropyState.ts | - |
| Update exports | 5 min | hooks/index.ts | - |
| Hook tests | 25 min | use-entropy-state.test.ts | +12 |
| Main exports | 10 min | index.ts | - |
| Health check | 10 min | health-config.json | - |
| **Total** | **~1.5 hours** | **2 created, 4 modified** | **~12 tests** |
