# Architecture — Epic 2: Lens State Extraction

## Overview

The `useLensState` hook extracts lens state management into a reusable adapter that syncs with the XState engagement machine. It handles URL hydration, localStorage persistence, and bidirectional state synchronization.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Epic 2 Architecture                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   External Sources              useLensState                Machine         │
│   ────────────────              ────────────                ───────         │
│                                                                             │
│   ┌─────────────┐              ┌──────────────────────┐                    │
│   │ URL Params  │──────────────►                      │                    │
│   │ ?lens=X     │              │   Hydration Layer    │                    │
│   └─────────────┘              │   ─────────────────  │                    │
│                                │   1. Check URL       │                    │
│   ┌─────────────┐              │   2. Check storage   │                    │
│   │localStorage │◄────────────►│   3. Set hydrated    │                    │
│   │ grove-lens  │              │                      │                    │
│   └─────────────┘              └──────────┬───────────┘                    │
│                                           │                                 │
│                                           ▼                                 │
│                                ┌──────────────────────┐                    │
│                                │   Machine Sync       │                    │
│                                │   ──────────────     │                    │
│                                │   send(SELECT_LENS)  │───────────────┐    │
│                                │   subscribe(state)   │◄──────────────┤    │
│                                └──────────────────────┘               │    │
│                                                                       │    │
│                                                                       ▼    │
│                                                          ┌────────────────┐│
│                                                          │ engagement     ││
│                                                          │ Machine        ││
│                                                          │                ││
│                                                          │ context.lens   ││
│                                                          │ context.source ││
│                                                          └────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Hook Implementation

### useLensState.ts

```typescript
// src/core/engagement/hooks/useLensState.ts

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { Actor } from 'xstate';
import { EngagementMachine } from '../machine';
import { getLens, setLens as persistLens } from '../persistence';
import { VALID_LENSES } from '../config';

interface UseLensStateOptions {
  actor: Actor<EngagementMachine>;
}

interface UseLensStateReturn {
  lens: string | null;
  lensSource: 'url' | 'localStorage' | 'selection' | null;
  selectLens: (lens: string) => void;
  isHydrated: boolean;
}

export function useLensState({ actor }: UseLensStateOptions): UseLensStateReturn {
  const [isHydrated, setIsHydrated] = useState(false);

  // Subscribe to machine state
  const snapshot = useSyncExternalStore(
    (callback) => actor.subscribe(callback).unsubscribe,
    () => actor.getSnapshot(),
    () => actor.getSnapshot()
  );

  const lens = snapshot.context.lens;
  const lensSource = snapshot.context.lensSource;

  // Hydration effect - runs once on mount
  useEffect(() => {
    if (isHydrated) return;

    // Priority 1: URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLens = urlParams.get('lens');
    if (urlLens && VALID_LENSES.includes(urlLens)) {
      actor.send({ type: 'SELECT_LENS', lens: urlLens, source: 'url' });
      setIsHydrated(true);
      return;
    }

    // Priority 2: localStorage
    const storedLens = getLens();
    if (storedLens && VALID_LENSES.includes(storedLens)) {
      actor.send({ type: 'SELECT_LENS', lens: storedLens, source: 'localStorage' });
      setIsHydrated(true);
      return;
    }

    // No lens found
    setIsHydrated(true);
  }, [actor, isHydrated]);

  // Persistence effect - persist user selections
  useEffect(() => {
    if (lens && lensSource === 'selection') {
      persistLens(lens);
    }
  }, [lens, lensSource]);

  // Select lens action
  const selectLens = useCallback((newLens: string) => {
    if (!VALID_LENSES.includes(newLens)) {
      console.warn(`Invalid lens: ${newLens}`);
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

## Persistence Layer

### persistence.ts

```typescript
// src/core/engagement/persistence.ts

const STORAGE_KEYS = {
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
    // Ignore
  }
}

export { STORAGE_KEYS };
```

## Configuration

### config.ts

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

## File Organization

```
src/core/engagement/
├── index.ts              # Updated: export hook
├── machine.ts            # Unchanged
├── types.ts              # Unchanged
├── actions.ts            # Unchanged
├── guards.ts             # Unchanged
├── config.ts             # NEW: Valid lenses
├── persistence.ts        # NEW: localStorage utilities
└── hooks/
    ├── index.ts          # NEW: Hook barrel export
    └── useLensState.ts   # NEW: Lens state hook

