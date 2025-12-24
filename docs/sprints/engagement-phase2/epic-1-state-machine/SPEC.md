# Specification — Epic 1: Engagement State Machine

## Overview

Create an XState v5 state machine that models all engagement states and transitions currently implicit in NarrativeEngineContext. The machine runs **parallel** to the existing context—this epic establishes the foundation without modifying any consumers.

## Goals

1. Define formal state machine capturing all engagement states
2. Implement all transitions with proper guards
3. Add machine actions for side effects
4. Create comprehensive unit tests
5. Add Health check for machine validity

## Non-Goals

- Modifying NarrativeEngineContext (Epic 6)
- Connecting machine to React components (Epic 5)
- Implementing persistence (Epic 2-4 handle this)
- Replacing any existing functionality

## Success Criteria

After this epic:
1. XState machine compiles and exports cleanly
2. All states reachable via valid transitions
3. Guards prevent invalid state combinations
4. Unit tests achieve 100% transition coverage
5. Health check verifies machine structure

## Acceptance Criteria

### Functional Requirements

- [ ] AC-1: Machine defines states: anonymous, lensActive, journeyActive, journeyComplete
- [ ] AC-2: Machine defines parallel terminal state: closed, open
- [ ] AC-3: All events from REPO_AUDIT implemented
- [ ] AC-4: Guards prevent invalid transitions (e.g., START_JOURNEY without lens)
- [ ] AC-5: Actions update context on transitions
- [ ] AC-6: Machine can be instantiated without React

### Test Requirements (MANDATORY)

- [ ] AC-T1: Unit tests for every state transition
- [ ] AC-T2: Unit tests for guard conditions
- [ ] AC-T3: Tests verify context updates
- [ ] AC-T4: All tests pass: `npm test`
- [ ] AC-T5: Health check passes: `npm run health`

### DEX Compliance

- [ ] AC-D1: Machine definition is declarative (XState config)
- [ ] AC-D2: No hardcoded business logic in machine
- [ ] AC-D3: Actions and guards are pure functions

## State Machine Design

### States

```typescript
type EngagementState = 
  | 'anonymous'      // No lens selected
  | 'lensActive'     // Lens selected, no journey
  | 'journeyActive'  // Currently in journey
  | 'journeyComplete'; // Journey finished

type TerminalState = 
  | 'closed'
  | 'open';
```

### Events

```typescript
type EngagementEvent =
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

### Context

```typescript
interface EngagementContext {
  lens: string | null;
  lensSource: 'url' | 'localStorage' | 'selection' | null;
  journey: Journey | null;
  journeyProgress: number;
  journeyTotal: number;
  entropy: number;
  entropyThreshold: number;
}
```

### Machine Structure

```typescript
const engagementMachine = createMachine({
  id: 'engagement',
  type: 'parallel',
  context: { /* initial context */ },
  states: {
    session: {
      initial: 'anonymous',
      states: {
        anonymous: {
          on: { SELECT_LENS: { target: 'lensActive', actions: 'setLens' } }
        },
        lensActive: {
          on: {
            CHANGE_LENS: { actions: 'setLens' },
            START_JOURNEY: { target: 'journeyActive', actions: 'startJourney', guard: 'hasLens' }
          }
        },
        journeyActive: {
          on: {
            ADVANCE_STEP: { actions: 'advanceStep', guard: 'notAtEnd' },
            COMPLETE_JOURNEY: { target: 'journeyComplete', actions: 'completeJourney' },
            EXIT_JOURNEY: { target: 'lensActive', actions: 'clearJourney' }
          }
        },
        journeyComplete: {
          on: {
            START_JOURNEY: { target: 'journeyActive', actions: 'startJourney' },
            EXIT_JOURNEY: { target: 'lensActive', actions: 'clearJourney' }
          }
        }
      }
    },
    terminal: {
      initial: 'closed',
      states: {
        closed: { on: { OPEN_TERMINAL: 'open' } },
        open: { on: { CLOSE_TERMINAL: 'closed' } }
      }
    }
  },
  on: {
    UPDATE_ENTROPY: { actions: 'updateEntropy' }
  }
});
```

## Guards

| Guard | Condition | Used By |
|-------|-----------|---------|
| hasLens | `context.lens !== null` | START_JOURNEY |
| notAtEnd | `context.journeyProgress < context.journeyTotal - 1` | ADVANCE_STEP |
| atEnd | `context.journeyProgress >= context.journeyTotal - 1` | Auto-transition |
| highEntropy | `context.entropy > context.entropyThreshold` | Journey suggestions |

## Actions

| Action | Effect | Context Change |
|--------|--------|----------------|
| setLens | Store lens and source | `lens`, `lensSource` |
| startJourney | Initialize journey state | `journey`, `journeyProgress`, `journeyTotal` |
| advanceStep | Increment progress | `journeyProgress` |
| completeJourney | Mark complete | (triggers side effect) |
| clearJourney | Reset journey state | `journey = null`, `journeyProgress = 0` |
| updateEntropy | Update entropy value | `entropy` |

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| xstate | State machine library | ^5.18.0 |
| @xstate/react | React bindings (later) | ^4.1.0 |

## File Structure

```
src/core/engagement/
├── machine.ts          # Main machine definition
├── types.ts            # TypeScript types
├── actions.ts          # Action implementations
├── guards.ts           # Guard implementations
└── index.ts            # Public exports

tests/unit/
└── engagement-machine.test.ts  # Machine unit tests
```

## Health Check Addition

```json
{
  "id": "engagement-machine-valid",
  "name": "Engagement Machine Valid",
  "category": "engine",
  "type": "module-exports",
  "module": "src/core/engagement/machine.ts",
  "exports": ["engagementMachine"],
  "impact": "State machine not properly defined",
  "inspect": "node -e \"require('./src/core/engagement/machine.ts')\""
}
```

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| XState v5 syntax unfamiliar | Medium | Low | Follow official examples |
| Type complexity | Medium | Medium | Start simple, iterate |
| Over-engineering states | Low | Medium | Match existing behavior exactly |

## Out of Scope

- React integration (Epic 5)
- Persistence layer (Epics 2-4)
- Consumer migration (Epic 6)
- Legacy deletion (Epic 7)
- UI changes
