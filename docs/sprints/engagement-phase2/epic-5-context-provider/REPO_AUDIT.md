# Repository Audit — Epic 5: Context Provider

## Audit Date: 2024-12-24

## Current State Summary

Epics 2-4 established three independent hooks:
- `useLensState` — Lens selection with URL/localStorage hydration
- `useJourneyState` — Journey lifecycle with completion tracking
- `useEntropyState` — Entropy monitoring with threshold detection

All hooks require an `actor` prop. Epic 5 creates the provider layer that manages the actor and shares it via React Context.

## Epic 4 Completion Status

| Component | Status | Verification |
|-----------|--------|--------------|
| ENTROPY_CONFIG | ✅ Created | config.ts |
| useEntropyState | ✅ Created | 12 tests |
| Clamping logic | ✅ Working | Machine uses value |
| Total tests | ✅ 144 passing | +12 from Epic 4 |

## Current Hook Architecture

```
                    ┌─────────────────┐
                    │   Component     │
                    └────────┬────────┘
                             │ needs actor
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   useLensState      useJourneyState    useEntropyState
   ({ actor })       ({ actor })         ({ actor })
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ▼
                    ┌─────────────────┐
                    │  Machine Actor  │
                    └─────────────────┘
```

**Problem:** Every component must create/receive an actor.

## Target Architecture

```
                    ┌─────────────────┐
                    │EngagementProvider│
                    │  (creates actor) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │EngagementContext│
                    │  (shares actor) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  useEngagement  │
                    │ (accesses actor)│
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   useLensState      useJourneyState    useEntropyState
```

## File Structure Analysis

### Files to Create

| File | Purpose |
|------|---------|
| `src/core/engagement/context.tsx` | Context + Provider + hook |
| `tests/unit/engagement-context.test.tsx` | Provider + hook tests |

### Files to Modify

| File | Change |
|------|--------|
| `src/core/engagement/index.ts` | Export context, provider, useEngagement |

### Files NOT to Modify

| File | Why |
|------|-----|
| `hooks/NarrativeEngineContext.tsx` | Consumer migration in Epic 6 |
| Existing hooks | Already complete |
| React components | Consumer migration in Epic 6 |

## Context Design

### EngagementContext

```typescript
interface EngagementContextValue {
  actor: Actor<EngagementMachine>;
}

const EngagementContext = createContext<EngagementContextValue | null>(null);
```

### EngagementProvider

```typescript
interface EngagementProviderProps {
  children: React.ReactNode;
  initialLens?: string;  // Optional hydration
}

function EngagementProvider({ children, initialLens }: EngagementProviderProps) {
  const actor = useActorRef(engagementMachine);
  
  // Optional initial hydration
  useEffect(() => {
    if (initialLens) {
      actor.send({ type: 'SELECT_LENS', lens: initialLens, source: 'url' });
    }
  }, []);
  
  return (
    <EngagementContext.Provider value={{ actor }}>
      {children}
    </EngagementContext.Provider>
  );
}
```

### useEngagement

```typescript
function useEngagement(): EngagementContextValue {
  const context = useContext(EngagementContext);
  if (!context) {
    throw new Error('useEngagement must be used within EngagementProvider');
  }
  return context;
}
```

## Integration Pattern

### Before (Epic 2-4)

```typescript
// Each component creates or receives actor
function MyComponent({ actor }) {
  const lens = useLensState({ actor });
  const journey = useJourneyState({ actor });
  const entropy = useEntropyState({ actor });
}
```

### After (Epic 5+)

```typescript
// Provider at app root
<EngagementProvider>
  <App />
</EngagementProvider>

// Components access via context
function MyComponent() {
  const { actor } = useEngagement();
  const lens = useLensState({ actor });
  const journey = useJourneyState({ actor });
  const entropy = useEntropyState({ actor });
}
```

## Test Strategy

| Test | Purpose |
|------|---------|
| Provider renders children | Basic functionality |
| useEngagement returns actor | Context access works |
| useEngagement throws without provider | Error boundary |
| Hooks work via context | Integration test |
| Multiple consumers share actor | Single instance |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Context null in SSR | Low | Medium | SSR fallback |
| Actor not started | Low | High | useActorRef handles |
| Multiple providers | Low | Low | Last one wins |

## Recommendations

1. **Single file** — Context + Provider + hook in one file
2. **useActorRef** — XState React hook for actor lifecycle
3. **Strict null check** — Throw if used outside provider
4. **No initial hydration** — Let hooks handle their own hydration
5. **Keep it simple** — Just share actor, nothing else
