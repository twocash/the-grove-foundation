# Sprint Stories — Epic 1: Engagement State Machine

## Overview

**Total Estimated Time:** ~3 hours
**Files Created:** 6
**Files Modified:** 3
**Tests Created:** ~20

## Task 1: Install XState (10 min)

**Task:** Add XState v5 dependency
**Commands:**
```bash
npm install xstate@^5.18.0
```
**Verification:**
```bash
npm ls xstate
# Should show xstate@5.18.x
```
**Commit:** `chore: add xstate dependency`

---

## Task 2: Create Directory Structure (5 min)

**Task:** Create engagement module directory
**Commands:**
```bash
mkdir -p src/core/engagement
```
**Files Created:**
- `src/core/engagement/` (directory)
**Commit:** `chore: create engagement module structure`

---

## Task 3: Create Types (20 min)

**Task:** Define TypeScript types for machine
**File:** Create `src/core/engagement/types.ts`

```typescript
// src/core/engagement/types.ts

export interface JourneyStep {
  id: string;
  title: string;
  content: string;
}

export interface Journey {
  id: string;
  name: string;
  hubId: string;
  steps: JourneyStep[];
}

export interface EngagementContext {
  // Lens state
  lens: string | null;
  lensSource: 'url' | 'localStorage' | 'selection' | null;
  
  // Journey state
  journey: Journey | null;
  journeyProgress: number;
  journeyTotal: number;
  
  // Entropy state
  entropy: number;
  entropyThreshold: number;
}

export const initialContext: EngagementContext = {
  lens: null,
  lensSource: null,
  journey: null,
  journeyProgress: 0,
  journeyTotal: 0,
  entropy: 0,
  entropyThreshold: 0.7,
};

export type EngagementEvent =
  | { type: 'SELECT_LENS'; lens: string; source: 'url' | 'localStorage' | 'selection' }
  | { type: 'CHANGE_LENS'; lens: string }
  | { type: 'START_JOURNEY'; journey: Journey }
  | { type: 'ADVANCE_STEP' }
  | { type: 'COMPLETE_JOURNEY' }
  | { type: 'EXIT_JOURNEY' }
  | { type: 'OPEN_TERMINAL' }
  | { type: 'CLOSE_TERMINAL' }
  | { type: 'UPDATE_ENTROPY'; value: number };
```

**Tests:** Type-checking via `npx tsc --noEmit`
**Commit:** `feat(engagement): add machine types`

---

## Task 4: Create Guards (15 min)

**Task:** Define guard functions
**File:** Create `src/core/engagement/guards.ts`

```typescript
// src/core/engagement/guards.ts

import type { EngagementContext } from './types';

export const guards = {
  hasLens: ({ context }: { context: EngagementContext }): boolean => {
    return context.lens !== null;
  },

  notAtEnd: ({ context }: { context: EngagementContext }): boolean => {
    return context.journeyProgress < context.journeyTotal - 1;
  },

  atEnd: ({ context }: { context: EngagementContext }): boolean => {
    return context.journeyProgress >= context.journeyTotal - 1;
  },

  highEntropy: ({ context }: { context: EngagementContext }): boolean => {
    return context.entropy > context.entropyThreshold;
  },
};
```

**Tests:** Unit tests in Task 7
**Commit:** `feat(engagement): add machine guards`

---

## Task 5: Create Actions (20 min)

**Task:** Define action functions
**File:** Create `src/core/engagement/actions.ts`

