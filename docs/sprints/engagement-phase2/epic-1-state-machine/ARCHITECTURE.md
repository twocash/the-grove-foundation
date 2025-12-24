# Architecture — Epic 1: Engagement State Machine

## Overview

The engagement state machine is a declarative XState v5 machine that models all user engagement states. It runs parallel to NarrativeEngineContext during migration, eventually replacing it.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Epic 1 Architecture                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CURRENT (unchanged)              NEW (parallel)                           │
│   ───────────────────              ──────────────                           │
│                                                                             │
│   ┌─────────────────────┐         ┌─────────────────────┐                  │
│   │ NarrativeEngine     │         │ Engagement Machine   │                  │
│   │ Context             │         │                     │                  │
│   │                     │         │ ┌─────────────────┐ │                  │
│   │ - 40+ handlers      │         │ │ session         │ │                  │
│   │ - imperative state  │   ───►  │ │ ├─ anonymous    │ │                  │
│   │ - scattered logic   │  (map)  │ │ ├─ lensActive   │ │                  │
│   │                     │         │ │ ├─ journeyActive│ │                  │
│   └─────────────────────┘         │ │ └─ journeyCompl │ │                  │
│           │                       │ └─────────────────┘ │                  │
│           │                       │ ┌─────────────────┐ │                  │
│           ▼                       │ │ terminal        │ │                  │
│   ┌─────────────────────┐         │ │ ├─ closed       │ │                  │
│   │ React Components    │         │ │ └─ open         │ │                  │
│   │ (consumers)         │         │ └─────────────────┘ │                  │
│   │                     │         └─────────────────────┘                  │
│   │ NO CHANGES in       │                   │                              │
│   │ Epic 1              │                   │                              │
│   └─────────────────────┘                   ▼                              │
│                                   ┌─────────────────────┐                  │
│                                   │ Unit Tests          │                  │
│                                   │ (verify machine)    │                  │
│                                   └─────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## State Machine Design

### Parallel State Structure

```
engagement (parallel root)
│
├── session (sequential)
│   ├── anonymous
│   │   └── on: SELECT_LENS → lensActive
│   │
│   ├── lensActive
│   │   ├── on: CHANGE_LENS → (self, update context)
│   │   └── on: START_JOURNEY → journeyActive [guard: hasLens]
│   │
│   ├── journeyActive
│   │   ├── on: ADVANCE_STEP → (self, increment) [guard: notAtEnd]
│   │   ├── on: COMPLETE_JOURNEY → journeyComplete
│   │   └── on: EXIT_JOURNEY → lensActive
│   │
│   └── journeyComplete
│       ├── on: START_JOURNEY → journeyActive
│       └── on: EXIT_JOURNEY → lensActive
│
├── terminal (sequential)
│   ├── closed
│   │   └── on: OPEN_TERMINAL → open
│   └── open
│       └── on: CLOSE_TERMINAL → closed
│
└── on: UPDATE_ENTROPY → (any state, update context)
```

### Why Parallel States?

Terminal state is **independent** of session state:
- User can open terminal while anonymous
- User can open terminal during journey
- Terminal state doesn't affect session progression

Without parallel states, we'd need:
- `anonymous.terminalClosed`, `anonymous.terminalOpen`
- `lensActive.terminalClosed`, `lensActive.terminalOpen`
- etc. (8 states instead of 6)

## Data Structures

### EngagementContext

```typescript
// src/core/engagement/types.ts

export interface Journey {
  id: string;
  name: string;
  hubId: string;
  steps: JourneyStep[];
}

export interface JourneyStep {
  id: string;
  title: string;
  content: string;
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
```

### EngagementEvent

```typescript
// src/core/engagement/types.ts

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

## File Organization

```
src/
└── core/
    └── engagement/
        ├── index.ts            # Public exports
        ├── machine.ts          # Main machine definition
        ├── types.ts            # TypeScript types
        ├── actions.ts          # Action implementations
        └── guards.ts           # Guard implementations

tests/
└── unit/
    └── engagement-machine.test.ts  # Machine unit tests
```

## Machine Implementation

### machine.ts

```typescript
// src/core/engagement/machine.ts

import { createMachine, assign } from 'xstate';
import { EngagementContext, EngagementEvent, initialContext } from './types';
import { actions } from './actions';
import { guards } from './guards';

export const engagementMachine = createMachine({
  id: 'engagement',
  type: 'parallel',
  context: initialContext,
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
}, {
  actions,
  guards,
});

