# Architecture Decision Records: Journey Schema Unification

**Sprint:** journey-schema-unification-v1  
**Date:** 2024-12-28

---

## ADR-001: Canonical Journey Type Location

### Context
Two Journey type definitions exist:
- `src/core/schema/journey.ts` - Has waypoints[], used by XState
- `data/narratives-schema.ts` - Has entryNode, used by NarrativeEngine

XState crashes when receiving the legacy type because it expects `waypoints.length`.

### Decision
**`src/core/schema/journey.ts` is the canonical Journey type.**

Rationale:
1. XState machine is the critical path (crashes without waypoints)
2. The schema/journey.ts type is more expressive (embedded waypoints vs separate nodes)
3. TypeScript registry already uses this type with 6 populated journeys
4. Aligns with Trellis principle: exploration logic in declarative config

### Consequences
- Legacy type must be adapted at boundary
- NarrativeEngine consumers need migration path
- Future journey additions go to TypeScript registry

### Alternatives Rejected

**Option B: Make XState accept both types**
- Rejected: Violates Capability Agnosticism (machine should be strict validator)

**Option C: Unify on legacy type, add waypoints**
- Rejected: Would require API changes and break NarrativeEngine consumers

---

## ADR-002: Adapter Pattern vs Type Merge

### Context
Need to handle legacy journeys that only exist in NarrativeEngine schema (not TypeScript registry).

### Decision
**Create adapter function that converts legacy → canonical at the boundary.**

```typescript
adaptLegacyJourney(legacy: LegacyJourney, nodes: JourneyNode[]): Journey
```

Rationale:
1. Single point of conversion (not scattered || fallbacks)
2. Explicit transformation logic (auditable)
3. Logging at boundary reveals data quality issues
4. Follows "rigid frame" principle from DEX Capability Agnosticism

### Consequences
- New file: `src/core/schema/journey-adapter.ts`
- Adapter must handle missing nodes gracefully
- Console warnings reveal schema gaps

### Alternatives Rejected

**Option B: Duck typing with runtime checks**
```typescript
if ('waypoints' in journey) { ... } else { ... }
```
- Rejected: Spreads type ambiguity throughout codebase

**Option C: Union type Journey | LegacyJourney**
- Rejected: Every consumer would need type guards

---

## ADR-003: Unified Lookup Service

### Context
Multiple lookup patterns exist:
- `getJourneyById()` - TypeScript registry
- `getJourney()` - NarrativeEngine hook
- `schema?.journeys?.[id]` - Direct schema access

### Decision
**Create single `getCanonicalJourney()` service that always returns canonical type.**

Priority:
1. TypeScript registry (preferred, has waypoints)
2. Schema + adapter (fallback for legacy journeys)

Rationale:
1. Single call site pattern for all consumers
2. Eliminates || fallback chains
3. Registry-first aligns with "TypeScript registry is source of truth"
4. Adapter fallback provides migration path

### Consequences
- New file: `src/core/journey/service.ts`
- All journey-starting code uses same function
- Easy to audit (grep for getCanonicalJourney)

### Alternatives Rejected

**Option B: Enhance getJourneyById() with fallback**
- Rejected: Mixes registry concern with schema concern

**Option C: Require all journeys in registry**
- Rejected: Would block dynamic/user-created journeys (future feature)

---

## ADR-004: Deprecation Strategy

### Context
Legacy Journey type cannot be removed immediately (NarrativeEngine uses it for cards, nodes, hubs).

### Decision
**Mark legacy Journey as @deprecated with migration guidance, but do not remove.**

```typescript
/**
 * @deprecated Use Journey from src/core/schema/journey.ts
 * Migration: Use getCanonicalJourney() from src/core/journey/service.ts
 */
export interface Journey { ... }
```

Rationale:
1. IDE warnings guide developers to canonical type
2. Existing code continues to work
3. Clear migration path documented in deprecation message
4. Removal can happen in future sprint after full migration

### Consequences
- TypeScript will show deprecation warnings (not errors)
- Developers guided toward canonical type
- Legacy type removal tracked as tech debt

---

## ADR-005: Test Strategy

### Context
No integration tests exist for the journey click → XState flow. The bug was discovered in production.

### Decision
**Add integration test that verifies the complete flow.**

Test coverage:
1. Click journey pill → engStartJourney() called with valid Journey
2. XState state transitions to 'journeyActive'
3. context.journeyTotal equals waypoints.length
4. Adapter path works for legacy-only journeys

Rationale:
1. Catches type mismatches at test time, not production
2. Documents expected behavior
3. Regression prevention

### Consequences
- New file: `__tests__/integration/journey-click.spec.ts`
- CI pipeline catches future type regressions
- Test serves as executable documentation

---

*Decisions complete. Proceed to SPRINTS.md*
