# Execution Prompt — Epic 2: Lens State Extraction

## Context

Epic 1 established the XState engagement machine (24 tests, 14 health checks). Epic 2 extracts lens state management into a `useLensState` hook that syncs with the machine.

**Critical:** Hook runs **parallel** to NarrativeEngineContext. Do NOT modify any existing context consumers. The hook is isolated for testing.

## Documentation

Sprint documentation in `docs/sprints/engagement-phase2/epic-2-lens-extraction/`:
- `REPO_AUDIT.md` — Analysis of lens state in NarrativeEngineContext
- `SPEC.md` — Hook specification and acceptance criteria
- `ARCHITECTURE.md` — Hydration flow, machine sync patterns
- `MIGRATION_MAP.md` — File-by-file changes
- `DECISIONS.md` — ADRs for patterns chosen
- `SPRINTS.md` — Task breakdown with code samples

## Execution Order

### Phase 1: Install Dependencies (5 min)

```bash
npm install @xstate/react@^4.1.0
npm install -D @testing-library/react@^14.0.0
npm ls @xstate/react  # Verify: @xstate/react@4.x
```

### Phase 2: Create Config (10 min)

Create `src/core/engagement/config.ts`:

```typescript
export const VALID_LENSES = [
  'engineer',
  'academic',
  'citizen',
  'investor',
  'policymaker',
] as const;

export type ValidLens = typeof VALID_LENSES[number];

export function isValidLens(lens: string): lens is ValidLens {
  return VALID_LENSES.includes(lens as ValidLens);
}
```

**Verify:** `npx tsc --noEmit`

### Phase 3: Create Persistence (20 min)

Create `src/core/engagement/persistence.ts`:

```typescript
export const STORAGE_KEYS = {
  lens: 'grove-lens',
  journey: 'grove-journey-progress',
} as const;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getLens(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.lens);
  } catch {
    return null;
  }
}

export function setLens(lens: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.lens, lens);
  } catch {
    console.warn('Failed to persist lens to localStorage');
  }
}

export function clearLens(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.lens);
  } catch {}
}
```

### Phase 4: Create Persistence Tests (15 min)

Create `tests/unit/persistence.test.ts` with tests from SPRINTS.md.

**Run:**
```bash
npx vitest run tests/unit/persistence.test.ts
```
Expected: ~6 tests passing

### Phase 5: Create Hook Directory (5 min)

```bash
mkdir -p src/core/engagement/hooks
```

Create `src/core/engagement/hooks/index.ts`:

```typescript
export { useLensState } from './useLensState';
export type { UseLensStateOptions, UseLensStateReturn } from './useLensState';
```

### Phase 6: Create useLensState Hook (30 min)

Create `src/core/engagement/hooks/useLensState.ts`:

```typescript
import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import type { Actor } from 'xstate';
import type { EngagementMachine } from '../machine';
import { getLens, setLens as persistLens } from '../persistence';
import { VALID_LENSES, isValidLens } from '../config';

export interface UseLensStateOptions {
  actor: Actor<EngagementMachine>;
}

export interface UseLensStateReturn {
  lens: string | null;
  lensSource: 'url' | 'localStorage' | 'selection' | null;
  selectLens: (lens: string) => void;
  isHydrated: boolean;
}

export function useLensState({ actor }: UseLensStateOptions): UseLensStateReturn {
  const [isHydrated, setIsHydrated] = useState(false);

  const snapshot = useSyncExternalStore(
    useCallback((callback) => {
      const subscription = actor.subscribe(callback);
      return () => subscription.unsubscribe();
    }, [actor]),
    () => actor.getSnapshot(),
    () => actor.getSnapshot()
  );

  const lens = snapshot.context.lens;
  const lensSource = snapshot.context.lensSource;

  useEffect(() => {
    if (isHydrated) return;

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLens = urlParams.get('lens');
      if (urlLens && isValidLens(urlLens)) {
        actor.send({ type: 'SELECT_LENS', lens: urlLens, source: 'url' });
        setIsHydrated(true);
        return;
      }
    }

    const storedLens = getLens();
    if (storedLens && isValidLens(storedLens)) {
      actor.send({ type: 'SELECT_LENS', lens: storedLens, source: 'localStorage' });
      setIsHydrated(true);
      return;
    }

    setIsHydrated(true);
  }, [actor, isHydrated]);

  useEffect(() => {
    if (lens && lensSource === 'selection') {
      persistLens(lens);
    }
  }, [lens, lensSource]);

  const selectLens = useCallback((newLens: string) => {
    if (!isValidLens(newLens)) {
      console.warn(`Invalid lens: ${newLens}. Valid: ${VALID_LENSES.join(', ')}`);
      return;
    }
    actor.send({ type: 'SELECT_LENS', lens: newLens, source: 'selection' });
  }, [actor]);

  return { lens, lensSource, selectLens, isHydrated };
}
```

