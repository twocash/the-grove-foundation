# Architectural Decision Records: Inspector Surface v1

**Sprint:** `inspector-surface-v1`  
**Date:** 2024-12-26

---

## ADR-013: Surface Abstraction Pattern

### Context
The Inspector currently has tight coupling between React components and data operations (hooks, stores). This makes it difficult to:
- Test components in isolation
- Swap rendering implementations
- Maintain A2UI optionality

### Decision
**Extract InspectorSurface interface as abstraction layer**

Components consume the surface via React Context rather than directly importing hooks.

### Rationale
- Single interface defines the contract
- Implementations can be swapped (React now, A2UI later)
- Testing simplified (mock the surface, not individual hooks)
- Documents the implicit contract that already exists

### Consequences
- New abstraction layer (~265 lines)
- Components refactored to use context (~50 lines changed)
- Small runtime overhead (context lookup)
- Clear migration path for future renderers

---

## ADR-014: Single Interface vs Split Interfaces

### Context
The InspectorSurface interface could be:
- A) Single interface with all operations
- B) Split into DataBindingSurface, ActionSurface, VersioningSurface

### Decision
**Single InspectorSurface interface**

### Rationale
- Simpler mental model
- Most consumers need multiple concerns
- Can split later if needed (interface segregation)
- A2UI uses single application concept

### Consequences
- One interface to implement
- One context to provide
- May grow over time (monitor complexity)

---

## ADR-015: React Context for Injection

### Context
Surface instance could be provided via:
- A) React Context (provider/consumer pattern)
- B) Props drilling
- C) Module-level singleton

### Decision
**React Context with provider**

### Rationale
- Idiomatic React pattern
- Cleaner than prop drilling through component tree
- Allows different surfaces per subtree (testing)
- Provider handles lifecycle (init/dispose)

### Consequences
- Components must be within provider
- Context lookup on each render (minimal overhead)
- Clear ownership of surface lifecycle

---

## ADR-016: Class-Based Implementation

### Context
ReactInspectorSurface could be:
- A) A class with methods
- B) A hook returning an object
- C) A plain object with functions

### Decision
**Class-based implementation**

### Rationale
- Clear instance lifecycle (constructor, dispose)
- Encapsulates state without React re-render concerns
- Methods can reference `this` for internal state
- Easier to test in isolation

### Consequences
- Not a hook (can't use other hooks directly inside)
- Provider creates instance, manages lifecycle
- State changes notify React via callback

---

## ADR-017: Hook Wrapping Strategy

### Context
ReactInspectorSurface needs access to existing hook functionality. Options:
- A) Surface wraps hooks, accesses their state
- B) Create new hooks that consume surface
- C) Surface owns all state, hooks become obsolete

### Decision
**Surface coordinates with hooks via composition**

The surface manages its own state and calls into the VersionedObjectStore directly. Copilot functionality is integrated via action dispatch.

### Rationale
- Minimal disruption to existing code
- Hooks remain available for gradual migration
- Surface doesn't depend on hook internals
- Clear ownership boundaries

### Consequences
- Some parallel state management during transition
- Copilot hook integration via action handlers
- Can fully migrate hooks to surface in future sprint

---

## ADR-018: A2UI Mapping Documentation

### Context
We want to preserve A2UI optionality. How do we document the mapping?

### Decision
**JSDoc comments on interface methods**

Each method includes an "A2UI:" note explaining the equivalent concept.

### Rationale
- Documentation lives with code
- Developers see mapping while implementing
- No separate document to maintain
- Searchable in IDE

### Consequences
- Longer JSDoc comments
- Mapping visible in generated docs
- Easy to update as A2UI evolves

---

## Decision Summary

| ADR | Decision | Key Consequence |
|-----|----------|-----------------|
| ADR-013 | Surface abstraction | Single interface for all Inspector ops |
| ADR-014 | Single interface | Simpler than split; can segregate later |
| ADR-015 | React Context | Idiomatic injection pattern |
| ADR-016 | Class implementation | Clear lifecycle, testable |
| ADR-017 | Composition strategy | Surface coordinates, doesn't replace hooks |
| ADR-018 | JSDoc mapping | A2UI notes in code comments |

---

*Canonical location: `docs/sprints/inspector-surface-v1/DECISIONS.md`*
