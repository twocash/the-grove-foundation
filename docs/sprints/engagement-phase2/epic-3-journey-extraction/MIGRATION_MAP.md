# Migration Map — Epic 3: Journey State Extraction

## Overview

Epic 3 creates `useJourneyState` hook and extends persistence utilities. Minimal modifications to existing files—primarily new files and exports.

## Files to Create

### `src/core/engagement/hooks/useJourneyState.ts`

**Purpose:** Journey state hook with machine sync
**Depends on:** `machine.ts`, `types.ts`, `persistence.ts`

```typescript
import { useCallback, useMemo, useSyncExternalStore, useEffect } from 'react';
import type { Actor } from 'xstate';
import type { EngagementMachine } from '../machine';
import type { Journey, JourneyStep } from '../types';
import { getCompletedJourneys, markJourneyCompleted, isJourneyCompleted } from '../persistence';

export interface UseJourneyStateOptions {
  actor: Actor<EngagementMachine>;
}

export interface UseJourneyStateReturn {
  journey: Journey | null;
  journeyProgress: number;
  journeyTotal: number;
  isActive: boolean;
  isComplete: boolean;
  currentStep: JourneyStep | null;
  progressPercent: number;
  startJourney: (journey: Journey) => void;
  advanceStep: () => void;
  completeJourney: () => void;
  exitJourney: () => void;
  isJourneyCompleted: (journeyId: string) => boolean;
  completedJourneys: string[];
}

export function useJourneyState({ actor }: UseJourneyStateOptions): UseJourneyStateReturn {
  // Implementation in ARCHITECTURE.md
}
```

**Tests:** `tests/unit/use-journey-state.test.ts`
**Commit:** `feat(engagement): add useJourneyState hook`

---

### `tests/unit/use-journey-state.test.ts`

**Purpose:** Comprehensive hook unit tests
**Depends on:** `useJourneyState.ts`, `machine.ts`

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createActor } from 'xstate';
import { engagementMachine } from '../../src/core/engagement';
import { useJourneyState } from '../../src/core/engagement/hooks/useJourneyState';

describe('useJourneyState', () => {
  // ~15 tests covering state, computed, actions, completion
});
```

**Commit:** `test(engagement): add useJourneyState tests`

---

## Files to Modify

### `src/core/engagement/persistence.ts`

**Lines:** After existing functions
**Change Type:** Add journey persistence functions

**Add:**
```typescript
// Update STORAGE_KEYS
export const STORAGE_KEYS = {
  lens: 'grove-lens',
  completedJourneys: 'grove-completed-journeys',
  journeyProgress: 'grove-journey-progress',
} as const;

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

**Reason:** Journey completion persistence
**Tests:** Add to `tests/unit/persistence.test.ts`
**Commit:** `feat(engagement): add journey persistence utilities`

---

### `src/core/engagement/hooks/index.ts`

**Lines:** Export section
**Change Type:** Add export

**Before:**
```typescript
export { useLensState } from './useLensState';
export type { UseLensStateOptions, UseLensStateReturn } from './useLensState';
```

**After:**
```typescript
export { useLensState } from './useLensState';
export type { UseLensStateOptions, UseLensStateReturn } from './useLensState';

export { useJourneyState } from './useJourneyState';
export type { UseJourneyStateOptions, UseJourneyStateReturn } from './useJourneyState';
```

**Reason:** Expose new hook
**Commit:** (Same as useJourneyState)

---

### `src/core/engagement/index.ts`

**Lines:** Persistence exports section
**Change Type:** Add exports

**Add to persistence exports:**
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

**Add to hooks exports:**
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

**Reason:** Expose all new exports
**Commit:** `feat(engagement): export journey utilities and hook`

---

### `tests/unit/persistence.test.ts`

**Lines:** After lens tests
**Change Type:** Add journey persistence tests