tests/unit/
├── engagement-machine.test.ts    # Existing
├── use-lens-state.test.ts        # NEW
└── persistence.test.ts           # NEW
```

## State Flow

### Hydration Sequence

```
1. Component mounts with useLensState({ actor })
   │
2. Hook checks isHydrated (false initially)
   │
3. Check URL: ?lens=engineer
   │
   ├── Found + Valid ────► send(SELECT_LENS, { lens, source: 'url' })
   │                       setIsHydrated(true)
   │                       return
   │
   └── Not found ────────► Continue
   │
4. Check localStorage: grove-lens
   │
   ├── Found + Valid ────► send(SELECT_LENS, { lens, source: 'localStorage' })
   │                       setIsHydrated(true)
   │                       return
   │
   └── Not found ────────► setIsHydrated(true)
   │
5. Hook returns { lens: null, isHydrated: true }
```

### Selection Sequence

```
1. User clicks lens option
   │
2. Component calls selectLens('academic')
   │
3. Hook validates lens
   │
   ├── Invalid ─────► console.warn, return
   │
   └── Valid ───────► actor.send({ type: 'SELECT_LENS', lens: 'academic', source: 'selection' })
   │
4. Machine transitions: anonymous → lensActive
   │
5. Machine updates context: { lens: 'academic', lensSource: 'selection' }
   │
6. useSyncExternalStore triggers re-render
   │
7. Persistence effect runs: localStorage.setItem('grove-lens', 'academic')
   │
8. Component re-renders with new lens
```

## Integration Points

### With Existing System (Epic 2)

Hook runs parallel—no integration with NarrativeEngineContext yet.

```typescript
// Isolated usage for testing
import { createActor } from 'xstate';
import { engagementMachine, useLensState } from '@/core/engagement';

function TestComponent() {
  const [actor] = useState(() => createActor(engagementMachine).start());
  const { lens, selectLens, isHydrated } = useLensState({ actor });
  // ...
}
```

### Future Integration (Epic 5-6)

```typescript
// EngagementProvider will create and manage the actor
function EngagementProvider({ children }) {
  const actor = useActorRef(engagementMachine);
  
  return (
    <EngagementContext.Provider value={{ actor }}>
      {children}
    </EngagementContext.Provider>
  );
}

// Consumers use the shared actor
function LensPicker() {
  const { actor } = useEngagement();
  const { lens, selectLens } = useLensState({ actor });
  // ...
}
```

## Test Strategy

### Unit Tests (Vitest + React Testing Library)

```typescript
// tests/unit/use-lens-state.test.ts

describe('useLensState', () => {
  describe('initialization', () => {
    test('starts with isHydrated false');
    test('returns null lens before hydration');
  });

  describe('URL hydration', () => {
    test('reads lens from URL parameter');
    test('sends SELECT_LENS with source url');
    test('ignores invalid URL lens');
  });

  describe('localStorage hydration', () => {
    test('reads lens from localStorage when no URL param');
    test('sends SELECT_LENS with source localStorage');
    test('clears invalid stored lens');
  });

  describe('lens selection', () => {
    test('selectLens sends event to machine');
    test('selectLens rejects invalid lens');
    test('persists selection to localStorage');
  });

  describe('machine sync', () => {
    test('updates when machine context changes');
    test('reflects lensSource from machine');
  });
});
```

### Persistence Tests

```typescript
// tests/unit/persistence.test.ts

describe('persistence', () => {
  test('getLens returns stored value');
  test('getLens returns null when empty');
  test('setLens persists to localStorage');
  test('clearLens removes from localStorage');
  test('handles localStorage errors gracefully');
  test('returns null in SSR environment');
});
```

## Performance Considerations

- `useSyncExternalStore` for efficient subscription
- Hydration runs once via `isHydrated` flag
- Persistence debounced by React's batching
- No unnecessary re-renders from unchanged state

## Error Handling

| Error | Handling |
|-------|----------|
| Invalid lens in URL | Log warning, skip |
| Invalid lens in storage | Clear storage, continue |
| localStorage unavailable | Graceful fallback |
| Actor not provided | Runtime error |
| Invalid selectLens arg | Log warning, no-op |
