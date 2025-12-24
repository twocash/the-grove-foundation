# Sprint Stories — Epic 2: Lens State Extraction

## Overview

**Total Estimated Time:** ~2.5 hours
**Files Created:** 6
**Files Modified:** 3
**Tests Created:** ~18

---

## Task 1: Install Dependencies (5 min)

**Task:** Add React testing and XState React bindings
**Commands:**
```bash
npm install @xstate/react@^4.1.0
npm install -D @testing-library/react@^14.0.0
```
**Verification:**
```bash
npm ls @xstate/react
npm ls @testing-library/react
```
**Commit:** `chore: add @xstate/react and testing-library`

---

## Task 2: Create Lens Config (10 min)

**Task:** Define valid lenses in config file
**File:** Create `src/core/engagement/config.ts`

```typescript
// src/core/engagement/config.ts

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

**Verification:** `npx tsc --noEmit`
**Commit:** `feat(engagement): add lens config`

---

## Task 3: Create Persistence Utilities (20 min)

**Task:** localStorage helpers for lens storage
**File:** Create `src/core/engagement/persistence.ts`

```typescript
// src/core/engagement/persistence.ts

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
  } catch {
    // Ignore errors
  }
}
```

**Commit:** `feat(engagement): add persistence utilities`

---

## Task 4: Create Persistence Tests (15 min)

**Task:** Unit tests for persistence utilities
**File:** Create `tests/unit/persistence.test.ts`

```typescript
// tests/unit/persistence.test.ts

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { getLens, setLens, clearLens, STORAGE_KEYS } from '../../src/core/engagement/persistence';

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getLens', () => {
    test('returns null when no lens stored', () => {
      expect(getLens()).toBeNull();
    });

    test('returns stored lens value', () => {
      localStorage.setItem(STORAGE_KEYS.lens, 'engineer');
      expect(getLens()).toBe('engineer');
    });

    test('handles localStorage errors gracefully', () => {
      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(getLens()).toBeNull();
      mockGetItem.mockRestore();
    });
  });

  describe('setLens', () => {
    test('persists lens to localStorage', () => {
      setLens('academic');
      expect(localStorage.getItem(STORAGE_KEYS.lens)).toBe('academic');
    });

    test('handles localStorage errors gracefully', () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      expect(() => setLens('academic')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      mockSetItem.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('clearLens', () => {
    test('removes lens from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.lens, 'engineer');
      clearLens();
      expect(localStorage.getItem(STORAGE_KEYS.lens)).toBeNull();
    });

    test('handles missing key gracefully', () => {
      expect(() => clearLens()).not.toThrow();
    });
  });
});
```

**Verification:**
```bash
npx vitest run tests/unit/persistence.test.ts
```
**Commit:** `test(engagement): add persistence tests`

---

## Task 5: Create Hook Directory (5 min)

**Task:** Create hooks directory structure
**Commands:**
```bash
mkdir -p src/core/engagement/hooks
```
**File:** Create `src/core/engagement/hooks/index.ts`

```typescript
// src/core/engagement/hooks/index.ts

export { useLensState } from './useLensState';
export type { UseLensStateOptions, UseLensStateReturn } from './useLensState';
```

**Commit:** (Combined with Task 6)

---

## Task 6: Create useLensState Hook (30 min)

**Task:** Lens state hook with machine sync
**File:** Create `src/core/engagement/hooks/useLensState.ts`

```typescript
// src/core/engagement/hooks/useLensState.ts

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

  // Subscribe to machine state using useSyncExternalStore
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

  // Hydration effect - runs once on mount
  useEffect(() => {
    if (isHydrated) return;

    // Priority 1: URL parameter
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLens = urlParams.get('lens');
      if (urlLens && isValidLens(urlLens)) {
        actor.send({ type: 'SELECT_LENS', lens: urlLens, source: 'url' });
        setIsHydrated(true);
        return;
      }
    }

    // Priority 2: localStorage
    const storedLens = getLens();
    if (storedLens && isValidLens(storedLens)) {
      actor.send({ type: 'SELECT_LENS', lens: storedLens, source: 'localStorage' });
      setIsHydrated(true);
      return;
    }

    // No lens found
    setIsHydrated(true);
  }, [actor, isHydrated]);

  // Persistence effect - persist user selections only
  useEffect(() => {
    if (lens && lensSource === 'selection') {
      persistLens(lens);
    }
  }, [lens, lensSource]);

  // Select lens action
  const selectLens = useCallback((newLens: string) => {
    if (!isValidLens(newLens)) {
      console.warn(`Invalid lens: ${newLens}. Valid lenses: ${VALID_LENSES.join(', ')}`);
      return;
    }
    actor.send({ type: 'SELECT_LENS', lens: newLens, source: 'selection' });
  }, [actor]);

  return {
    lens,
    lensSource,
    selectLens,
    isHydrated,
  };
}
```

**Verification:** `npx tsc --noEmit`
**Commit:** `feat(engagement): add useLensState hook`

---

## Task 7: Create Hook Tests (30 min)

**Task:** Comprehensive hook unit tests
**File:** Create `tests/unit/use-lens-state.test.ts`

```typescript
// tests/unit/use-lens-state.test.ts

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createActor } from 'xstate';
import { engagementMachine } from '../../src/core/engagement';
import { useLensState } from '../../src/core/engagement/hooks/useLensState';
import { STORAGE_KEYS } from '../../src/core/engagement/persistence';

