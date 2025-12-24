# Migration Map — Epic 1: Engagement State Machine

## Overview

Epic 1 creates the XState machine **parallel** to NarrativeEngineContext. No existing files are modified for state management—only new files are created.

## Files to Create

### `src/core/engagement/types.ts`

**Purpose:** TypeScript types for machine context and events
**Depends on:** Nothing
**Tests:** Type checking via `tsc`

```typescript
// Full implementation in ARCHITECTURE.md
export interface Journey { ... }
export interface EngagementContext { ... }
export type EngagementEvent = ...;
export const initialContext: EngagementContext = { ... };
```

---

### `src/core/engagement/guards.ts`

**Purpose:** Pure functions that guard transitions
**Depends on:** `types.ts`
**Tests:** `tests/unit/engagement-machine.test.ts`

```typescript
export const guards = {
  hasLens: ({ context }) => context.lens !== null,
  notAtEnd: ({ context }) => context.journeyProgress < context.journeyTotal - 1,
  atEnd: ({ context }) => context.journeyProgress >= context.journeyTotal - 1,
  highEntropy: ({ context }) => context.entropy > context.entropyThreshold,
};
```

---

### `src/core/engagement/actions.ts`

**Purpose:** Assign actions that update context
**Depends on:** `types.ts`
**Tests:** `tests/unit/engagement-machine.test.ts`

```typescript
export const actions = {
  setLens: assign(({ event }) => ({ lens: event.lens, lensSource: event.source })),
  startJourney: assign(({ event }) => ({ journey: event.journey, journeyProgress: 0, journeyTotal: event.journey.steps.length })),
  advanceStep: assign(({ context }) => ({ journeyProgress: context.journeyProgress + 1 })),
  clearJourney: assign(() => ({ journey: null, journeyProgress: 0, journeyTotal: 0 })),
  updateEntropy: assign(({ event }) => ({ entropy: event.value })),
};
```

---

### `src/core/engagement/machine.ts`

**Purpose:** Main XState machine definition
**Depends on:** `types.ts`, `guards.ts`, `actions.ts`
**Tests:** `tests/unit/engagement-machine.test.ts`

```typescript
import { createMachine } from 'xstate';
import { initialContext } from './types';
import { actions } from './actions';
import { guards } from './guards';

export const engagementMachine = createMachine({
  id: 'engagement',
  type: 'parallel',
  context: initialContext,
  states: {
    session: { /* anonymous → lensActive → journeyActive → journeyComplete */ },
    terminal: { /* closed ↔ open */ },
  },
  on: { UPDATE_ENTROPY: { actions: 'updateEntropy' } },
}, { actions, guards });
```

---

### `src/core/engagement/index.ts`

**Purpose:** Public exports for the module
**Depends on:** All other files
**Tests:** Import test

```typescript
export { engagementMachine, type EngagementMachine } from './machine';
export { 
  type EngagementContext, 
  type EngagementEvent, 
  type Journey,
  initialContext 
} from './types';
export { guards } from './guards';
export { actions } from './actions';
```

---

### `tests/unit/engagement-machine.test.ts`

**Purpose:** Unit tests for state machine
**Depends on:** `src/core/engagement/`
**Tests:** Self (Vitest)

```typescript
import { describe, test, expect } from 'vitest';
import { createActor } from 'xstate';
import { engagementMachine } from '../../src/core/engagement';

describe('Engagement Machine', () => {
  describe('Initial State', () => { ... });
  describe('Session Transitions', () => { ... });
  describe('Terminal Transitions', () => { ... });
  describe('Guards', () => { ... });
  describe('Context Updates', () => { ... });
});
```

---

## Files to Modify

### `package.json`

**Lines:** dependencies section
**Change Type:** Add dependencies
**Before:**
```json
{
  "dependencies": {
    // existing deps
  }
}
```
**After:**
```json
{
  "dependencies": {
    // existing deps
    "xstate": "^5.18.0"
  }
}
```
**Reason:** XState v5 for state machine
**Tests:** `npm install` succeeds

---

### `data/infrastructure/health-config.json`

