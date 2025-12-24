# Migration Map — Epic 2: Lens State Extraction

## Overview

Epic 2 creates new files for lens state management. No existing files are modified for state logic—only exports are updated.

## Files to Create

### `src/core/engagement/config.ts`

**Purpose:** Valid lens definitions (DEX compliance)
**Depends on:** Nothing

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

**Tests:** Type checking, unit tests
**Commit:** `feat(engagement): add lens config`

---

### `src/core/engagement/persistence.ts`

**Purpose:** localStorage utilities
**Depends on:** Nothing

```typescript
const STORAGE_KEYS = {
  lens: 'grove-lens',
  journey: 'grove-journey-progress',
} as const;

function isBrowser(): boolean { ... }
export function getLens(): string | null { ... }
export function setLens(lens: string): void { ... }
export function clearLens(): void { ... }
export { STORAGE_KEYS };
```

**Tests:** `tests/unit/persistence.test.ts`
**Commit:** `feat(engagement): add persistence utilities`

---

### `src/core/engagement/hooks/useLensState.ts`

**Purpose:** Lens state hook with machine sync
**Depends on:** `machine.ts`, `persistence.ts`, `config.ts`

```typescript
export function useLensState({ actor }: UseLensStateOptions): UseLensStateReturn {
  // URL hydration
  // localStorage hydration
  // Machine subscription
  // Persistence on selection
}
```

**Tests:** `tests/unit/use-lens-state.test.ts`
**Commit:** `feat(engagement): add useLensState hook`

---

### `src/core/engagement/hooks/index.ts`

**Purpose:** Hook barrel export
**Depends on:** `useLensState.ts`

```typescript
export { useLensState, type UseLensStateOptions, type UseLensStateReturn } from './useLensState';
```

**Tests:** Import verification
**Commit:** (Same as useLensState)

---

### `tests/unit/persistence.test.ts`

**Purpose:** Persistence utility tests
**Depends on:** `persistence.ts`

```typescript
describe('persistence', () => {
  describe('getLens', () => { ... });
  describe('setLens', () => { ... });
  describe('clearLens', () => { ... });
  describe('isBrowser', () => { ... });
});
```

**Commit:** `test(engagement): add persistence tests`

---

### `tests/unit/use-lens-state.test.ts`

**Purpose:** Hook unit tests
**Depends on:** `useLensState.ts`, `machine.ts`

```typescript
describe('useLensState', () => {
  describe('initialization', () => { ... });
  describe('URL hydration', () => { ... });
  describe('localStorage hydration', () => { ... });
  describe('lens selection', () => { ... });
  describe('machine sync', () => { ... });
});
```

**Commit:** `test(engagement): add useLensState tests`

---

## Files to Modify

### `src/core/engagement/index.ts`

**Lines:** Export section
**Change Type:** Add exports

**Before:**
```typescript
export { engagementMachine, type EngagementMachine } from './machine';
export {
  type EngagementContext,
  type EngagementEvent,
  type Journey,
  type JourneyStep,
  initialContext,
} from './types';
export { guards } from './guards';
export { actions } from './actions';
```

**After:**
```typescript
export { engagementMachine, type EngagementMachine } from './machine';
export {
  type EngagementContext,
  type EngagementEvent,
  type Journey,
  type JourneyStep,
  initialContext,
} from './types';
export { guards } from './guards';
export { actions } from './actions';

// NEW: Config
export { VALID_LENSES, type ValidLens, isValidLens } from './config';

// NEW: Persistence
export { getLens, setLens, clearLens, STORAGE_KEYS } from './persistence';

// NEW: Hooks
export { useLensState, type UseLensStateOptions, type UseLensStateReturn } from './hooks';
```

**Reason:** Expose new modules
**Tests:** Import verification
**Commit:** `feat(engagement): export lens utilities and hook`

---

### `package.json`

**Lines:** dependencies section
**Change Type:** Add dependency

**Before:**
```json
{
  "dependencies": {
    "xstate": "^5.25.0",
    // ...
  }
}
```

**After:**
```json
{
  "dependencies": {
    "xstate": "^5.25.0",
    "@xstate/react": "^4.1.0",
    // ...
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    // ...
  }
}
```

**Reason:** React bindings for XState, hook testing
**Tests:** `npm install` succeeds
**Commit:** `chore: add @xstate/react and testing-library`

---

### `data/infrastructure/health-config.json`

**Lines:** engagementChecks array
**Change Type:** Add health check

**Add:**
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

**Reason:** Health tracks lens persistence
**Tests:** `npm run health`
**Commit:** `feat(health): add lens persistence check`

---

## Files NOT to Modify

| File | Reason |
|------|--------|
| `hooks/NarrativeEngineContext.tsx` | Consumer migration in Epic 6 |
| Any React components | Consumer migration in Epic 6 |
| E2E tests | Should pass without changes |

---

## Execution Order

### Phase 1: Dependencies (5 min)

```bash
npm install @xstate/react@^4.1.0
npm install -D @testing-library/react@^14.0.0
```

### Phase 2: Config (10 min)

1. Create `src/core/engagement/config.ts`
2. Verify: `npx tsc --noEmit`

### Phase 3: Persistence (15 min)

1. Create `src/core/engagement/persistence.ts`
2. Create `tests/unit/persistence.test.ts`
3. Verify: `npx vitest run tests/unit/persistence.test.ts`

### Phase 4: Hook (30 min)

1. Create `src/core/engagement/hooks/` directory
2. Create `src/core/engagement/hooks/useLensState.ts`
3. Create `src/core/engagement/hooks/index.ts`
4. Verify: `npx tsc --noEmit`

### Phase 5: Hook Tests (30 min)

1. Create `tests/unit/use-lens-state.test.ts`
2. Verify: `npx vitest run tests/unit/use-lens-state.test.ts`

### Phase 6: Exports (10 min)

1. Update `src/core/engagement/index.ts`
2. Verify exports work

### Phase 7: Health Integration (10 min)

1. Update `data/infrastructure/health-config.json`
2. Verify: `npm run health`

---

## Build Gates

### After Phase 3 (Persistence)
```bash
npx vitest run tests/unit/persistence.test.ts
```

### After Phase 5 (Hook Tests)
```bash
npx vitest run tests/unit/use-lens-state.test.ts
npm test  # All tests pass
```

### After Phase 7 (Complete)
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
# Remove new files
rm -rf src/core/engagement/hooks
rm src/core/engagement/config.ts
rm src/core/engagement/persistence.ts
rm tests/unit/persistence.test.ts
rm tests/unit/use-lens-state.test.ts

# Revert index.ts changes
git checkout src/core/engagement/index.ts

# Remove dependencies
npm uninstall @xstate/react @testing-library/react
```

Hook is isolated—no consumers depend on it yet.

---

## Verification Checklist

- [ ] @xstate/react@4.x installed
- [ ] @testing-library/react installed
- [ ] `config.ts` created with VALID_LENSES
- [ ] `persistence.ts` created and tested
- [ ] `hooks/useLensState.ts` created
- [ ] `hooks/index.ts` created
- [ ] `index.ts` exports updated
- [ ] Persistence tests pass (~6 tests)
- [ ] Hook tests pass (~12 tests)
- [ ] All unit tests pass
- [ ] E2E tests pass (no regressions)
- [ ] Health check passes
