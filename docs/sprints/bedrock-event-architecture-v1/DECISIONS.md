# Bedrock Event Architecture v1 — Decisions

**Sprint:** bedrock-event-architecture-v1  
**Phase:** 5 (Architectural Decision Records)  
**Generated:** January 4, 2026  
**Author:** Claude + Foundation Loop

---

## ADR Index

| ID | Title | Status |
|----|-------|--------|
| ADR-001 | Extend MetricAttribution, Don't Replace | Accepted |
| ADR-002 | Separate Cumulative vs Session Events | Accepted |
| ADR-003 | Projections Over Stored State | Accepted |
| ADR-004 | Backward Compatibility via Projection | Accepted |
| ADR-005 | Zod for Runtime Validation | Accepted |
| ADR-006 | Strangler Fig Migration Pattern | Accepted |
| ADR-007 | 15 Semantic Events from 43 | Accepted |
| ADR-008 | Test-First Development with 90% Coverage Target | Accepted |

---

## ADR-001: Extend MetricAttribution, Don't Replace

### Status
Accepted

### Context
Grove has existing telemetry types in `src/core/schema/telemetry.ts` that already implement event sourcing principles:
- `MetricAttribution` provides `fieldId` + `timestamp` (provenance)
- `JourneyCompletion`, `TopicExploration`, `SproutCapture` extend the base
- `CumulativeMetricsV2` stores event arrays
- `computeMetrics()` derives counts from events

We need to decide whether to build a new event system or extend the existing one.

### Decision
**Extend MetricAttribution** as the base type for all Grove events. Add `type` (discriminant) and `sessionId` (session scoping) to create `GroveEventBase`.

### Rationale

**Why extend rather than replace:**

1. **Proven Pattern:** The existing types have been in production without issues
2. **DEX Compliance:** MetricAttribution already satisfies Pillar III (Provenance as Infrastructure)
3. **Type Safety:** Existing consumers expect `MetricAttribution` fields; extending preserves this
4. **Migration Simplicity:** Existing cumulative data can be migrated by adding fields, not transforming structure

**Rejected Alternative: New Base Type**

We could have created `GroveEventBase` from scratch:
```typescript
interface GroveEventBase {
  id: string;
  type: string;
  timestamp: number;
  sessionId: string;
  // ... no relation to MetricAttribution
}
```

This was rejected because:
- Breaks type compatibility with existing telemetry
- Loses the proven `fieldId` scoping
- Requires converting existing data rather than extending it

### Consequences

**Positive:**
- Type safety with existing telemetry consumers
- Smooth migration path
- Single provenance pattern across all events

**Negative:**
- `fieldId` is conceptually "grove" for now; may need extension for multi-tenant
- Slight redundancy (timestamp exists in multiple places during migration)

---

## ADR-002: Separate Cumulative vs Session Events

### Status
Accepted

### Context
Grove tracks two categories of data:
1. **Session data:** Current lens, active journey, recent queries (ephemeral)
2. **Cumulative data:** Journeys completed, topics explored, sprouts captured (persistent)

We need to decide how to organize these in the event log.

### Decision
**Separate storage arrays** in `GroveEventLog`:
- `sessionEvents: GroveEvent[]` — Cleared on new session
- `cumulativeEvents: { journeyCompletions: [], topicExplorations: [], insightCaptures: [] }` — Persisted forever

### Rationale

**Different lifecycles require different handling:**

| Aspect | Session Events | Cumulative Events |
|--------|---------------|-------------------|
| Lifecycle | Single session | Cross-session |
| Size | <100 per session | Grows forever |
| Reset | Clear on new session | Never cleared |
| Purpose | Derive current state | Cognitive archaeology |

**Why not a single array?**

A single array would require filtering on every projection:
```typescript
// Inefficient
const journeyCompletions = allEvents.filter(e => e.type === 'JOURNEY_COMPLETED');
```

With separate arrays:
```typescript
// Direct access
const journeyCompletions = log.cumulativeEvents.journeyCompletions;
```

**Advisory Council Alignment:**
- **Park (10):** Memory retrieval degrades with scale; indexing by category is essential
- **Short (8):** Cumulative events enable diary generation; separate storage enables efficient querying

### Consequences

**Positive:**
- Efficient projection performance
- Clear data lifecycle semantics
- Backward compatible with CumulativeMetricsV2 structure

**Negative:**
- Some events (JOURNEY_COMPLETED) exist in both session and cumulative
- Slightly more complex dispatch logic

---

## ADR-003: Projections Over Stored State

### Status
Accepted

### Context
Traditional state management stores computed state:
```typescript
context: {
  interactionCount: 5,
  entropy: 0.7,
  stage: 'exploring'
}
```

