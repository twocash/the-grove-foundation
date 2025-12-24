# Specification — Epic 5: Context Provider

## Overview

Create `EngagementProvider` and `useEngagement` hook to share a single machine actor across all engagement hooks. This enables components anywhere in the tree to access lens, journey, and entropy state without prop drilling.

## Goals

1. Create EngagementContext for actor sharing
2. Create EngagementProvider component
3. Create useEngagement hook for context access
4. Enable hook composition without actor prop drilling
5. Maintain type safety throughout

## Non-Goals

- Modifying NarrativeEngineContext (Epic 6)
- Replacing NarrativeEngineContext usage (Epic 6)
- Adding additional context values beyond actor
- Implementing SSR-specific behavior
- Adding provider-level state management

## Success Criteria

After this epic:
1. EngagementProvider wraps application
2. useEngagement returns actor from context
3. All three hooks work via context
4. Single actor instance shared across tree
5. Clear error when used outside provider

## Acceptance Criteria

### Functional Requirements

- [ ] AC-1: EngagementProvider creates actor with useActorRef
- [ ] AC-2: EngagementContext shares actor value
- [ ] AC-3: useEngagement returns context value
- [ ] AC-4: useEngagement throws descriptive error without provider
- [ ] AC-5: Provider renders children unchanged
- [ ] AC-6: Multiple hooks share same actor instance

### Test Requirements (MANDATORY)

- [ ] AC-T1: Provider renders children test
- [ ] AC-T2: useEngagement returns actor test
- [ ] AC-T3: useEngagement throws without provider test
- [ ] AC-T4: Multiple consumers share actor test
- [ ] AC-T5: Hooks integration test
- [ ] AC-T6: All tests pass: `npm test`
- [ ] AC-T7: E2E tests pass: `npx playwright test`

### DEX Compliance

- [ ] AC-D1: Context value is minimal (actor only)
- [ ] AC-D2: Provider has no business logic
- [ ] AC-D3: Types exported for consumers

## API Design

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
}

function EngagementProvider({ children }: EngagementProviderProps): JSX.Element;
```

### useEngagement

```typescript
function useEngagement(): EngagementContextValue;
// Throws if used outside EngagementProvider
```

### Usage Example

```typescript
// App root
import { EngagementProvider } from '@/core/engagement';

function App() {
  return (
    <EngagementProvider>
      <Terminal />
    </EngagementProvider>
  );
}

// Any component in tree
import { useEngagement, useLensState, useJourneyState, useEntropyState } from '@/core/engagement';

function Terminal() {
  const { actor } = useEngagement();
  
  const { lens, selectLens } = useLensState({ actor });
  const { journey, isActive, startJourney } = useJourneyState({ actor });
  const { isHighEntropy, resetEntropy } = useEntropyState({ actor });
  
  return (
    <div>
      <LensSelector lens={lens} onSelect={selectLens} />
      {isHighEntropy && <JourneyOffer onAccept={startJourney} />}
      {isActive && <JourneyPanel journey={journey} />}
    </div>
  );
}
```

## File Structure

```
src/core/engagement/
├── index.ts                    # Add exports
├── context.tsx                 # NEW: Context + Provider + hook
├── machine.ts                  # Unchanged
├── config.ts                   # Unchanged
├── persistence.ts              # Unchanged
├── types.ts                    # Unchanged
└── hooks/
    ├── index.ts                # Unchanged
    ├── useLensState.ts         # Unchanged
    ├── useJourneyState.ts      # Unchanged
    └── useEntropyState.ts      # Unchanged

tests/unit/
├── engagement-context.test.tsx # NEW
└── ...existing tests
```

## Health Check Addition

```json
{
  "id": "engagement-provider-works",
  "name": "Engagement Provider Works",
  "category": "engagement",
  "type": "unit-test",
  "test": "engagement-context.test.tsx:EngagementProvider",
  "impact": "Engagement context not available to components",
  "inspect": "npx vitest run tests/unit/engagement-context.test.tsx"
}
```

## Dependencies

Uses existing:
- `xstate` (v5.25.0)
- `@xstate/react` (v5.0.5) — provides `useActorRef`
- `react` (v19)

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Context null | Low | Medium | Strict null check + throw |
| Actor not started | Low | High | useActorRef auto-starts |
| Multiple renders | Low | Low | React handles |

## Out of Scope

- Consumer migration (Epic 6)
- Cleanup of NarrativeEngineContext (Epic 7)
- Provider-level state beyond actor
- SSR hydration