**Verify:** `npx tsc --noEmit`

### Phase 7: Create Hook Tests (30 min)

Create `tests/unit/use-lens-state.test.ts` with tests from SPRINTS.md.

**Run:**
```bash
npx vitest run tests/unit/use-lens-state.test.ts
```
Expected: ~12 tests passing

### Phase 8: Update Exports (10 min)

Update `src/core/engagement/index.ts`, add:

```typescript
// Config
export { VALID_LENSES, type ValidLens, isValidLens } from './config';

// Persistence
export { getLens, setLens, clearLens, STORAGE_KEYS } from './persistence';

// Hooks
export { useLensState, type UseLensStateOptions, type UseLensStateReturn } from './hooks';
```

**Verify:**
```bash
node -e "import('./src/core/engagement/index.js').then(m => console.log(Object.keys(m)))"
```

### Phase 9: Health Integration (10 min)

Update `data/infrastructure/health-config.json`, add to engagementChecks:

```json
{
  "id": "lens-persistence-works",
  "name": "Lens Persistence Works",
  "category": "engagement",
  "type": "e2e-behavior",
  "test": "engagement-behaviors.spec.ts:lens selection persists",
  "impact": "User lens preferences not saved",
  "inspect": "npx playwright test -g 'lens selection persists'"
}
```

**Verify:**
```bash
npm run health
```

---

## Test Verification

### Unit Tests
```bash
npx vitest run tests/unit/persistence.test.ts
npx vitest run tests/unit/use-lens-state.test.ts
npm test  # All tests pass
```
Expected: ~18 new tests, all passing

### E2E Tests
```bash
npx playwright test
```
Expected: No regressions

### Health Check
```bash
npm run health
```
Expected: All checks pass including new lens-persistence-works

---

## Success Criteria

- [ ] @xstate/react@4.x installed
- [ ] @testing-library/react installed
- [ ] `config.ts` created with VALID_LENSES
- [ ] `persistence.ts` created with getLens/setLens/clearLens
- [ ] `hooks/useLensState.ts` created
- [ ] `hooks/index.ts` exports hook
- [ ] `index.ts` exports all new modules
- [ ] Persistence tests pass (~6)
- [ ] Hook tests pass (~12)
- [ ] All unit tests pass
- [ ] E2E tests pass (no regressions)
- [ ] Health check passes

---

## Forbidden Actions

- Do NOT modify `hooks/NarrativeEngineContext.tsx`
- Do NOT connect hook to React components (Epic 5)
- Do NOT modify existing E2E tests
- Do NOT add new UI components
- Do NOT remove any existing code

---

## Troubleshooting

### @xstate/react type errors
```bash
# Ensure compatible versions
npm ls xstate @xstate/react
# Should be xstate@5.x with @xstate/react@4.x
```

### useSyncExternalStore not found
```bash
# Requires React 18+
npm ls react
```

### Hook tests fail with act warnings
```bash
# Ensure all state updates wrapped in act()
# Use waitFor for async updates
```

### localStorage tests fail
```bash
# Vitest should mock localStorage
# Check vitest.config.ts has jsdom environment
```

---

## Commit Message

```
feat(engagement): add useLensState hook for lens state management

- Add @xstate/react and @testing-library/react dependencies
- Create config.ts with VALID_LENSES constant
- Create persistence.ts with localStorage utilities
- Create useLensState hook with:
  - URL parameter hydration (priority 1)
  - localStorage hydration (priority 2)
  - Machine state sync via useSyncExternalStore
  - Persistence on user selection
- Add comprehensive unit tests (~18 tests)
- Add health check for lens persistence

Hook runs parallel to NarrativeEngineContext.
No consumers modified - isolated for testing.
```