```typescript
// src/core/engagement/actions.ts

import { assign } from 'xstate';
import type { EngagementContext, EngagementEvent } from './types';

type ActionParams = {
  context: EngagementContext;
  event: EngagementEvent;
};

export const actions = {
  setLens: assign(({ context, event }: ActionParams) => {
    if (event.type === 'SELECT_LENS') {
      return {
        lens: event.lens,
        lensSource: event.source,
      };
    }
    if (event.type === 'CHANGE_LENS') {
      return {
        lens: event.lens,
        lensSource: 'selection' as const,
      };
    }
    return {};
  }),

  startJourney: assign(({ event }: ActionParams) => {
    if (event.type === 'START_JOURNEY') {
      return {
        journey: event.journey,
        journeyProgress: 0,
        journeyTotal: event.journey.steps.length,
      };
    }
    return {};
  }),

  advanceStep: assign(({ context }: ActionParams) => ({
    journeyProgress: context.journeyProgress + 1,
  })),

  completeJourney: assign(() => ({})),

  clearJourney: assign(() => ({
    journey: null,
    journeyProgress: 0,
    journeyTotal: 0,
  })),

  updateEntropy: assign(({ event }: ActionParams) => {
    if (event.type === 'UPDATE_ENTROPY') {
      return { entropy: event.value };
    }
    return {};
  }),
};
```

**Tests:** Unit tests in Task 7
**Commit:** `feat(engagement): add machine actions`

---

## Task 6: Create Machine (30 min)

**Task:** Define main state machine
**Files:** Create `src/core/engagement/machine.ts` and `src/core/engagement/index.ts`

### machine.ts

```typescript
// src/core/engagement/machine.ts

import { createMachine } from 'xstate';
import { initialContext } from './types';
import type { EngagementContext, EngagementEvent } from './types';
import { actions } from './actions';
import { guards } from './guards';

export const engagementMachine = createMachine(
  {
    id: 'engagement',
    type: 'parallel',
    context: initialContext,
    types: {} as {
      context: EngagementContext;
      events: EngagementEvent;
    },
    states: {
      session: {
        initial: 'anonymous',
        states: {
          anonymous: {
            on: {
              SELECT_LENS: {
                target: 'lensActive',
                actions: 'setLens',
              },
            },
          },
          lensActive: {
            on: {
              CHANGE_LENS: {
                actions: 'setLens',
              },
              START_JOURNEY: {
                target: 'journeyActive',
                actions: 'startJourney',
                guard: 'hasLens',
              },
            },
          },
          journeyActive: {
            on: {
              ADVANCE_STEP: {
                actions: 'advanceStep',
                guard: 'notAtEnd',
              },
              COMPLETE_JOURNEY: {
                target: 'journeyComplete',
                actions: 'completeJourney',
              },
              EXIT_JOURNEY: {
                target: 'lensActive',
                actions: 'clearJourney',
              },
            },
          },
          journeyComplete: {
            on: {
              START_JOURNEY: {
                target: 'journeyActive',
                actions: 'startJourney',
              },
              EXIT_JOURNEY: {
                target: 'lensActive',
                actions: 'clearJourney',
              },
            },
          },
        },
      },
      terminal: {
        initial: 'closed',
        states: {
          closed: {
            on: { OPEN_TERMINAL: 'open' },
          },
          open: {
            on: { CLOSE_TERMINAL: 'closed' },
          },
        },
      },
    },
    on: {
      UPDATE_ENTROPY: {
        actions: 'updateEntropy',
      },
    },
  },
  {
    actions,
    guards,
  }
);

export type EngagementMachine = typeof engagementMachine;
```

### index.ts

```typescript
// src/core/engagement/index.ts

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

**Verification:**
```bash
npx tsc --noEmit
node -e "import('./src/core/engagement/index.js').then(m => console.log(Object.keys(m)))"
```
**Commit:** `feat(engagement): add XState machine definition`

---

## Task 7: Create Unit Tests (45 min)

**Task:** Comprehensive unit tests for machine
**File:** Create `tests/unit/engagement-machine.test.ts`

```typescript
// tests/unit/engagement-machine.test.ts

import { describe, test, expect, beforeEach } from 'vitest';
import { createActor, type Actor } from 'xstate';
import { 
  engagementMachine, 
  type EngagementContext,
  type Journey 
} from '../../src/core/engagement';

const mockJourney: Journey = {
  id: 'test-journey',
  name: 'Test Journey',
  hubId: 'test-hub',
  steps: [
    { id: 'step-1', title: 'Step 1', content: 'Content 1' },
    { id: 'step-2', title: 'Step 2', content: 'Content 2' },
    { id: 'step-3', title: 'Step 3', content: 'Content 3' },
  ],
};