describe('useLensState', () => {
  let actor: ReturnType<typeof createActor<typeof engagementMachine>>;

  beforeEach(() => {
    localStorage.clear();
    // Reset URL
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    });
    actor = createActor(engagementMachine);
    actor.start();
  });

  afterEach(() => {
    actor.stop();
  });

  describe('initialization', () => {
    test('starts with isHydrated false then true', async () => {
      const { result } = renderHook(() => useLensState({ actor }));
      
      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });
    });

    test('returns null lens when no source', async () => {
      const { result } = renderHook(() => useLensState({ actor }));
      
      await waitFor(() => expect(result.current.isHydrated).toBe(true));
      
      expect(result.current.lens).toBeNull();
      expect(result.current.lensSource).toBeNull();
    });
  });

  describe('URL hydration', () => {
    test('reads lens from URL parameter', async () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?lens=engineer' },
        writable: true,
      });

      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => {
        expect(result.current.lens).toBe('engineer');
      });
      expect(result.current.lensSource).toBe('url');
    });

    test('ignores invalid URL lens', async () => {
      Object.defineProperty(window, 'location', {
        value: { search: '?lens=invalid' },
        writable: true,
      });

      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));
      
      expect(result.current.lens).toBeNull();
    });

    test('URL takes priority over localStorage', async () => {
      localStorage.setItem(STORAGE_KEYS.lens, 'citizen');
      Object.defineProperty(window, 'location', {
        value: { search: '?lens=engineer' },
        writable: true,
      });

      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => {
        expect(result.current.lens).toBe('engineer');
      });
      expect(result.current.lensSource).toBe('url');
    });
  });

  describe('localStorage hydration', () => {
    test('reads lens from localStorage when no URL param', async () => {
      localStorage.setItem(STORAGE_KEYS.lens, 'academic');

      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => {
        expect(result.current.lens).toBe('academic');
      });
      expect(result.current.lensSource).toBe('localStorage');
    });

    test('ignores invalid stored lens', async () => {
      localStorage.setItem(STORAGE_KEYS.lens, 'invalid');

      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));
      
      expect(result.current.lens).toBeNull();
    });
  });

  describe('lens selection', () => {
    test('selectLens updates machine state', async () => {
      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));

      act(() => {
        result.current.selectLens('investor');
      });

      expect(result.current.lens).toBe('investor');
      expect(result.current.lensSource).toBe('selection');
    });

    test('selectLens rejects invalid lens', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));

      act(() => {
        result.current.selectLens('invalid');
      });

      expect(result.current.lens).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('persists selection to localStorage', async () => {
      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));

      act(() => {
        result.current.selectLens('policymaker');
      });

      expect(localStorage.getItem(STORAGE_KEYS.lens)).toBe('policymaker');
    });
  });

  describe('machine sync', () => {
    test('updates when machine state changes externally', async () => {
      const { result } = renderHook(() => useLensState({ actor }));

      await waitFor(() => expect(result.current.isHydrated).toBe(true));

      act(() => {
        actor.send({ type: 'SELECT_LENS', lens: 'citizen', source: 'selection' });
      });

      expect(result.current.lens).toBe('citizen');
    });
  });
});
```

**Verification:**
```bash
npx vitest run tests/unit/use-lens-state.test.ts
```
**Commit:** `test(engagement): add useLensState tests`

---

## Task 8: Update Exports (10 min)

**Task:** Export new modules from index
**File:** Update `src/core/engagement/index.ts`

Add to existing exports:
```typescript
// Config
export { VALID_LENSES, type ValidLens, isValidLens } from './config';

// Persistence
export { getLens, setLens, clearLens, STORAGE_KEYS } from './persistence';

// Hooks
export { useLensState, type UseLensStateOptions, type UseLensStateReturn } from './hooks';
```

**Verification:**
```bash
node -e "import('./src/core/engagement/index.js').then(m => console.log(Object.keys(m)))"
```
**Commit:** `feat(engagement): export lens utilities and hook`

---

## Task 9: Health Integration (10 min)

**Task:** Add lens persistence health check
**File:** Update `data/infrastructure/health-config.json`

Add to engagementChecks:
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

**Verification:**
```bash
npm run health
```
**Commit:** `feat(health): add lens persistence check`

---

## Build Gates

### After Task 4 (Persistence Tests)
```bash
npx vitest run tests/unit/persistence.test.ts
```

### After Task 7 (Hook Tests)
```bash
npx vitest run tests/unit/use-lens-state.test.ts
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
1. chore: add @xstate/react and testing-library
2. feat(engagement): add lens config
3. feat(engagement): add persistence utilities
4. test(engagement): add persistence tests
5. feat(engagement): add useLensState hook
6. test(engagement): add useLensState tests
7. feat(engagement): export lens utilities and hook
8. feat(health): add lens persistence check
```

---

## Summary

| Task | Time | Files | Tests |
|------|------|-------|-------|
| Install deps | 5 min | package.json | - |
| Create config | 10 min | config.ts | - |
| Create persistence | 20 min | persistence.ts | - |
| Persistence tests | 15 min | persistence.test.ts | ~6 |
| Hook directory | 5 min | hooks/index.ts | - |
| Create hook | 30 min | useLensState.ts | - |
| Hook tests | 30 min | use-lens-state.test.ts | ~12 |
| Update exports | 10 min | index.ts | - |
| Health check | 10 min | health-config.json | - |
| **Total** | **~2.5 hours** | **6 created, 3 modified** | **~18 tests** |
