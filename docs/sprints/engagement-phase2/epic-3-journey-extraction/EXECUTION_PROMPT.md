# Execution Prompt — Epic 3: Journey State Extraction

## Context

Epic 2 established `useLensState` hook with URL/localStorage hydration. Epic 3 extracts journey state management into a `useJourneyState` hook that syncs with the machine's journey states.

**Critical:** Hook runs **parallel** to NarrativeEngineContext. Do NOT modify any existing context consumers. The hook is isolated for testing.

## Documentation

Sprint documentation in `docs/sprints/engagement-phase2/epic-3-journey-extraction/`:
- `REPO_AUDIT.md` — Analysis of journey state in NarrativeEngineContext
- `SPEC.md` — Hook specification and API design
- `ARCHITECTURE.md` — State flow, machine sync patterns
- `MIGRATION_MAP.md` — File-by-file changes
- `DECISIONS.md` — ADRs for patterns chosen (047-053)
- `SPRINTS.md` — Task breakdown with full code samples

## Execution Order

### Phase 1: Journey Persistence (20 min)

Update `src/core/engagement/persistence.ts`:

**Update STORAGE_KEYS:**
```typescript
export const STORAGE_KEYS = {
  lens: 'grove-lens',
  completedJourneys: 'grove-completed-journeys',
  journeyProgress: 'grove-journey-progress',
} as const;
```

**Add functions:**
```typescript
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

**Verify:** `npx tsc --noEmit`

### Phase 2: Persistence Tests (15 min)

Add to `tests/unit/persistence.test.ts`:

```typescript
describe('journey completion persistence', () => {
  // Tests from SPRINTS.md Task 2
});
```

**Run:**
```bash
npx vitest run tests/unit/persistence.test.ts
```
Expected: ~13 tests (7 lens + 6 journey)

### Phase 3: Create Hook (30 min)

Create `src/core/engagement/hooks/useJourneyState.ts`:

```typescript
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
  // Full implementation in SPRINTS.md Task 3
}
```

Update `src/core/engagement/hooks/index.ts`:

```typescript
export { useLensState } from './useLensState';
export type { UseLensStateOptions, UseLensStateReturn } from './useLensState';

export { useJourneyState } from './useJourneyState';
export type { UseJourneyStateOptions, UseJourneyStateReturn } from './useJourneyState';
```

**Verify:** `npx tsc --noEmit`

### Phase 4: Hook Tests (30 min)

Create `tests/unit/use-journey-state.test.ts`:

```typescript
// Full test suite in SPRINTS.md Task 5
```

**Run:**
```bash
npx vitest run tests/unit/use-journey-state.test.ts
```
Expected: ~15 tests passing

### Phase 5: Update Exports (10 min)

Update `src/core/engagement/index.ts`:

**Persistence exports:**
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

**Hooks exports:**
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

### Phase 6: Health & E2E (15 min)

Update `data/infrastructure/health-config.json`:

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

Add E2E test to `tests/e2e/engagement-behaviors.spec.ts`:

```typescript
test('journey completion persists across page reload', async ({ page }) => {
  await page.goto('/?lens=engineer');
  
  // Simulate journey completion
  await page.evaluate(() => {
    localStorage.setItem('grove-completed-journeys', JSON.stringify(['test-journey-1']));
  });
  
  await page.reload();
  
  const storedValue = await page.evaluate(() => {
    return localStorage.getItem('grove-completed-journeys');
  });
  
  expect(storedValue).toBe(JSON.stringify(['test-journey-1']));
});
```

---

## Test Verification

### Unit Tests
```bash
npx vitest run tests/unit/persistence.test.ts    # ~13 tests
npx vitest run tests/unit/use-journey-state.test.ts  # ~15 tests
npm test  # All tests pass
```
Expected: ~22 new tests total

### E2E Tests
```bash
npx playwright test
```
Expected: No regressions + new journey test

### Health Check
```bash
npm run health
```
Expected: All checks pass including journey-completion-persists

---

## Success Criteria

- [ ] `persistence.ts` has journey functions (4 new)
- [ ] `hooks/useJourneyState.ts` created
- [ ] `hooks/index.ts` exports useJourneyState
- [ ] `index.ts` exports all new modules
- [ ] Journey persistence tests pass (~6)
- [ ] Hook tests pass (~15)
- [ ] E2E test passes
- [ ] Health check passes

---

## Forbidden Actions

- Do NOT modify `hooks/NarrativeEngineContext.tsx`
- Do NOT modify `src/core/engagement/machine.ts`
- Do NOT connect hook to React components (Epic 5)
- Do NOT modify existing E2E tests
- Do NOT add new UI components

---

## Type Checking Notes

If type errors occur with Journey/JourneyStep:

1. Check `src/core/engagement/types.ts` for existing types
2. If missing, verify Epic 1 machine context types include Journey
3. Import from correct location

```typescript
// Expected in types.ts (from Epic 1)
export interface Journey {
  id: string;
  name: string;
  hubId: string;
  steps: JourneyStep[];
}

export interface JourneyStep {
  id: string;
  title: string;
  content: string;
}
```

---

## Troubleshooting

### Type 'EngagementMachine' not exported
```bash
# Check machine.ts exports the type
grep "export type.*EngagementMachine" src/core/engagement/machine.ts
```

### snapshot.matches is not a function
```bash
# Ensure using correct XState v5 API
# snapshot.matches('session.journeyActive')
```

### Journey tests fail with "Cannot read property 'steps' of null"
```bash
# Ensure lens is selected before starting journey
# Machine requires lensActive state before journeyActive
actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
```

---

## Commit Message

```
feat(engagement): add useJourneyState hook for journey management

- Extend persistence.ts with journey completion tracking
  - getCompletedJourneys(), markJourneyCompleted()
  - isJourneyCompleted(), clearCompletedJourneys()
- Create useJourneyState hook with:
  - Machine state derivation (journey, progress, isActive, isComplete)
  - Computed values (currentStep, progressPercent)
  - Actions (startJourney, advanceStep, completeJourney, exitJourney)
  - Completion tracking with localStorage persistence
- Add comprehensive unit tests (~21 tests)
- Add E2E test for completion persistence
- Add health check for journey completion

Hook runs parallel to NarrativeEngineContext.
No consumers modified - isolated for testing.
```