Event sourcing derives state from events:
```typescript
function projectContext(events): ContextState {
  const interactionCount = events.filter(e => e.type === 'QUERY_SUBMITTED').length;
  const entropy = computeEntropy(events);
  const stage = computeStage(interactionCount, metrics);
  return { interactionCount, entropy, stage };
}
```

### Decision
**All state is derived from events via pure projection functions.** No stored state that isn't computable from the event log.

### Rationale

**Benefits of projection-based state:**

1. **Single Source of Truth:** The event log IS the state; projections are views
2. **Testability:** Pure functions are trivial to test
3. **Time Travel:** Can reconstruct state at any point by replaying events
4. **Debugging:** State issues trace to events, not mutation bugs

**DEX Alignment:**
- **Pillar III (Provenance):** State change = event; event = traceable record
- **Pillar I (Declarative):** Projections are configuration of how to interpret events

**Rejected Alternative: Stored + Projected Hybrid**

We could store frequently-accessed state and project the rest. This was rejected because:
- Creates two sources of truth that can drift
- Complicates debugging ("is this stored or projected?")
- XState's current approach shows the problems with this pattern

### Consequences

**Positive:**
- Predictable, reproducible state
- Easy to test
- Natural audit trail

**Negative:**
- Projection cost on every access (mitigated by memoization)
- Learning curve for contributors used to imperative state

---

## ADR-004: Backward Compatibility via Projection

### Status
Accepted

### Context
Existing code depends on `CumulativeMetricsV2` and `ComputedMetrics`:
- `useMoments.ts` constructs V2 manually
- `moment-evaluator.ts` expects MomentEvaluationContext
- Potentially other consumers we haven't mapped

We need to ensure migration doesn't break existing functionality.

### Decision
**Provide `projectToCumulativeMetricsV2(log)` projection** that converts `GroveEventLog` to the legacy format. Existing consumers can use this during gradual migration.

### Rationale

**Strangler Fig in Action:**
```
New System                Old Consumers
     │                         │
     ▼                         ▼
GroveEventLog ──► projectToCumulativeMetricsV2() ──► useMoments
                                                         │
                                                         ▼
                                                  moment-evaluator
```

Old consumers continue working without modification. As they're updated to use new projections, the compatibility layer can be removed.

**Implementation:**
```typescript
function projectToCumulativeMetricsV2(log: GroveEventLog): CumulativeMetricsV2 {
  return {
    version: 2,
    fieldId: log.fieldId,
    journeyCompletions: log.cumulativeEvents.journeyCompletions,
    topicExplorations: log.cumulativeEvents.topicExplorations,
    sproutCaptures: log.cumulativeEvents.insightCaptures,  // Note: rename
    sessionCount: log.sessionCount,
    lastSessionAt: log.lastSessionAt,
  };
}
```

### Consequences

**Positive:**
- Zero breaking changes in Sprint 1
- Gradual migration possible
- Existing tests continue passing

**Negative:**
- Temporary code duplication during migration
- Must maintain compat layer until all consumers updated

---

## ADR-005: Zod for Runtime Validation

### Status
Accepted

### Context
Event data comes from multiple sources:
- User actions (trusted)
- localStorage (could be corrupted/tampered)
- Migration from old formats (could have unexpected shape)

TypeScript provides compile-time safety but not runtime validation.

### Decision
**Use Zod schemas for all event types** with `validateEvent()` and `validateEventLog()` functions.

### Rationale

**Why Zod specifically:**

| Feature | Zod | io-ts | yup |
|---------|-----|-------|-----|
| TypeScript inference | ✅ Excellent | ✅ Good | ⚠️ Manual |
| Bundle size | ~12kb | ~7kb | ~20kb |
| Discriminated unions | ✅ Native | ⚠️ Complex | ❌ No |
| Error messages | ✅ Detailed | ⚠️ Technical | ✅ Good |
| Grove usage | ✅ Already used | ❌ No | ❌ No |

**Implementation pattern:**
```typescript
const GroveEventSchema = z.discriminatedUnion('type', [
  SessionStartedEventSchema,
  LensActivatedEventSchema,
  // ...
]);

function validateEvent(data: unknown): GroveEvent {
  return GroveEventSchema.parse(data);
}
```

**Where validation runs:**
- On dispatch (validates before appending to log)
- On load from localStorage (validates persisted data)
- On migration (validates transformed data)

### Consequences

**Positive:**
- Runtime safety for all event data
- Detailed error messages for debugging
- Type inference from schemas

**Negative:**
- Bundle size impact (~12kb)
- Validation overhead (mitigated: only on write/load, not read)

---

## ADR-006: Strangler Fig Migration Pattern

### Status
Accepted

