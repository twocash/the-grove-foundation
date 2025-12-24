# Architectural Decision Records — Epic 6: Consumer Migration v2

## ADR-076: Dual Provider Architecture During Migration

### Status
Accepted

### Context
We need to migrate components from `useNarrativeEngine` to the new engagement hooks. During migration, both old and new systems must work simultaneously.

### Options Considered

1. **Dual providers** — `EngagementProvider` nested inside `NarrativeEngineProvider`
2. **Replace all at once** — Remove `NarrativeEngineProvider` entirely
3. **Bridge hook** — Single hook that delegates to both systems

### Decision
Use dual providers with `EngagementProvider` nested inside `NarrativeEngineProvider`.

### Rationale
- Components can access either system during transition
- No breaking changes to unmigrated components
- Clear migration path: move state access from old to new
- Minimal risk: if migration fails, old system still works

### Consequences

**Positive:**
- Incremental, safe migration
- Components can be migrated independently
- Easy rollback if issues arise

**Negative:**
- Slight overhead of two providers
- Potential for state divergence if both systems modify same data

**Neutral:**
- Extra import statements temporarily

---

## ADR-077: Full Component Migration Pattern

### Status
Accepted

### Context
When migrating a component, should we allow mixing old and new hooks for different state types, or require complete migration?

### Options Considered

1. **Full migration** — Component uses only one system for engagement state
2. **Mixed migration** — Component can use old hooks for some state, new for others
3. **Gradual migration** — State types migrate one at a time within components

### Decision
Require full migration per component. A component either uses old system entirely OR migrates all engagement state to new hooks.

### Rationale
- Prevents state divergence within single component
- Clearer mental model for developers
- Easier to verify migration is complete
- Reduces debugging complexity

### Consequences

**Positive:**
- No mixed state sources in one component
- Clear "before" and "after" states
- Easier testing

**Negative:**
- Terminal.tsx migration is larger scope
- Can't migrate just lens without journey/entropy

**Neutral:**
- Migration order matters less when migrating fully

---

## ADR-078: startJourney API Signature Change

### Status
Accepted

### Context
The old `startJourney(journeyId: string)` takes an ID. The new hook `startJourney(journey: Journey)` takes the full object.

### Options Considered

1. **Keep ID signature** — New hook accepts ID, looks up journey internally
2. **Change to object** — New hook requires full Journey object
3. **Support both** — Overload to accept ID or object

### Decision
New hook takes full Journey object. Components call `startJourney(getJourney(id)!)`.

### Rationale
- Keeps engagement hooks pure (no schema dependency)
- Schema access stays with NarrativeEngineContext
- Explicit is better than implicit
- Type safety: can't pass invalid ID

### Consequences

**Positive:**
- Clear separation: hooks manage state, context provides data
- Type-safe: invalid journey can't be started
- Testable: no need to mock schema in hook tests

**Negative:**
- Migration requires adding `getJourney()` lookup
- Slightly more verbose call site

**Neutral:**
- Pattern matches React Query and similar libraries

---

## ADR-079: Testing Strategy for Migration

### Status
Accepted

### Context
How do we verify the migration works without adding implementation-coupled tests?

### Options Considered

1. **Unit test hooks** — Already done in Epics 1-5 (152 tests)
2. **Integration tests** — Test hook + provider together
3. **E2E tests** — Test user-visible behavior
4. **All three** — Comprehensive but time-consuming

### Decision
Rely on existing 152 unit tests for hooks. Add minimal E2E tests that verify behavior after migration.

### Rationale
- Unit tests already validate hook behavior
- E2E tests verify integration without implementation coupling
- Avoid duplicate test coverage
- Focus on "does the migration work" not "does the code work"

### Test Categories

| Category | Tests | Purpose |
|----------|-------|---------|
| Unit | 152 (existing) | Hook isolation |
| E2E | ~3 (new) | Migration verification |

### Consequences

**Positive:**
- Minimal new test code
- Tests verify behavior, not implementation
- Fast test suite

**Negative:**
- Less granular feedback if E2E fails
- May miss subtle integration issues

**Neutral:**
- Existing tests provide baseline confidence

---

## ADR-080: Components Not Migrating

### Status
Accepted

### Context
Not all components using `useNarrativeEngine` need migration. Some use schema data only, not engagement state.

### Decision
Skip migration for components that only access schema, session, or utility functions:
- `NodeGrid.tsx` — schema only
- `LensInspector.tsx` — getEnabledPersonas only
- `JourneysModal.tsx` — schema.journeys only
- `SproutInspector.tsx` — session only

### Rationale
- These components don't use lens/journey/entropy state
- Migrating them adds risk with no benefit
- They can stay on old system until Epic 7 cleanup

### Consequences

**Positive:**
- Reduced migration scope
- Lower risk
- Faster delivery

**Negative:**
- Old system must remain available
- Some `useNarrativeEngine` usage persists

**Neutral:**
- These will migrate in Epic 7 when removing old system

---

## ADR-081: DEX Compliance

### Status
Accepted

### Context
Grove follows declarative architecture. The migration must maintain DEX compliance.

### Decision
Migration preserves declarative patterns:
- No new `handle*` callbacks for domain logic
- Behavior defined by state machine, not component code
- Components are pure consumers of state

### Compliance Checklist

- [x] State transitions defined in machine.ts
- [x] Components call actions, don't implement logic
- [x] No conditionals like `if (lens === 'engineer')`
- [x] Tests verify behavior, not implementation