**Add:**
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
  });

  describe('markJourneyCompleted', () => {
    test('adds journey ID to completed list', () => {
      markJourneyCompleted('journey-1');
      expect(getCompletedJourneys()).toContain('journey-1');
    });

    test('prevents duplicate entries', () => {
      markJourneyCompleted('journey-1');
      markJourneyCompleted('journey-1');
      expect(getCompletedJourneys().filter(j => j === 'journey-1')).toHaveLength(1);
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

**Reason:** Test journey persistence
**Commit:** `test(engagement): add journey persistence tests`

---

### `data/infrastructure/health-config.json`

**Lines:** engagementChecks array
**Change Type:** Add health check

**Add:**
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

**Reason:** Health tracks journey completion
**Commit:** `feat(health): add journey completion check`

---

### `tests/e2e/engagement-behaviors.spec.ts`

**Lines:** After lens persistence test
**Change Type:** Add E2E test

**Add:**
```typescript
test('journey completion persists across page reload', async ({ page }) => {
  // Navigate to terminal
  await page.goto('/?lens=engineer');
  await page.click('[data-testid="terminal-toggle"]');
  
  // Start a journey (if available)
  const journeyButton = page.locator('[data-testid="journey-start"]').first();
  if (await journeyButton.isVisible()) {
    await journeyButton.click();
    
    // Complete journey steps
    while (await page.locator('[data-testid="journey-next"]').isVisible()) {
      await page.click('[data-testid="journey-next"]');
    }
    
    // Complete journey
    await page.click('[data-testid="journey-complete"]');
    
    // Reload page
    await page.reload();
    
    // Verify completion persisted
    const completedBadge = page.locator('[data-testid="journey-completed-badge"]');
    await expect(completedBadge).toBeVisible();
  }
});
```

**Reason:** E2E verification of completion persistence
**Commit:** `test(e2e): add journey completion persistence test`

---

## Files NOT to Modify

| File | Reason |
|------|--------|
| `hooks/NarrativeEngineContext.tsx` | Consumer migration in Epic 6 |
| `src/core/engagement/machine.ts` | Machine already has journey states |
| `src/core/engagement/types.ts` | Journey types already defined |
| React components | Consumer migration in Epic 6 |

---

## Execution Order

### Phase 1: Persistence Extensions (20 min)

1. Update `src/core/engagement/persistence.ts` with journey functions
2. Add journey tests to `tests/unit/persistence.test.ts`
3. Verify: `npx vitest run tests/unit/persistence.test.ts`

### Phase 2: Hook Implementation (30 min)

1. Create `src/core/engagement/hooks/useJourneyState.ts`
2. Update `src/core/engagement/hooks/index.ts`
3. Verify: `npx tsc --noEmit`

### Phase 3: Hook Tests (30 min)

1. Create `tests/unit/use-journey-state.test.ts`
2. Verify: `npx vitest run tests/unit/use-journey-state.test.ts`

### Phase 4: Export Updates (10 min)

1. Update `src/core/engagement/index.ts`
2. Verify exports work

### Phase 5: E2E & Health (15 min)

1. Add E2E test to `tests/e2e/engagement-behaviors.spec.ts`
2. Update `data/infrastructure/health-config.json`
3. Verify: `npx playwright test` and `npm run health`

---

## Build Gates

### After Phase 1 (Persistence)
```bash
npx vitest run tests/unit/persistence.test.ts
# Should have ~12 tests (6 lens + 6 journey)
```

### After Phase 3 (Hook Tests)
```bash
npx vitest run tests/unit/use-journey-state.test.ts
npm test  # All tests pass
```

### After Phase 5 (Complete)
```bash
npm run build
npm test
npx playwright test
npm run health
```

---

## Rollback Plan

### If hook causes issues:
```bash
# Remove new file
rm src/core/engagement/hooks/useJourneyState.ts
rm tests/unit/use-journey-state.test.ts

# Revert hooks/index.ts
git checkout src/core/engagement/hooks/index.ts

# Revert persistence.ts (journey functions only)
git checkout src/core/engagement/persistence.ts

# Revert index.ts
git checkout src/core/engagement/index.ts
```

Hook is isolated—no consumers depend on it yet.

---

## Verification Checklist

- [ ] `persistence.ts` has journey functions
- [ ] `hooks/useJourneyState.ts` created
- [ ] `hooks/index.ts` exports useJourneyState
- [ ] `index.ts` exports all new modules
- [ ] Journey persistence tests pass (~6 tests)
- [ ] Hook tests pass (~15 tests)
- [ ] E2E test added and passes
- [ ] Health check added and passes
- [ ] All unit tests pass
- [ ] All E2E tests pass (no regressions)
