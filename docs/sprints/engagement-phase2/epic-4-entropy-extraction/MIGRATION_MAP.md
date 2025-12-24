# Migration Map — Epic 4: Entropy State Extraction

## Overview

Epic 4 creates `useEntropyState` hook and adds entropy configuration. Minimal file changes—primarily new files and export updates.

## Files to Create

### `src/core/engagement/hooks/useEntropyState.ts`

**Purpose:** Entropy state hook with machine sync
**Depends on:** `machine.ts`, `types.ts`, `config.ts`

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
  // Implementation in ARCHITECTURE.md
}
```

**Tests:** `tests/unit/use-entropy-state.test.ts`
**Commit:** `feat(engagement): add useEntropyState hook`

---

### `tests/unit/use-entropy-state.test.ts`

**Purpose:** Comprehensive hook unit tests
**Depends on:** `useEntropyState.ts`, `machine.ts`

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createActor } from 'xstate';
import { engagementMachine } from '../../src/core/engagement';
import { useEntropyState } from '../../src/core/engagement/hooks/useEntropyState';

describe('useEntropyState', () => {
  // ~12 tests covering state, computed, actions
});
```

**Commit:** `test(engagement): add useEntropyState tests`

---

## Files to Modify

### `src/core/engagement/config.ts`

**Lines:** After VALID_LENSES
**Change Type:** Add entropy configuration

**Add:**
```typescript
export const ENTROPY_CONFIG = {
  defaultThreshold: 0.7,
  minValue: 0,
  maxValue: 1,
  resetValue: 0,
} as const;

export type EntropyConfig = typeof ENTROPY_CONFIG;
```

**Reason:** Configurable entropy defaults
**Tests:** Type checking
**Commit:** `feat(engagement): add entropy config`

---

### `src/core/engagement/hooks/index.ts`

**Lines:** Export section
**Change Type:** Add export

**Before:**
```typescript
export { useLensState } from './useLensState';
export type { UseLensStateOptions, UseLensStateReturn } from './useLensState';

export { useJourneyState } from './useJourneyState';
export type { UseJourneyStateOptions, UseJourneyStateReturn } from './useJourneyState';
```

**After:**
```typescript
export { useLensState } from './useLensState';
export type { UseLensStateOptions, UseLensStateReturn } from './useLensState';

export { useJourneyState } from './useJourneyState';
export type { UseJourneyStateOptions, UseJourneyStateReturn } from './useJourneyState';

export { useEntropyState } from './useEntropyState';
export type { UseEntropyStateOptions, UseEntropyStateReturn } from './useEntropyState';
```

**Reason:** Expose new hook
**Commit:** (Same as useEntropyState)

---

### `src/core/engagement/index.ts`

**Lines:** Config and hooks exports
**Change Type:** Add exports

**Add to config exports:**
```typescript
export { 
  VALID_LENSES, 
  type ValidLens, 
  isValidLens,
  ENTROPY_CONFIG,
  type EntropyConfig,
} from './config';
```

**Add to hooks exports:**
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

**Reason:** Expose all new exports
**Commit:** `feat(engagement): export entropy utilities and hook`

---

### `data/infrastructure/health-config.json`

**Lines:** engagementChecks array
**Change Type:** Add health check

**Add:**
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

**Reason:** Health tracks entropy threshold detection
**Commit:** `feat(health): add entropy threshold check`

---

## Files NOT to Modify

| File | Reason |
|------|--------|
| `hooks/NarrativeEngineContext.tsx` | Consumer migration in Epic 6 |
| `src/core/engagement/machine.ts` | Machine already has entropy |
| `src/core/engagement/persistence.ts` | Entropy not persisted |
| React components | Consumer migration in Epic 6 |

---

## Execution Order

### Phase 1: Configuration (10 min)

1. Update `src/core/engagement/config.ts` with ENTROPY_CONFIG
2. Verify: `npx tsc --noEmit`

### Phase 2: Hook Implementation (25 min)

1. Create `src/core/engagement/hooks/useEntropyState.ts`
2. Update `src/core/engagement/hooks/index.ts`
3. Verify: `npx tsc --noEmit`

### Phase 3: Hook Tests (25 min)

1. Create `tests/unit/use-entropy-state.test.ts`
2. Verify: `npx vitest run tests/unit/use-entropy-state.test.ts`

### Phase 4: Export Updates (10 min)

1. Update `src/core/engagement/index.ts`
2. Verify exports work

### Phase 5: Health Integration (10 min)

1. Update `data/infrastructure/health-config.json`
2. Verify: `npm run health`

---

## Build Gates

### After Phase 1 (Config)
```bash
npx tsc --noEmit
```

### After Phase 3 (Hook Tests)
```bash
npx vitest run tests/unit/use-entropy-state.test.ts
npm test  # All tests pass
```

### After Phase 5 (Complete)
```bash
npm run build
npm test
npx playwright test
npm run health
```

---

## Rollback Plan

### If hook causes issues:
```bash
# Remove new file
rm src/core/engagement/hooks/useEntropyState.ts
rm tests/unit/use-entropy-state.test.ts

# Revert hooks/index.ts
git checkout src/core/engagement/hooks/index.ts

# Revert config.ts (entropy config only)
git checkout src/core/engagement/config.ts

# Revert index.ts
git checkout src/core/engagement/index.ts
```

Hook is isolated—no consumers depend on it yet.

---

## Verification Checklist

- [ ] `config.ts` has ENTROPY_CONFIG
- [ ] `hooks/useEntropyState.ts` created
- [ ] `hooks/index.ts` exports useEntropyState
- [ ] `index.ts` exports all new modules
- [ ] Hook tests pass (~12 tests)
- [ ] All unit tests pass
- [ ] E2E tests pass (no regressions)
- [ ] Health check passes
