# Sprint Stories — Epic 5: Context Provider

## Overview

**Total Estimated Time:** ~1 hour
**Files Created:** 2
**Files Modified:** 2
**Tests Created:** ~8

---

## Task 1: Create Context File (25 min)

**Task:** Create EngagementContext, EngagementProvider, and useEngagement
**File:** Create `src/core/engagement/context.tsx`

```typescript
// src/core/engagement/context.tsx

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useActorRef } from '@xstate/react';
import type { Actor } from 'xstate';
import { engagementMachine, type EngagementMachine } from './machine';

// Context value type
export interface EngagementContextValue {
  actor: Actor<EngagementMachine>;
}

// Context with null default
const EngagementContext = createContext<EngagementContextValue | null>(null);

// Provider props
export interface EngagementProviderProps {
  children: ReactNode;
}

// Provider component
export function EngagementProvider({ children }: EngagementProviderProps): JSX.Element {
  const actor = useActorRef(engagementMachine);

  return (
    <EngagementContext.Provider value={{ actor }}>
      {children}
    </EngagementContext.Provider>
  );
}

// Hook for accessing context
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

// Export context for testing
export { EngagementContext };
```

**Verification:** `npx tsc --noEmit`
**Commit:** `feat(engagement): add EngagementProvider and useEngagement`

---

## Task 2: Create Context Tests (20 min)

**Task:** Unit tests for provider and hook
**File:** Create `tests/unit/engagement-context.test.tsx`

```typescript
// tests/unit/engagement-context.test.tsx

import { describe, test, expect } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import { act } from 'react';
import { 
  EngagementProvider, 
  useEngagement,
  EngagementContext,
  type EngagementContextValue
} from '../../src/core/engagement/context';
import { useLensState } from '../../src/core/engagement/hooks/useLensState';
import { useJourneyState } from '../../src/core/engagement/hooks/useJourneyState';
import { useEntropyState } from '../../src/core/engagement/hooks/useEntropyState';

describe('EngagementProvider', () => {
  test('renders children', () => {
    render(
      <EngagementProvider>
        <div data-testid="child">Hello</div>
      </EngagementProvider>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  test('provides actor via context', () => {
    let contextValue: EngagementContextValue | null = null;
    
    function Consumer() {
      contextValue = useEngagement();
      return null;
    }
    
    render(
      <EngagementProvider>
        <Consumer />
      </EngagementProvider>
    );
    
    expect(contextValue).not.toBeNull();
    expect(contextValue!.actor).toBeDefined();
  });

  test('actor is started on mount', () => {
    let contextValue: EngagementContextValue | null = null;
    
    function Consumer() {
      contextValue = useEngagement();
      return null;
    }
    
    render(
      <EngagementProvider>
        <Consumer />
      </EngagementProvider>
    );
    
    // Actor should be in a valid state
    expect(contextValue!.actor.getSnapshot()).toBeDefined();
  });
});

describe('useEngagement', () => {
  test('returns context value when inside provider', () => {
    const { result } = renderHook(() => useEngagement(), {
      wrapper: EngagementProvider,
    });
    
    expect(result.current.actor).toBeDefined();
  });

  test('throws descriptive error when outside provider', () => {
    expect(() => {
      renderHook(() => useEngagement());
    }).toThrow('useEngagement must be used within an EngagementProvider');
  });
});

describe('integration', () => {
  test('multiple consumers share same actor', () => {
    let actor1: any = null;
    let actor2: any = null;
    
    function Consumer1() {
      const { actor } = useEngagement();
      actor1 = actor;
      return null;
    }
    
    function Consumer2() {
      const { actor } = useEngagement();
      actor2 = actor;
      return null;
    }
    
    render(
      <EngagementProvider>
        <Consumer1 />
        <Consumer2 />
      </EngagementProvider>
    );
    
    expect(actor1).toBe(actor2);
  });

  test('useLensState works via useEngagement', () => {
    function Consumer() {
      const { actor } = useEngagement();
      const { lens, selectLens } = useLensState({ actor });
      return (
        <div>
          <span data-testid="lens">{lens ?? 'none'}</span>
          <button onClick={() => selectLens('engineer')}>Select</button>
        </div>
      );
    }
    
    render(
      <EngagementProvider>
        <Consumer />
      </EngagementProvider>
    );
    
    expect(screen.getByTestId('lens').textContent).toBe('none');
  });

  test('all hooks work together via context', () => {
    function Consumer() {
      const { actor } = useEngagement();
      const lens = useLensState({ actor });
      const journey = useJourneyState({ actor });
      const entropy = useEntropyState({ actor });
      
      return (
        <div>
          <span data-testid="lens">{lens.lens ?? 'none'}</span>
          <span data-testid="journey">{journey.isActive ? 'active' : 'inactive'}</span>
          <span data-testid="entropy">{entropy.entropy}</span>
        </div>
      );
    }
    
    render(
      <EngagementProvider>
        <Consumer />
      </EngagementProvider>
    );
    
    expect(screen.getByTestId('lens').textContent).toBe('none');
    expect(screen.getByTestId('journey').textContent).toBe('inactive');
    expect(screen.getByTestId('entropy').textContent).toBe('0');
  });
});
```

**Verification:**
```bash
npx vitest run tests/unit/engagement-context.test.tsx
```
Expected: ~8 tests passing
**Commit:** `test(engagement): add context provider tests`

---

## Task 3: Update Main Exports (10 min)

**Task:** Export context components from main index
**File:** Modify `src/core/engagement/index.ts`

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

**Verification:**
```bash
npx tsc --noEmit
```
**Commit:** `feat(engagement): export context components`

---

## Task 4: Add Health Check (10 min)

**Task:** Add engagement provider health check
**File:** Modify `data/infrastructure/health-config.json`

**Add to engagementChecks:**
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

**Verification:**
```bash
npm run health
```
**Commit:** `feat(health): add engagement provider check`

---

## Build Gates

### After Task 1 (Context)
```bash
npx tsc --noEmit
```

### After Task 2 (Tests)
```bash
npx vitest run tests/unit/engagement-context.test.tsx
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
1. feat(engagement): add EngagementProvider and useEngagement
2. test(engagement): add context provider tests
3. feat(engagement): export context components
4. feat(health): add engagement provider check
```

---

## Summary

| Task | Time | Files | Tests |
|------|------|-------|-------|
| Create context | 25 min | context.tsx | - |
| Create tests | 20 min | engagement-context.test.tsx | +8 |
| Update exports | 10 min | index.ts | - |
| Health check | 10 min | health-config.json | - |
| **Total** | **~1 hour** | **2 created, 2 modified** | **~8 tests** |
