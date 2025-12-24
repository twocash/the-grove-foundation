# Migration Map — Epic 5: Context Provider

## Overview

Epic 5 creates the context layer: `EngagementContext`, `EngagementProvider`, and `useEngagement`. Minimal changes—one new file plus exports.

## Files to Create

### `src/core/engagement/context.tsx`

**Purpose:** Context + Provider + useEngagement hook
**Depends on:** `machine.ts`, `@xstate/react`

```typescript
'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useActorRef, type Actor } from '@xstate/react';
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

**Tests:** `tests/unit/engagement-context.test.tsx`
**Commit:** `feat(engagement): add EngagementProvider and useEngagement`

---

### `tests/unit/engagement-context.test.tsx`

**Purpose:** Provider and hook unit tests
**Depends on:** `context.tsx`, `machine.ts`

```typescript
import { describe, test, expect } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import { 
  EngagementProvider, 
  useEngagement,
  EngagementContext 
} from '../../src/core/engagement/context';
import { useLensState } from '../../src/core/engagement/hooks/useLensState';

describe('EngagementProvider', () => {
  // Tests from SPRINTS.md
});

describe('useEngagement', () => {
  // Tests from SPRINTS.md
});

describe('integration', () => {
  // Tests from SPRINTS.md
});
```

**Commit:** `test(engagement): add context provider tests`

---

## Files to Modify

### `src/core/engagement/index.ts`

**Lines:** Export section
**Change Type:** Add context exports

**Add:**
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

**Reason:** Expose provider and hook
**Commit:** `feat(engagement): export context components`

---

### `data/infrastructure/health-config.json`

**Lines:** engagementChecks array
**Change Type:** Add health check

**Add:**
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

**Reason:** Health tracks provider functionality
**Commit:** `feat(health): add engagement provider check`

---

## Files NOT to Modify

| File | Reason |
|------|--------|
| `hooks/NarrativeEngineContext.tsx` | Consumer migration in Epic 6 |
| `src/core/engagement/hooks/*.ts` | Hooks already complete |
| React components | Consumer migration in Epic 6 |
| `machine.ts` | Machine complete |
| `config.ts` | Config complete |
| `persistence.ts` | Persistence complete |

---

## Execution Order

### Phase 1: Create Context (25 min)

1. Create `src/core/engagement/context.tsx`
2. Verify: `npx tsc --noEmit`

### Phase 2: Create Tests (20 min)

1. Create `tests/unit/engagement-context.test.tsx`
2. Verify: `npx vitest run tests/unit/engagement-context.test.tsx`

### Phase 3: Update Exports (10 min)

1. Update `src/core/engagement/index.ts`
2. Verify exports work

### Phase 4: Health Integration (10 min)

1. Update `data/infrastructure/health-config.json`
2. Verify: `npm run health`

---

## Build Gates

### After Phase 1 (Context)
```bash
npx tsc --noEmit
```

### After Phase 2 (Tests)
```bash
npx vitest run tests/unit/engagement-context.test.tsx
npm test  # All tests pass
```

### After Phase 4 (Complete)
```bash
npm run build
npm test
npx playwright test
npm run health
```

---

## Rollback Plan

### If context causes issues:
```bash
# Remove new file
rm src/core/engagement/context.tsx
rm tests/unit/engagement-context.test.tsx

# Revert index.ts
git checkout src/core/engagement/index.ts
```

Context is isolated—no consumers depend on it yet.

---

## Verification Checklist

- [ ] `context.tsx` created with Provider and hook
- [ ] `index.ts` exports all context components
- [ ] Provider tests pass (~3 tests)
- [ ] useEngagement tests pass (~2 tests)
- [ ] Integration tests pass (~3 tests)
- [ ] All unit tests pass
- [ ] E2E tests pass (no regressions)
- [ ] Health check passes