describe('Engagement Machine', () => {
  let actor: Actor<typeof engagementMachine>;

  beforeEach(() => {
    actor = createActor(engagementMachine);
    actor.start();
  });

  describe('Initial State', () => {
    test('starts in anonymous session state', () => {
      expect(actor.getSnapshot().matches('session.anonymous')).toBe(true);
    });

    test('starts with terminal closed', () => {
      expect(actor.getSnapshot().matches('terminal.closed')).toBe(true);
    });

    test('starts with null lens', () => {
      expect(actor.getSnapshot().context.lens).toBeNull();
    });

    test('starts with null journey', () => {
      expect(actor.getSnapshot().context.journey).toBeNull();
    });
  });

  describe('Session Transitions', () => {
    test('SELECT_LENS transitions from anonymous to lensActive', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      expect(actor.getSnapshot().matches('session.lensActive')).toBe(true);
    });

    test('SELECT_LENS sets lens in context', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'url' });
      expect(actor.getSnapshot().context.lens).toBe('engineer');
      expect(actor.getSnapshot().context.lensSource).toBe('url');
    });

    test('CHANGE_LENS updates lens in lensActive', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'CHANGE_LENS', lens: 'academic' });
      expect(actor.getSnapshot().context.lens).toBe('academic');
      expect(actor.getSnapshot().context.lensSource).toBe('selection');
    });

    test('START_JOURNEY transitions to journeyActive', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      expect(actor.getSnapshot().matches('session.journeyActive')).toBe(true);
    });

    test('START_JOURNEY initializes journey context', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      expect(actor.getSnapshot().context.journey).toEqual(mockJourney);
      expect(actor.getSnapshot().context.journeyProgress).toBe(0);
      expect(actor.getSnapshot().context.journeyTotal).toBe(3);
    });

    test('EXIT_JOURNEY returns to lensActive', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      actor.send({ type: 'EXIT_JOURNEY' });
      expect(actor.getSnapshot().matches('session.lensActive')).toBe(true);
      expect(actor.getSnapshot().context.journey).toBeNull();
    });

    test('COMPLETE_JOURNEY transitions to journeyComplete', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      actor.send({ type: 'COMPLETE_JOURNEY' });
      expect(actor.getSnapshot().matches('session.journeyComplete')).toBe(true);
    });
  });

  describe('Terminal Transitions', () => {
    test('OPEN_TERMINAL transitions to open', () => {
      actor.send({ type: 'OPEN_TERMINAL' });
      expect(actor.getSnapshot().matches('terminal.open')).toBe(true);
    });

    test('CLOSE_TERMINAL transitions to closed', () => {
      actor.send({ type: 'OPEN_TERMINAL' });
      actor.send({ type: 'CLOSE_TERMINAL' });
      expect(actor.getSnapshot().matches('terminal.closed')).toBe(true);
    });

    test('terminal state is independent of session state', () => {
      // Start journey
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      
      // Open terminal
      actor.send({ type: 'OPEN_TERMINAL' });
      
      // Both states independent
      expect(actor.getSnapshot().matches('session.journeyActive')).toBe(true);
      expect(actor.getSnapshot().matches('terminal.open')).toBe(true);
    });
  });

  describe('Guards', () => {
    test('START_JOURNEY blocked without lens (hasLens guard)', () => {
      // Try to start journey without lens
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      // Should still be anonymous
      expect(actor.getSnapshot().matches('session.anonymous')).toBe(true);
    });

    test('ADVANCE_STEP allowed when not at end', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      actor.send({ type: 'ADVANCE_STEP' });
      expect(actor.getSnapshot().context.journeyProgress).toBe(1);
    });

    test('ADVANCE_STEP blocked at end (notAtEnd guard)', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      // Advance to end
      actor.send({ type: 'ADVANCE_STEP' }); // 0 -> 1
      actor.send({ type: 'ADVANCE_STEP' }); // 1 -> 2 (last step)
      // This should be blocked
      actor.send({ type: 'ADVANCE_STEP' });
      expect(actor.getSnapshot().context.journeyProgress).toBe(2);
    });
  });

  describe('Context Updates', () => {
    test('UPDATE_ENTROPY updates entropy value', () => {
      actor.send({ type: 'UPDATE_ENTROPY', value: 0.85 });
      expect(actor.getSnapshot().context.entropy).toBe(0.85);
    });

    test('clearJourney resets journey state', () => {
      actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
      actor.send({ type: 'START_JOURNEY', journey: mockJourney });
      actor.send({ type: 'ADVANCE_STEP' });
      actor.send({ type: 'EXIT_JOURNEY' });
      
      expect(actor.getSnapshot().context.journey).toBeNull();
      expect(actor.getSnapshot().context.journeyProgress).toBe(0);
      expect(actor.getSnapshot().context.journeyTotal).toBe(0);
    });
  });
});
```

**Verification:**
```bash
npx vitest run tests/unit/engagement-machine.test.ts
```
**Commit:** `test(engagement): add machine unit tests`

---

## Task 8: Add Health Check (20 min)

**Task:** Integrate machine with Health system
**Files:** Modify `data/infrastructure/health-config.json` and `lib/health-validator.js`

### health-config.json changes

Add to `engineChecks` array:
```json
{
  "id": "engagement-machine-valid",
  "name": "Engagement Machine Valid",
  "category": "engine",
  "type": "engagement-machine-check",
  "impact": "State machine not properly defined, cannot migrate engagement context",
  "inspect": "npx vitest run tests/unit/engagement-machine.test.ts"
}
```

### health-validator.js changes

Add executor:
```javascript
async function executeEngagementMachineCheck(check) {
  try {
    // Dynamic import to handle ES modules
    const engagementModule = await import('../src/core/engagement/index.js');
    
    if (!engagementModule.engagementMachine) {
      return { status: 'fail', message: 'Machine not exported' };
    }
    
    // Try to create actor and verify initial state
    const { createActor } = await import('xstate');
    const actor = createActor(engagementModule.engagementMachine);
    actor.start();
    
    const snapshot = actor.getSnapshot();
    if (!snapshot.matches('session.anonymous')) {
      return { status: 'fail', message: 'Unexpected initial state' };
    }
    
    if (!snapshot.matches('terminal.closed')) {
      return { status: 'fail', message: 'Unexpected terminal state' };
    }
    
    return { status: 'pass', message: 'Machine valid, initial states correct' };
  } catch (error) {
    return { status: 'fail', message: `Check failed: ${error.message}` };
  }
}

