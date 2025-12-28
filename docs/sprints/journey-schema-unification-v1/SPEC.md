# Specification: Journey Schema Unification

**Sprint:** journey-schema-unification-v1  
**Date:** 2024-12-28  
**Status:** APPROVED FOR EXECUTION

---

## Problem Statement

The Grove codebase contains two incompatible `Journey` type definitions:

1. **Canonical** (`src/core/schema/journey.ts`): Has `waypoints[]`, required by XState
2. **Legacy** (`data/narratives-schema.ts`): Has `entryNode` + separate `JourneyNode[]`

When code paths accidentally pass a legacy Journey to the XState machine, the application crashes:

```
Uncaught TypeError: Cannot read properties of undefined (reading 'length')
    at machine.ts: event.journey.waypoints.length
```

This violates the **Declarative Sovereignty** principle: domain expertise (Journey structure) is split between two schemas, making it impossible for a non-technical person to reason about journeys.

---

## Goals

### G1: Single Source of Truth
Establish `src/core/schema/journey.ts` as the **canonical** Journey type. All code paths that start a journey via XState MUST use this type.

### G2: Clean Boundary
Create an adapter layer that converts legacy schema journeys to canonical format at the API/data boundary—not scattered throughout UI components.

### G3: Deprecation Path
Mark the legacy Journey type as `@deprecated` with clear migration guidance, enabling future removal.

### G4: Test Coverage
Add integration test proving: click journey pill → XState state === 'journeyActive' with correct waypoint count.

### G5: DEX Compliance
The result must satisfy the Declarative Sovereignty test:
> "Can a non-technical person alter journey behavior by editing a schema file?"

Answer: Yes, by editing `src/data/journeys/index.ts` (the TypeScript registry).

---

## Non-Goals

### NG1: Full Legacy Removal
We are NOT removing the legacy schema in this sprint. NarrativeEngine still uses it for cards, nodes, and other non-journey data. We're only unifying the Journey type.

### NG2: API Changes
We are NOT changing the `/api/narrative` response format. The adapter converts at the consumer side.

### NG3: Journey Content Changes
We are NOT modifying journey content (waypoints, prompts, etc.). This is purely a type unification.

### NG4: JourneyList UI Overhaul
The JourneyList component can continue using legacy data for display. It only needs canonical type when calling `engStartJourney()`.

---

## Acceptance Criteria

### AC1: Type Safety
```
✅ TypeScript compilation succeeds with no Journey type errors
✅ All engStartJourney() calls receive Journey with waypoints[]
✅ No || fallback patterns mixing legacy and canonical lookups
```

### AC2: Runtime Verification
```
✅ Click journey pill → console shows [XState] journey.waypoints.length = N
✅ No "Cannot read properties of undefined" errors
✅ XState state transitions to 'journeyActive'
```

### AC3: Test Coverage
```
✅ Integration test exists: journey-click.spec.ts
✅ Test verifies: pill click → engStartJourney() called with valid Journey
✅ Test verifies: XState context.journeyTotal > 0
```

### AC4: Deprecation Markers
```
✅ Legacy Journey type has @deprecated JSDoc
✅ Deprecation message includes migration path
✅ getJourney() from NarrativeEngine marked @deprecated
```

### AC5: Documentation
```
✅ ADR documents the unification decision
✅ DEVLOG captures execution steps
✅ No orphaned code comments referencing old patterns
```

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Journey type definitions | 2 | 1 canonical + 1 deprecated |
| Lookup functions for XState | 2 mixed | 1 unified |
| Runtime crashes on journey click | Yes | No |
| Integration test coverage | 0% | 100% for click path |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking JourneyList display | Medium | Low | Keep legacy for display, adapt for XState only |
| Missing a lookup call site | Medium | High | Comprehensive grep + TypeScript errors catch it |
| CognitiveBridge regression | High | Medium | Specific test case for entropy-triggered journey |
| Build failure | Low | High | Run `npm run build` after each file change |

---

## Dependencies

- XState machine structure is frozen (no changes to machine.ts)
- TypeScript registry has all 6 journeys populated
- Build pipeline functional

---

## Out of Scope (Future Sprints)

1. Removing legacy Journey type entirely
2. Migrating NarrativeEngine to canonical types
3. API response format changes
4. Journey content/waypoint additions

---

*Specification complete. Proceed to ARCHITECTURE.md*