export type EngagementMachine = typeof engagementMachine;
```

### actions.ts

```typescript
// src/core/engagement/actions.ts

import { assign } from 'xstate';
import { EngagementContext, EngagementEvent } from './types';

export const actions = {
  setLens: assign(({ context, event }) => {
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

  startJourney: assign(({ event }) => {
    if (event.type === 'START_JOURNEY') {
      return {
        journey: event.journey,
        journeyProgress: 0,
        journeyTotal: event.journey.steps.length,
      };
    }
    return {};
  }),

  advanceStep: assign(({ context }) => ({
    journeyProgress: context.journeyProgress + 1,
  })),

  completeJourney: assign(() => ({
    // Journey stays in context for reference
    // Could trigger analytics here
  })),

  clearJourney: assign(() => ({
    journey: null,
    journeyProgress: 0,
    journeyTotal: 0,
  })),

  updateEntropy: assign(({ event }) => {
    if (event.type === 'UPDATE_ENTROPY') {
      return { entropy: event.value };
    }
    return {};
  }),
};
```

### guards.ts

```typescript
// src/core/engagement/guards.ts

import { EngagementContext } from './types';

export const guards = {
  hasLens: ({ context }: { context: EngagementContext }) => {
    return context.lens !== null;
  },

  notAtEnd: ({ context }: { context: EngagementContext }) => {
    return context.journeyProgress < context.journeyTotal - 1;
  },

  atEnd: ({ context }: { context: EngagementContext }) => {
    return context.journeyProgress >= context.journeyTotal - 1;
  },

  highEntropy: ({ context }: { context: EngagementContext }) => {
    return context.entropy > context.entropyThreshold;
  },
};
```

## Test Architecture

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Unit | `tests/unit/engagement-machine.test.ts` | Machine transitions |
| Integration | (Later epics) | React + machine |
| E2E | (Existing) | User behavior |

### Unit Test Structure

```typescript
// tests/unit/engagement-machine.test.ts

import { createActor } from 'xstate';
import { engagementMachine } from '../../src/core/engagement/machine';

describe('Engagement Machine', () => {
  describe('Session States', () => {
    test('starts in anonymous state', () => {});
    test('SELECT_LENS transitions to lensActive', () => {});
    test('START_JOURNEY requires lens (guard)', () => {});
    // ... more
  });

  describe('Terminal States', () => {
    test('starts in closed state', () => {});
    test('terminal is independent of session', () => {});
  });

  describe('Context Updates', () => {
    test('setLens updates lens and source', () => {});
    test('startJourney initializes journey state', () => {});
  });

  describe('Guards', () => {
    test('hasLens blocks START_JOURNEY without lens', () => {});
    test('notAtEnd allows ADVANCE_STEP mid-journey', () => {});
  });
});
```

### Health Integration

```json
{
  "id": "engagement-machine-valid",
  "name": "Engagement Machine Exports",
  "category": "engine",
  "type": "module-exports",
  "module": "src/core/engagement/index.ts",
  "exports": ["engagementMachine", "EngagementContext", "EngagementEvent"],
  "impact": "State machine not properly defined, cannot migrate context",
  "inspect": "npx vitest run tests/unit/engagement-machine.test.ts"
}
```

## Integration Points

### With Existing System (Epic 1)

None—machine is isolated for testing.

### Future Integration (Epics 5-6)

```typescript
// Future: EngagementContext.tsx (Epic 5)
import { useMachine } from '@xstate/react';
import { engagementMachine } from '../core/engagement';

export function EngagementProvider({ children }) {
  const [state, send] = useMachine(engagementMachine);
  
  // Adapter to existing interface during migration
  const value = {
    currentLens: state.context.lens,
    selectLens: (lens: string) => send({ type: 'SELECT_LENS', lens, source: 'selection' }),
    // ... rest of adapter
  };
  
  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>;
}
```

## Performance Considerations

- XState machines are lightweight (~2KB gzipped)
- `createActor` is synchronous, no async overhead
- Guards are pure functions, easily memoizable
- Context is immutable (assign creates new object)

## Migration Path

| Epic | Machine Status |
|------|----------------|
| 1 | Created, tested in isolation |
| 2 | Lens persistence added |
| 3 | Journey state extracted |
| 4 | Entropy logic integrated |
| 5 | EngagementContext assembled |
| 6 | Consumers migrate |
| 7 | NarrativeEngineContext deleted |
