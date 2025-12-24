# Execution Prompt — Epic 5: Context Provider

## Context

Epic 4 established `useEntropyState` hook. Epic 5 creates the context layer that shares a single machine actor across the component tree, enabling all three hooks to work together without prop drilling.

**Critical:** Provider runs **parallel** to NarrativeEngineContext. Do NOT modify any existing context consumers. The provider is isolated for testing.

## Documentation

Sprint documentation in `docs/sprints/engagement-phase2/epic-5-context-provider/`:
- `REPO_AUDIT.md` — Analysis of current hook architecture
- `SPEC.md` — Provider and hook specification
- `ARCHITECTURE.md` — Context flow, lifecycle, usage patterns
- `MIGRATION_MAP.md` — File-by-file changes
- `DECISIONS.md` — ADRs for patterns chosen (061-066)
- `SPRINTS.md` — Task breakdown with full code samples

## Execution Order

### Phase 1: Create Context (25 min)

Create `src/core/engagement/context.tsx`:

```typescript
'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useActorRef } from '@xstate/react';
import type { Actor } from 'xstate';
import { engagementMachine, type EngagementMachine } from './machine';

export interface EngagementContextValue {
  actor: Actor<EngagementMachine>;
}

const EngagementContext = createContext<EngagementContextValue | null>(null);

export interface EngagementProviderProps {
  children: ReactNode;
}

export function EngagementProvider({ children }: EngagementProviderProps): JSX.Element {
  const actor = useActorRef(engagementMachine);

  return (
    <EngagementContext.Provider value={{ actor }}>
      {children}
    </EngagementContext.Provider>
  );
}

export function useEngagement(): EngagementContextValue {
  const context = useContext(EngagementContext);
  
  if (!context) {
    throw new Error(
      'useEngagement must be used within an EngagementProvider. ' +
      'Wrap your component tree with <EngagementProvider>.'
    );
  }
  
  return context;
}

export { EngagementContext };
```

**Verify:** `npx tsc --noEmit`

### Phase 2: Create Tests (20 min)

Create `tests/unit/engagement-context.test.tsx`:

```typescript
// Full test suite in SPRINTS.md Task 2
// ~8 tests covering:
// - Provider renders children
// - Provider provides actor
// - Actor is started
// - useEngagement returns value
// - useEngagement throws without provider
// - Multiple consumers share actor
// - Hooks work via context
```

**Run:**
```bash
npx vitest run tests/unit/engagement-context.test.tsx
```
Expected: ~8 tests passing

### Phase 3: Update Exports (10 min)

Update `src/core/engagement/index.ts`:

**Add context exports:**
```typescript
// Context exports
export { 
  EngagementProvider,
  useEngagement,
  EngagementContext,
  type EngagementContextValue,
  type EngagementProviderProps,
} from './context';
```

### Phase 4: Health Integration (10 min)

Update `data/infrastructure/health-config.json`:

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

---

## Test Verification

### Unit Tests
```bash
npx vitest run tests/unit/engagement-context.test.tsx  # ~8 tests
npm test  # All tests pass
```
Expected: ~8 new tests, ~152 total

### E2E Tests
```bash
npx playwright test
```
Expected: No regressions (17 tests)

### Health Check
```bash
npm run health
```
Expected: All checks pass

---

## Success Criteria

- [ ] `context.tsx` created with Provider and useEngagement
- [ ] `index.ts` exports all context components
- [ ] Provider tests pass (~3 tests)
- [ ] useEngagement tests pass (~2 tests)
- [ ] Integration tests pass (~3 tests)
- [ ] E2E tests pass (no regressions)
- [ ] Health check passes

---

## Forbidden Actions

- Do NOT modify `hooks/NarrativeEngineContext.tsx`
- Do NOT connect provider to application (Epic 6)
- Do NOT modify existing hooks
- Do NOT add initial state props to provider

---

## Type Checking Notes

If type errors occur with Actor:

1. Import Actor type from xstate (not @xstate/react)
2. Import EngagementMachine type from machine.ts
3. Verify useActorRef import from @xstate/react

```typescript
import { useActorRef } from '@xstate/react';
import type { Actor } from 'xstate';
import { engagementMachine, type EngagementMachine } from './machine';
```

---

## Troubleshooting

### useActorRef not found
```bash
# Check @xstate/react version
npm ls @xstate/react
# Should be v5.0.5+
```

### Actor type mismatch
```bash
# Check machine type export
grep "export type.*Machine" src/core/engagement/machine.ts
```

### Context null in tests
```bash
# Ensure wrapper in renderHook
renderHook(() => useEngagement(), { wrapper: EngagementProvider })
```

---

## Commit Message

```
feat(engagement): add EngagementProvider and useEngagement hook

- Create EngagementContext for actor sharing
- Create EngagementProvider with useActorRef
- Create useEngagement hook with null check
- Add comprehensive unit tests (~8 tests)
- Add health check for provider functionality

Provider runs parallel to NarrativeEngineContext.
No consumers modified - isolated for testing.
```
