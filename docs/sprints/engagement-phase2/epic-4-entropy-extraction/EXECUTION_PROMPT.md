# Execution Prompt — Epic 4: Entropy State Extraction

## Context

Epic 3 established `useJourneyState` hook with journey lifecycle management. Epic 4 extracts entropy state management into a `useEntropyState` hook that syncs with the machine's entropy context.

**Critical:** Hook runs **parallel** to NarrativeEngineContext. Do NOT modify any existing context consumers. The hook is isolated for testing.

## Documentation

Sprint documentation in `docs/sprints/engagement-phase2/epic-4-entropy-extraction/`:
- `REPO_AUDIT.md` — Analysis of entropy state in NarrativeEngineContext
- `SPEC.md` — Hook specification and API design
- `ARCHITECTURE.md` — State flow, clamping, threshold detection
- `MIGRATION_MAP.md` — File-by-file changes
- `DECISIONS.md` — ADRs for patterns chosen (054-060)
- `SPRINTS.md` — Task breakdown with full code samples

## Execution Order

### Phase 1: Configuration (10 min)

Update `src/core/engagement/config.ts`:

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

**Verify:** `npx tsc --noEmit`

### Phase 2: Create Hook (25 min)

Create `src/core/engagement/hooks/useEntropyState.ts`:

```typescript
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Actor } from 'xstate';
import type { EngagementMachine } from '../machine';
import { ENTROPY_CONFIG } from '../config';

export interface UseEntropyStateOptions {
  actor: Actor<EngagementMachine>;
}

export interface UseEntropyStateReturn {
  entropy: number;
  entropyThreshold: number;
  isHighEntropy: boolean;
  entropyPercent: number;
  updateEntropy: (delta: number) => void;
  resetEntropy: () => void;
}

export function useEntropyState({ actor }: UseEntropyStateOptions): UseEntropyStateReturn {
  const snapshot = useSyncExternalStore(
    useCallback((callback) => {
      const subscription = actor.subscribe(callback);
      return () => subscription.unsubscribe();
    }, [actor]),
    () => actor.getSnapshot(),
    () => actor.getSnapshot()
  );

  const { entropy, entropyThreshold } = snapshot.context;

  const isHighEntropy = useMemo(() => {
    return entropy >= entropyThreshold;
  }, [entropy, entropyThreshold]);

  const entropyPercent = useMemo(() => {
    return Math.round(entropy * 100);
  }, [entropy]);

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

Update `src/core/engagement/hooks/index.ts`:

```typescript
export { useLensState } from './useLensState';
export type { UseLensStateOptions, UseLensStateReturn } from './useLensState';

export { useJourneyState } from './useJourneyState';
export type { UseJourneyStateOptions, UseJourneyStateReturn } from './useJourneyState';

export { useEntropyState } from './useEntropyState';
export type { UseEntropyStateOptions, UseEntropyStateReturn } from './useEntropyState';
```

**Verify:** `npx tsc --noEmit`

### Phase 3: Hook Tests (25 min)

Create `tests/unit/use-entropy-state.test.ts`:

```typescript
// Full test suite in SPRINTS.md Task 4
```

**Run:**
```bash
npx vitest run tests/unit/use-entropy-state.test.ts
```
Expected: ~12 tests passing

### Phase 4: Update Exports (10 min)

Update `src/core/engagement/index.ts`:

**Config exports:**
```typescript
export { 
  VALID_LENSES, 
  type ValidLens, 
  isValidLens,
  ENTROPY_CONFIG,
  type EntropyConfig,
} from './config';
```

**Hooks exports:**
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

### Phase 5: Health Integration (10 min)

Update `data/infrastructure/health-config.json`:

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

---

## Test Verification

### Unit Tests
```bash
npx vitest run tests/unit/use-entropy-state.test.ts  # ~12 tests
npm test  # All tests pass
```
Expected: ~12 new tests, ~144 total

### E2E Tests
```bash
npx playwright test
```
Expected: No regressions (17 tests)

### Health Check
```bash
npm run health
```
Expected: All checks pass including entropy-threshold-triggers

---

## Success Criteria

- [ ] `config.ts` has ENTROPY_CONFIG
- [ ] `hooks/useEntropyState.ts` created
- [ ] `hooks/index.ts` exports useEntropyState
- [ ] `index.ts` exports all new modules
- [ ] Hook tests pass (~12 tests)
- [ ] E2E tests pass (no regressions)
- [ ] Health check passes

---

## Forbidden Actions

- Do NOT modify `hooks/NarrativeEngineContext.tsx`
- Do NOT modify `src/core/engagement/machine.ts`
- Do NOT connect hook to React components (Epic 5)
- Do NOT modify existing E2E tests
- Do NOT add persistence for entropy

---

## Type Checking Notes

If type errors occur with entropy/entropyThreshold:

1. Check `src/core/engagement/types.ts` for context type
2. Verify machine context includes entropy fields
3. Import ENTROPY_CONFIG from correct location

```typescript
// Expected in machine context (from Epic 1)
interface EngagementContext {
  entropy: number;
  entropyThreshold: number;
  // ... other fields
}
```

---

## Troubleshooting

### entropy not in context
```bash
# Check machine types
grep "entropy" src/core/engagement/types.ts
```

### UPDATE_ENTROPY event not recognized
```bash
# Check machine events
grep "UPDATE_ENTROPY" src/core/engagement/machine.ts
```

### Clamping not working
```bash
# Verify ENTROPY_CONFIG values
# minValue: 0, maxValue: 1
```

---

## Commit Message

```
feat(engagement): add useEntropyState hook for entropy monitoring

- Add ENTROPY_CONFIG to config.ts
  - defaultThreshold: 0.7
  - minValue: 0, maxValue: 1
- Create useEntropyState hook with:
  - Machine state derivation (entropy, entropyThreshold)
  - Computed values (isHighEntropy, entropyPercent)
  - Actions (updateEntropy with clamping, resetEntropy)
- Add comprehensive unit tests (~12 tests)
- Add health check for entropy threshold detection

Hook runs parallel to NarrativeEngineContext.
No consumers modified - isolated for testing.
```