**Lines:** engineChecks array
**Change Type:** Add health check
**Before:**
```json
{
  "engineChecks": [
    // existing checks
  ]
}
```
**After:**
```json
{
  "engineChecks": [
    // existing checks
    {
      "id": "engagement-machine-valid",
      "name": "Engagement Machine Valid",
      "category": "engine",
      "type": "custom",
      "executor": "engagement-machine-check",
      "impact": "State machine not properly defined",
      "inspect": "npx vitest run tests/unit/engagement-machine.test.ts"
    }
  ]
}
```
**Reason:** Health system tracks machine validity
**Tests:** `npm run health`

---

### `lib/health-validator.js`

**Lines:** executors object
**Change Type:** Add custom executor
**Before:**
```javascript
const executors = {
  'json-exists': executeJsonExists,
  'e2e-behavior': executeE2EBehavior,
  // existing
};
```
**After:**
```javascript
const executors = {
  'json-exists': executeJsonExists,
  'e2e-behavior': executeE2EBehavior,
  'engagement-machine-check': executeEngagementMachineCheck,
  // existing
};

async function executeEngagementMachineCheck(check) {
  try {
    const { engagementMachine } = await import('../src/core/engagement/index.js');
    if (!engagementMachine) {
      return { status: 'fail', message: 'Machine not exported' };
    }
    return { status: 'pass', message: 'Machine exports valid' };
  } catch (error) {
    return { status: 'fail', message: `Import failed: ${error.message}` };
  }
}
```
**Reason:** Custom check verifies machine exports
**Tests:** `npm run health`

---

## Test Changes

### Tests to Create

| Test File | Tests | Verifies |
|-----------|-------|----------|
| `tests/unit/engagement-machine.test.ts` | ~20 tests | All machine behavior |

### Test Categories

| Test | Purpose |
|------|---------|
| Initial state tests | Machine starts correctly |
| Transition tests | Events cause correct state changes |
| Guard tests | Invalid transitions blocked |
| Context tests | Actions update context correctly |
| Parallel state tests | Terminal independent of session |

---

## Execution Order

### Phase 1: Setup

1. Install XState dependency
   ```bash
   npm install xstate@^5.18.0
   ```
2. Verify installation
   ```bash
   npm ls xstate
   ```

### Phase 2: Create Types

1. Create directory structure
   ```bash
   mkdir -p src/core/engagement
   ```
2. Create `src/core/engagement/types.ts`
3. Verify types compile
   ```bash
   npx tsc --noEmit src/core/engagement/types.ts
   ```

### Phase 3: Create Guards

1. Create `src/core/engagement/guards.ts`
2. Verify compiles

### Phase 4: Create Actions

1. Create `src/core/engagement/actions.ts`
2. Verify compiles

### Phase 5: Create Machine

1. Create `src/core/engagement/machine.ts`
2. Create `src/core/engagement/index.ts`
3. Verify exports
   ```bash
   node -e "import('./src/core/engagement/index.js').then(m => console.log(Object.keys(m)))"
   ```

### Phase 6: Create Tests

1. Create `tests/unit/engagement-machine.test.ts`
2. Run tests
   ```bash
   npx vitest run tests/unit/engagement-machine.test.ts
   ```

### Phase 7: Health Integration

1. Add health check to `health-config.json`
2. Add executor to `lib/health-validator.js`
3. Verify health
   ```bash
   npm run health
   ```

---

## Build Gates

After each phase:
```bash
npm run build        # TypeScript compiles
npm test             # All tests pass
```

After Phase 7:
```bash
npm run health       # Health check passes
```

---

## Rollback Plan

### If XState causes issues:
```bash
npm uninstall xstate
rm -rf src/core/engagement
rm tests/unit/engagement-machine.test.ts
# Revert health-config.json and health-validator.js changes
git checkout data/infrastructure/health-config.json lib/health-validator.js
```

### If machine definition wrong:
Machine is isolated—no consumers depend on it yet. Simply iterate on the implementation.

---

## Verification Checklist

- [ ] XState v5.18.0+ installed
- [ ] `src/core/engagement/` directory created
- [ ] All 5 source files created
- [ ] All types compile without error
- [ ] Machine exports correctly
- [ ] Unit tests created and passing
- [ ] Health check added
- [ ] Health check passes
- [ ] No changes to NarrativeEngineContext
- [ ] E2E tests still pass (no regressions)
