# Architectural Decision Records — Epic 1: Engagement State Machine

## ADR-033: XState v5 for State Management

### Status
Accepted

### Context
NarrativeEngineContext uses implicit state machines—state is derived from combinations of useState variables. This makes transitions hard to reason about and test. We need a formal state machine to:
- Make states explicit
- Enforce valid transitions
- Enable isolated testing
- Support persistence (future epics)

### Options Considered

1. **XState v5** — Industry standard, TypeScript-first, excellent devtools
2. **XState v4** — Older API, still supported
3. **Zustand** — Simpler, but no formal state machine
4. **Redux Toolkit** — Heavy, not state-machine-focused
5. **Custom implementation** — Full control, maintenance burden

### Decision
Use XState v5 (^5.18.0).

### Rationale
- v5 has cleaner API than v4 (`createMachine` + `createActor`)
- TypeScript types are first-class
- Built-in persistence support via actors
- Excellent devtools for debugging
- Industry adoption (Stately.ai)
- Clear migration path from v4 patterns

### Consequences

**Positive:**
- Formal state definitions
- Automatic transition validation
- Excellent TypeScript inference
- Devtools for debugging

**Negative:**
- Learning curve for team
- Additional dependency
- v5 relatively new (some v4 patterns don't apply)

---

## ADR-034: Parallel State Structure

### Status
Accepted

### Context
Terminal state (open/closed) is independent of session state (anonymous → lensActive → etc.). Without parallel states, we'd need 8 combined states instead of 6.

### Options Considered

1. **Parallel states** — session and terminal as independent regions
2. **Nested states** — terminal nested under each session state
3. **Separate machines** — two independent machines
4. **Single flat machine** — combined states (anonymous-closed, anonymous-open, etc.)

### Decision
Use parallel states within a single machine.

### Rationale
```typescript
// Parallel: 6 total states
states: {
  session: { states: { anonymous, lensActive, journeyActive, journeyComplete } },  // 4
  terminal: { states: { closed, open } }  // 2
}

// Flat: 8 total states (4 × 2)
states: {
  'anonymous-closed', 'anonymous-open',
  'lensActive-closed', 'lensActive-open',
  'journeyActive-closed', 'journeyActive-open',
  'journeyComplete-closed', 'journeyComplete-open'
}
```

Parallel states:
- Reduce state explosion
- Make independence explicit
- Allow independent transitions
- Match the actual domain model

### Consequences

**Positive:**
- Cleaner state definition
- Independent state regions
- Easier to reason about
- Matches domain reality

**Negative:**
- Slightly more complex state matching
- `state.matches('session.lensActive')` syntax

---

## ADR-035: Context vs. State for Data

### Status
Accepted

### Context
Some data changes without state changes (e.g., entropy value, journey progress). XState distinguishes between:
- **States**: Discrete modes (anonymous, lensActive)
- **Context**: Extended data that can change within a state

### Options Considered

1. **All in context** — States minimal, data in context
2. **All in states** — Every data combination is a state
3. **Hybrid** — Discrete modes as states, variable data as context

### Decision
Use hybrid approach—states for modes, context for data.

### Rationale
```typescript
// Context: data that varies within a state
context: {
  lens: string | null,
  lensSource: 'url' | 'localStorage' | 'selection' | null,
  journey: Journey | null,
  journeyProgress: number,
  journeyTotal: number,
  entropy: number,
  entropyThreshold: number,
}

// States: discrete modes that determine behavior
states: {
  session: {
    anonymous,      // No lens
    lensActive,     // Has lens, no journey
    journeyActive,  // In journey
    journeyComplete // Journey done
  }
}
```

This matches how NarrativeEngineContext currently works—some variables determine mode, others are just data.

### Consequences

**Positive:**
- Natural mapping from existing code
- States remain finite and manageable
- Context updates are simple assigns

**Negative:**
- Must keep context and state in sync
- Some derived state logic needed

---

## ADR-036: Guards as Pure Functions

### Status
Accepted

### Context
Guards determine whether transitions can occur. They need access to context to make decisions.

### Options Considered

1. **Inline guards** — Logic directly in machine definition
2. **Named guards** — Pure functions referenced by name
3. **Guard actions** — Actions that throw to prevent transition

### Decision
Use named guards as pure functions in separate file.

### Rationale
```typescript
// guards.ts
export const guards = {
  hasLens: ({ context }) => context.lens !== null,
  notAtEnd: ({ context }) => context.journeyProgress < context.journeyTotal - 1,
};

// machine.ts
createMachine({
  /* ... */
  on: {
    START_JOURNEY: { target: 'journeyActive', guard: 'hasLens' }
  }
}, { guards });
```

Benefits:
- Guards are testable in isolation
- Reusable across transitions
- Clear separation of concerns
- Self-documenting machine definition

### Consequences

**Positive:**
- Testable guards
- Reusable logic
- Clean machine definition

**Negative:**
- Extra indirection
- Guards file to maintain

---

## ADR-037: No React Integration in Epic 1

### Status
Accepted

### Context
We could immediately connect the machine to React via `useMachine`. This would allow immediate use but couples development cycles.

### Options Considered

1. **Immediate integration** — Connect to React in Epic 1
2. **Parallel development** — Machine isolated, integrate in Epic 5
3. **Adapter pattern** — Machine behind adapter from start

### Decision
Keep machine isolated in Epic 1. Integrate in Epic 5.

### Rationale
- Machine can be tested without React
- No risk of breaking existing functionality
- Clear boundary for each epic
- Unit tests are faster than E2E tests
- Migration can be paused without side effects

Epic sequence:
- Epic 1: Machine (isolated)
- Epics 2-4: Extract state concerns
- Epic 5: Assemble EngagementContext (React integration)
- Epic 6: Migrate consumers
- Epic 7: Delete legacy

### Consequences

**Positive:**
- Isolated testing
- Clear epic boundaries
- No risk to existing system

**Negative:**
- Delayed React integration
- Parallel systems during migration

---

## ADR-038: Testing Strategy for State Machine

### Status
Accepted

### Context
State machines need comprehensive testing. Unit tests can verify machine behavior without React or browser.

### Options Considered

1. **Unit tests only** — Test machine in isolation
2. **E2E tests only** — Test via browser
3. **Unit + E2E** — Both layers

### Decision
Unit tests for machine logic, E2E tests for user behavior. Unit tests verify:
- State transitions
- Guard conditions
- Context updates
- Event handling

E2E tests (existing) verify:
- User can select lens
- User can start journey
- Terminal opens/closes

### Test Pattern

```typescript
import { createActor } from 'xstate';
import { engagementMachine } from '../../src/core/engagement';

describe('Engagement Machine', () => {
  test('SELECT_LENS transitions from anonymous to lensActive', () => {
    const actor = createActor(engagementMachine);
    actor.start();
    
    expect(actor.getSnapshot().matches('session.anonymous')).toBe(true);
    
    actor.send({ type: 'SELECT_LENS', lens: 'engineer', source: 'selection' });
    
    expect(actor.getSnapshot().matches('session.lensActive')).toBe(true);
    expect(actor.getSnapshot().context.lens).toBe('engineer');
  });
});
```

### Consequences

**Positive:**
- Fast unit tests for machine logic
- E2E tests verify user experience
- Complete coverage at appropriate layers

**Negative:**
- Must maintain both test types
- Integration tests needed later (Epic 5)

---

## ADR-039: Health Check for Machine Validity

### Status
Accepted

### Context
Health system should verify machine is properly defined and exported. This catches import errors before runtime.

### Options Considered

1. **Module import check** — Verify exports exist
2. **Machine instantiation check** — Create actor, verify initial state
3. **Unit test reference** — Point to unit tests
4. **No health check** — Rely on build/tests

### Decision
Custom health check that imports module and verifies exports.

### Implementation

```javascript
// health-validator.js
async function executeEngagementMachineCheck(check) {
  try {
    const { engagementMachine } = await import('../src/core/engagement/index.js');
    if (!engagementMachine) {
      return { status: 'fail', message: 'Machine not exported' };
    }
    // Optionally verify initial state
    const { createActor } = await import('xstate');
    const actor = createActor(engagementMachine);
    actor.start();
    const snapshot = actor.getSnapshot();
    if (!snapshot.matches('session.anonymous')) {
      return { status: 'fail', message: 'Unexpected initial state' };
    }
    return { status: 'pass', message: 'Machine valid' };
  } catch (error) {
    return { status: 'fail', message: `Import failed: ${error.message}` };
  }
}
```

### Consequences

**Positive:**
- Health dashboard shows machine status
- Catches import/export errors
- Verifies basic functionality

**Negative:**
- Custom executor needed
- Maintains parity with unit tests