### Context
Grove has two active branches with different architectural approaches:
- **main/genesis:** Legacy engagement system (XState + EngagementBus)
- **bedrock:** New clean-room implementation

We need to migrate without breaking production.

### Decision
**Use Strangler Fig pattern** with clear boundaries:

```
Legacy Zone (unchanged):           Bedrock Zone (new system):
├── Routes: /, /surface/*          ├── Routes: /explore/*, /foundation/*
├── Systems: EngagementMachine     ├── Systems: GroveEventLog
└── Storage: grove-*-v2            └── Storage: grove-event-log-v3
```

### Rationale

**Strangler Fig Benefits:**
1. **No Big Bang:** Production continues working
2. **Clear Boundaries:** Easy to reason about what uses what
3. **Reversible:** Can roll back by removing new code
4. **Gradual:** Routes migrate one at a time

**Boundary Enforcement:**
- ESLint rule: No `engagement/machine` imports in bedrock routes
- TypeScript path aliases for clean imports
- Code review checklist item

**Advisory Council Alignment:**
- **Benet (10):** "Bootstrapping with centralization is acceptable if the path to decentralization is documented"
- **Asparouhova (7):** Clear migration milestones prevent scope creep

### Consequences

**Positive:**
- Zero production risk
- Clear migration path
- Testable boundaries

**Negative:**
- Temporary code duplication
- Must maintain two systems during migration

---

## ADR-007: 15 Semantic Events from 43

### Status
Accepted

### Context
Current engagement system has 43+ event types mixing:
- Semantic events (JOURNEY_COMPLETED)
- Implementation events (STREAM_CHUNK, SET_FLAG)
- State transitions (OPEN_TERMINAL, CLOSE_TERMINAL)

### Decision
**Consolidate to 15 semantic event types:**

| Category | Events | Count |
|----------|--------|-------|
| Session | SESSION_STARTED, SESSION_RESUMED | 2 |
| Lens | LENS_ACTIVATED | 1 |
| Exploration | QUERY_SUBMITTED, RESPONSE_COMPLETED, FORK_SELECTED, PIVOT_TRIGGERED, HUB_ENTERED | 5 |
| Journey | JOURNEY_STARTED, JOURNEY_ADVANCED, JOURNEY_COMPLETED | 3 |
| Capture | INSIGHT_CAPTURED, TOPIC_EXPLORED | 2 |
| Moments | MOMENT_SURFACED, MOMENT_RESOLVED | 2 |
| **Total** | | **15** |

### Rationale

**What we're removing:**

| Old Event | Reason for Removal | New Approach |
|-----------|-------------------|--------------|
| STREAM_CHUNK | Implementation detail | No event; component state |
| FINALIZE_RESPONSE | Implementation detail | RESPONSE_COMPLETED |
| SET_FLAG | Imperative state | Derive from events |
| SET_COOLDOWN | Imperative state | Derive from MOMENT_RESOLVED |
| OPEN_TERMINAL | UI state | Route-based, no event |
| PIVOT_CLICKED | Duplicate | PIVOT_TRIGGERED |

**Event naming convention:**
- Past tense: Something happened (COMPLETED, CAPTURED)
- Passive voice: Focus on what, not who (ACTIVATED, SUBMITTED)

### Consequences

**Positive:**
- Cleaner event log
- Easier to reason about state
- Better for cognitive archaeology

**Negative:**
- Some granularity lost (no per-chunk events)
- Migration must map old events to new

---

## ADR-008: Test-First Development with 90% Coverage Target

### Status
Accepted

### Context
Current engagement system has ~40% test coverage. Telemetry types have 0% coverage. This sprint introduces new foundational code that everything else will depend on.

### Decision
**Target 90%+ coverage** on all Sprint 1 deliverables. Write tests for:
- All event type definitions (type guards)
- All Zod schemas (valid/invalid cases)
- All projection functions (exhaustive scenarios)
- Migration function (data integrity)

### Rationale

**Why 90%?**
- Projections are pure functions → trivial to test
- Foundation code must be reliable; bugs here cascade
- Event sourcing benefits from time-travel debugging; tests enable this

**Test strategy by file:**

| File | Test Type | Focus |
|------|-----------|-------|
| types.ts | Type tests | Discriminant narrowing |
| schema.ts | Unit tests | Validation acceptance/rejection |
| projections/*.ts | Unit tests | Output correctness |
| migration.ts | Integration tests | Data integrity |

**Coverage exclusions:**
- Index files (re-exports only)
- Type definitions (tested via usage)

### Consequences

**Positive:**
- High confidence in foundation code
- Easy refactoring
- Documentation via tests

**Negative:**
- Higher initial time investment
- Must maintain tests as code evolves

---

*Generated by Foundation Loop Phase 5*