// Add to executors object
const executors = {
  // ... existing
  'engagement-machine-check': executeEngagementMachineCheck,
};
```

**Verification:**
```bash
npm run health
```
**Commit:** `feat(health): add engagement machine check`

---

## Build Gates

### After Task 6 (Machine Created)
```bash
npm run build        # TypeScript compiles
npx tsc --noEmit     # No type errors
```

### After Task 7 (Tests Created)
```bash
npx vitest run tests/unit/engagement-machine.test.ts
# Should show ~20 passing tests
```

### After Task 8 (Health Integration)
```bash
npm run health
# Should show engagement-machine-valid: pass
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
1. chore: add xstate dependency
2. chore: create engagement module structure
3. feat(engagement): add machine types
4. feat(engagement): add machine guards
5. feat(engagement): add machine actions
6. feat(engagement): add XState machine definition
7. test(engagement): add machine unit tests
8. feat(health): add engagement machine check
```

---

## Summary

| Task | Time | Files | Tests |
|------|------|-------|-------|
| Install XState | 10 min | package.json | - |
| Create directory | 5 min | - | - |
| Create types | 20 min | types.ts | Type check |
| Create guards | 15 min | guards.ts | - |
| Create actions | 20 min | actions.ts | - |
| Create machine | 30 min | machine.ts, index.ts | - |
| Create tests | 45 min | engagement-machine.test.ts | ~20 tests |
| Health check | 20 min | health-config.json, health-validator.js | Health |
| **Total** | **~3 hours** | **6 created, 3 modified** | **~20 tests** |
