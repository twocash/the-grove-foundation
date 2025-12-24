# Execution Prompt — Epic 1: Engagement State Machine

## Context

Epic 0 established Health integration with E2E test reporting. Epic 1 creates the XState v5 state machine that will model all engagement states currently implicit in NarrativeEngineContext.

**Critical:** This machine runs **parallel** to NarrativeEngineContext. Do NOT modify any existing context consumers. The machine is isolated for testing.

## Documentation

Sprint documentation in `docs/sprints/engagement-phase2/epic-1-state-machine/`:
- `REPO_AUDIT.md` — Analysis of current state management
- `SPEC.md` — Machine specification and acceptance criteria
- `ARCHITECTURE.md` — Full machine design with diagrams
- `MIGRATION_MAP.md` — File-by-file changes
- `DECISIONS.md` — ADRs explaining design choices
- `SPRINTS.md` — Task breakdown with code samples

## Key Files

| File | Purpose |
|------|---------|
| `hooks/NarrativeEngineContext.tsx` | Current context (DO NOT MODIFY) |
| `data/infrastructure/health-config.json` | Health checks (ADD machine check) |
| `lib/health-validator.js` | Health executors (ADD machine executor) |

## Execution Order

### Phase 1: Install XState (10 min)

```bash
npm install xstate@^5.18.0
npm ls xstate  # Verify: xstate@5.18.x
```

### Phase 2: Create Module Structure (5 min)

```bash
mkdir -p src/core/engagement
```

### Phase 3: Create Types (20 min)

Create `src/core/engagement/types.ts`:

```typescript
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
  lens: string | null;
  lensSource: 'url' | 'localStorage' | 'selection' | null;
  journey: Journey | null;
  journeyProgress: number;
  journeyTotal: number;
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

**Verify:** `npx tsc --noEmit src/core/engagement/types.ts`

### Phase 4: Create Guards (15 min)

Create `src/core/engagement/guards.ts`:

```typescript
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

### Phase 5: Create Actions (20 min)

Create `src/core/engagement/actions.ts`:

```typescript
import { assign } from 'xstate';
import type { EngagementContext, EngagementEvent } from './types';

type ActionParams = {
  context: EngagementContext;
  event: EngagementEvent;
};

export const actions = {
  setLens: assign(({ event }: ActionParams) => {
    if (event.type === 'SELECT_LENS') {
      return { lens: event.lens, lensSource: event.source };
    }
    if (event.type === 'CHANGE_LENS') {
      return { lens: event.lens, lensSource: 'selection' as const };
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

### Phase 6: Create Machine (30 min)

Create `src/core/engagement/machine.ts`:

```typescript
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
              SELECT_LENS: { target: 'lensActive', actions: 'setLens' },
            },
          },
          lensActive: {
            on: {
              CHANGE_LENS: { actions: 'setLens' },
              START_JOURNEY: { target: 'journeyActive', actions: 'startJourney', guard: 'hasLens' },
            },
          },
          journeyActive: {
            on: {
              ADVANCE_STEP: { actions: 'advanceStep', guard: 'notAtEnd' },
              COMPLETE_JOURNEY: { target: 'journeyComplete', actions: 'completeJourney' },
              EXIT_JOURNEY: { target: 'lensActive', actions: 'clearJourney' },
            },
          },
          journeyComplete: {
            on: {
              START_JOURNEY: { target: 'journeyActive', actions: 'startJourney' },
              EXIT_JOURNEY: { target: 'lensActive', actions: 'clearJourney' },
            },
          },
        },
      },
      terminal: {
        initial: 'closed',
        states: {
          closed: { on: { OPEN_TERMINAL: 'open' } },
          open: { on: { CLOSE_TERMINAL: 'closed' } },
        },
      },
    },
    on: {
      UPDATE_ENTROPY: { actions: 'updateEntropy' },
    },
  },
  { actions, guards }
);

export type EngagementMachine = typeof engagementMachine;
```

Create `src/core/engagement/index.ts`:

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

**Verify:**
```bash
npx tsc --noEmit
node -e "import('./src/core/engagement/index.js').then(m => console.log(Object.keys(m)))"
```

### Phase 7: Create Unit Tests (45 min)

Create `tests/unit/engagement-machine.test.ts` with tests from SPRINTS.md.

**Run tests:**
```bash
npx vitest run tests/unit/engagement-machine.test.ts
```

Expected: ~20 tests passing

### Phase 8: Health Integration (20 min)

Add to `data/infrastructure/health-config.json` engineChecks array:

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

Add executor to `lib/health-validator.js`:

```javascript
async function executeEngagementMachineCheck(check) {
  try {
    const engagementModule = await import('../src/core/engagement/index.js');
    if (!engagementModule.engagementMachine) {
      return { status: 'fail', message: 'Machine not exported' };
    }
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
'engagement-machine-check': executeEngagementMachineCheck,
```

**Verify:**
```bash
npm run health
```

---

## Test Verification

### Unit Tests
```bash
npx vitest run tests/unit/engagement-machine.test.ts
```
Expected: ~20 tests, all passing

### Full Test Suite
```bash
npm test
npx playwright test
```
Expected: No regressions

### Health Check
```bash
npm run health
```
Expected: engagement-machine-valid: pass

---

## Success Criteria

- [ ] XState v5.18.0+ installed
- [ ] `src/core/engagement/` contains 5 TypeScript files
- [ ] All files compile without errors
- [ ] Machine exports correctly (`engagementMachine`, types)
- [ ] Unit tests pass (~20 tests)
- [ ] Health check passes
- [ ] No changes to NarrativeEngineContext
- [ ] E2E tests still pass

---

## Forbidden Actions

- Do NOT modify `hooks/NarrativeEngineContext.tsx`
- Do NOT connect machine to React components
- Do NOT add persistence logic (Epic 2)
- Do NOT modify existing E2E tests
- Do NOT add new UI components

---

## Troubleshooting

### XState import errors
```bash
# Check Node version supports ES modules
node --version  # Should be 18+

# Try explicit .js extensions in imports
import { createMachine } from 'xstate';
```

### TypeScript errors with XState
```bash
# Ensure latest XState types
npm install xstate@latest
```

### Tests can't find module
```bash
# Check vitest config includes src
# Verify tsconfig paths
```

### Health check fails with import error
```bash
# Check ES module compatibility
# Use dynamic import: await import('../src/core/engagement/index.js')
```

---

## Commit Message

```
feat(engagement): add XState state machine for engagement

- Add XState v5 dependency
- Create engagement machine with parallel states:
  - session: anonymous → lensActive → journeyActive → journeyComplete
  - terminal: closed ↔ open
- Add guards: hasLens, notAtEnd, atEnd, highEntropy
- Add actions: setLens, startJourney, advanceStep, clearJourney, updateEntropy
- Add comprehensive unit tests (~20 tests)
- Add health check for machine validity

Machine runs parallel to NarrativeEngineContext.
No consumers modified - isolated for testing.
```
