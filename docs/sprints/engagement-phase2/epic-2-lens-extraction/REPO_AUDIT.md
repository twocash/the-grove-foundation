# Repository Audit — Epic 2: Lens State Extraction

## Audit Date: 2024-12-23

## Current State Summary

Epic 1 established the XState engagement machine with parallel states. Epic 2 extracts lens state management from NarrativeEngineContext into a focused `useLensState` hook that syncs with the machine.

## Epic 1 Completion Status

| Component | Status | Verification |
|-----------|--------|--------------|
| XState v5.25.0 | ✅ Installed | `npm ls xstate` |
| engagementMachine | ✅ Created | 24 unit tests passing |
| Parallel states | ✅ Working | session + terminal |
| Health check | ✅ Added | engagement-machine-valid: pass |
| Total tests | ✅ 89 passing | Unit + E2E |

## Lens State in NarrativeEngineContext

### Current Implementation

**Location:** `hooks/NarrativeEngineContext.tsx`

```typescript
// State variables (estimated lines 45-60)
const [currentLens, setCurrentLens] = useState<string | null>(null);
const [lensSource, setLensSource] = useState<'url' | 'localStorage' | 'selection' | null>(null);

// URL parameter handling (estimated lines 80-120)
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLens = urlParams.get('lens');
  if (urlLens && isValidLens(urlLens)) {
    setCurrentLens(urlLens);
    setLensSource('url');
  }
}, []);

// localStorage hydration (estimated lines 125-145)
useEffect(() => {
  if (!currentLens) {
    const storedLens = localStorage.getItem('grove-lens');
    if (storedLens && isValidLens(storedLens)) {
      setCurrentLens(storedLens);
      setLensSource('localStorage');
    }
  }
}, []);

// Persistence (estimated lines 150-160)
useEffect(() => {
  if (currentLens && lensSource === 'selection') {
    localStorage.setItem('grove-lens', currentLens);
  }
}, [currentLens, lensSource]);

// Handler (estimated lines 200-215)
const selectLens = useCallback((lens: string) => {
  setCurrentLens(lens);
  setLensSource('selection');
}, []);
```

### Dependencies

| Component | Depends On |
|-----------|------------|
| URL lens | `window.location.search` |
| Stored lens | `localStorage` |
| Lens validation | Lens config/list |
| Terminal | `currentLens` for display |
| Journey | `currentLens` for filtering |

### Lens Sources Priority

```
1. URL parameter (?lens=engineer)     → Highest priority
2. localStorage (grove-lens)          → Session persistence
3. User selection                     → Manual choice
```

## Machine State Mapping

### Current Machine (from Epic 1)

```typescript
// src/core/engagement/machine.ts
context: {
  lens: string | null,
  lensSource: 'url' | 'localStorage' | 'selection' | null,
}

events: {
  SELECT_LENS: { lens: string, source: 'url' | 'localStorage' | 'selection' },
  CHANGE_LENS: { lens: string },
}

states: {
  session: {
    anonymous: { on: { SELECT_LENS: 'lensActive' } },
    lensActive: { on: { CHANGE_LENS: { actions: 'setLens' } } },
  }
}
```

### Sync Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Lens Sync Architecture                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   URL/localStorage     useLensState          Machine                        │
│   ─────────────────    ────────────          ───────                        │
│                                                                             │
│   ?lens=engineer  ──►  hydrate() ──────►  send(SELECT_LENS)                 │
│                              │                    │                         │
│                              │                    ▼                         │
│                              │            context.lens = 'engineer'         │
│                              │                    │                         │
│                              ◄────────────────────┘                         │
│                        subscribe to machine                                 │
│                              │                                              │
│                              ▼                                              │
│   localStorage  ◄────  persist()                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## File Structure Analysis

### Files to Create

| File | Purpose |
|------|---------|
| `src/core/engagement/hooks/useLensState.ts` | Lens state hook |
| `src/core/engagement/hooks/index.ts` | Hook exports |
| `src/core/engagement/persistence.ts` | localStorage helpers |
| `tests/unit/use-lens-state.test.ts` | Hook unit tests |

### Files to Modify

| File | Change |
|------|--------|
| `src/core/engagement/index.ts` | Export new hook |
| `data/infrastructure/health-config.json` | Add lens check |

### Files NOT to Modify (Yet)

| File | Why |
|------|-----|
| `hooks/NarrativeEngineContext.tsx` | Consumer migration in Epic 6 |
| React components | Consumer migration in Epic 6 |

## Test Coverage Assessment

### Existing Tests

| Category | Tests | Status |
|----------|-------|--------|
| Machine unit tests | 24 | ✅ Passing |
| E2E lens selection | 3 | ✅ Passing |
| E2E URL hydration | 1 | ✅ Passing |

### Tests to Add

| Test | Purpose |
|------|---------|
| useLensState initialization | Hook starts correctly |
| URL lens hydration | URL param sets lens |
| localStorage hydration | Stored lens restored |
| Lens selection | User selection works |
| Persistence | Selection saved to localStorage |
| Machine sync | Hook syncs with machine |

## Valid Lenses

From existing codebase (needs verification):

```typescript
const VALID_LENSES = [
  'engineer',
  'academic', 
  'citizen',
  'investor',
  'policymaker'
];
```

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Hook/machine desync | Medium | High | Subscription pattern |
| SSR localStorage access | Low | Medium | Browser check |
| URL parsing edge cases | Low | Low | Robust parsing |
| Test mocking localStorage | Low | Low | Use vitest mocks |

## Recommendations

1. **Create persistence utilities first** — Centralize localStorage access
2. **Use machine subscription** — Hook subscribes to machine state
3. **Hydrate on mount** — Check URL, then localStorage, then default
4. **Persist on selection** — Only persist user selections, not URL/restored
5. **Export hook alongside machine** — Single import for consumers
