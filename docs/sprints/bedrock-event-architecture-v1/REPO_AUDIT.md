# Bedrock Event Architecture v1 — Repository Audit

**Sprint:** bedrock-event-architecture-v1  
**Phase:** 1 (Repository Audit)  
**Generated:** January 4, 2026  
**Auditor:** Claude + Foundation Loop

---

## Executive Summary

This audit validates the SPEC.md assessment: Grove's telemetry types (`MetricAttribution`, `JourneyCompletion`, `TopicExploration`, `SproutCapture`) are DEX-compliant and serve as the correct foundation for event sourcing. The issues lie in the plumbing—XState context acting as event store, adapter hooks manually constructing V2 structures, and overlapping event systems.

**Verdict:** Extend existing telemetry types. Replace current dispatch/storage mechanisms.

---

## 1. Telemetry Foundation (The Right Rails)

### 1.1 Source of Truth

**File:** `src/core/schema/telemetry.ts` (79 lines)

| Type | Purpose | DEX Compliance |
|------|---------|----------------|
| `MetricAttribution` | Base provenance (fieldId + timestamp) | ✅ Pillar III |
| `JourneyCompletion` | Journey event with optional duration | ✅ Extends base |
| `TopicExploration` | Topic event with hub context | ✅ Extends base |
| `SproutCapture` | Capture event with journey/hub context | ✅ Extends base |
| `CumulativeMetricsV2` | Event arrays + session tracking | ✅ Event sourcing pattern |
| `computeMetrics()` | Pure projection function | ✅ Derivation, not storage |

**Assessment:** This is already event sourcing in miniature. The spec correctly identifies these as "keep" artifacts.

### 1.2 Type Relationships

```
MetricAttribution (base)
├── JourneyCompletion
├── TopicExploration
└── SproutCapture
         ↓
CumulativeMetricsV2 (container)
         ↓
computeMetrics() (projection)
```

---

## 2. Engagement Machine Analysis (The Plumbing Problem)

### 2.1 File Locations

| File | Lines | Purpose |
|------|-------|---------|
| `src/core/engagement/machine.ts` | 474 | XState machine + actions |
| `src/core/engagement/types.ts` | 123 | Context + event types |
| `src/core/engagement/persistence.ts` | ~100 | localStorage operations |
| `src/core/engagement/index.ts` | ~50 | Re-exports |

### 2.2 Current Event Types (43+ Identified)

**Session Events:**
- `SELECT_LENS`, `CHANGE_LENS`
- `SESSION_STARTED`
- `OPEN_TERMINAL`, `CLOSE_TERMINAL`

**Journey Events:**
- `START_JOURNEY`, `ADVANCE_STEP`, `COMPLETE_JOURNEY`, `EXIT_JOURNEY`
- `JOURNEY_COMPLETED_TRACKED`

**Stream Events:**
- `START_QUERY`, `START_RESPONSE`, `STREAM_CHUNK`, `FINALIZE_RESPONSE`
- `USER.CLICK_PIVOT`, `USER.SELECT_FORK`

**Metric Events:**
- `SPROUT_CAPTURED`, `TOPIC_EXPLORED`
- `MOMENT_SHOWN`, `MOMENT_ACTIONED`, `MOMENT_DISMISSED`

**State Events:**
- `UPDATE_ENTROPY`
- `SET_FLAG`, `SET_COOLDOWN`, `CLEAR_FLAGS`, `CLEAR_COOLDOWNS`
- `HUB_VISITED`, `PIVOT_CLICKED`, `RESET_HUB_TRACKING`

### 2.3 Anti-Patterns Identified

| Anti-Pattern | Location | Impact |
|--------------|----------|--------|
| XState as event store | `machine.ts` context | State machine != database |
| Mixed concerns in context | `types.ts` EngagementContext | 50+ fields spanning domains |
| Manual V2 construction | `useMoments.ts` | Adapter code that shouldn't exist |
| Action-based persistence | `persistMetrics` action | Side effects in machine |
| Imperative state accumulation | Multiple `assign()` calls | Context grows unbounded |

### 2.4 Context Bloat Evidence

**EngagementContext fields (50+ fields):**

```typescript
// Domain 1: Lens
lens, lensSource, hasCustomLens

// Domain 2: Journey
journey, journeyProgress, journeyTotal

// Domain 3: Stream
currentStreamItem, streamHistory

// Domain 4: Entropy
entropy, entropyThreshold, hubsVisited, lastHubId, consecutiveHubRepeats, pivotCount

// Domain 5: Moments
flags, momentCooldowns

// Domain 6: Session
sessionStartedAt, sessionCount

// Domain 7: Telemetry (THE CORRECT PATTERN)
journeyCompletions[], topicExplorations[], sproutCaptures[]
```

**Assessment:** Domain 7 (telemetry) is correct. Domains 1-6 should derive from events.

---

## 3. Persistence Layer Analysis

### 3.1 Storage Keys Identified

| Key Pattern | Content | System |
|-------------|---------|--------|
| `grove-telemetry-*-v2` | CumulativeMetricsV2 | Engagement Machine |
| `grove-engagement-state` | Counters + flags | EngagementBus |
| `grove-lens-*` | Lens state | Legacy |
| `grove-sprouts-*` | Sprout storage | SproutStorage |

### 3.2 Persistence Functions

**File:** `src/core/engagement/persistence.ts`

- `setCumulativeMetricsV2()` — Writes telemetry (correct pattern)
- `getCumulativeMetricsV2()` — Reads telemetry (correct pattern)
- `getHydratedContextOverrides()` — Populates XState context (adapter)

---

## 4. Consumer Analysis

### 4.1 useMoments Hook (Primary Consumer)

**File:** `src/surface/hooks/useMoments.ts`

**Current behavior (lines 72-81):**
```typescript
const metricsV2: CumulativeMetricsV2 = {
  version: 2,
  fieldId: 'grove',
  journeyCompletions: xstateContext.journeyCompletions,
  topicExplorations: xstateContext.topicExplorations,
  sproutCaptures: xstateContext.sproutCaptures,
  sessionCount: xstateContext.sessionCount,
  lastSessionAt: Date.now(),
};
const computed = computeMetrics(metricsV2);
```

**Assessment:** This is pure adapter code. After refactor, useMoments should import a projection, not construct V2.

### 4.2 Other Consumers

| Consumer | Reads | Purpose |
|----------|-------|---------|
| `useTelemetryMetrics` | XState context | Dashboard metrics |
| `moment-evaluator` | MomentEvaluationContext | Moment eligibility |
| `EngagementBus` | localStorage | Legacy counter system |

---

## 5. Pattern Catalog Mapping

### 5.1 Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Event types | Pattern 7 (Object Model) | GroveEventBase extends MetricAttribution |
| State derivation | Pattern 2 (Engagement Machine) | Projections from event log |
| Type definitions | Pattern 3 (Schema System) | New types in `src/core/events/types.ts` |
| Validation | Zod schemas | New schemas in `src/core/events/schema.ts` |

### 5.2 New Patterns Proposed

**Pattern: Event Log with Projections**

This is NOT a parallel system—it's the correct implementation of what CumulativeMetricsV2 already does, extended to all state.

**DEX Compliance:**
- **Declarative Sovereignty:** Event types defined in schema, projections are configuration
- **Capability Agnosticism:** Works regardless of event source (user, AI, system)
- **Provenance:** Every event has fieldId + timestamp + sessionId
- **Organic Scalability:** New events extend base type; new projections compose existing ones

---

## 6. Test Coverage Assessment

### 6.1 Current Coverage

| Component | Unit Tests | E2E Tests | Coverage |
|-----------|------------|-----------|----------|
| `telemetry.ts` | ❌ None | ❌ None | 0% |
| `engagement/machine.ts` | ⚠️ Partial | ⚠️ Partial | ~40% |
| `useMoments.ts` | ❌ None | ❌ None | 0% |

### 6.2 Coverage Gaps (Sprint Target: 90%+)

- Event type validation
- Projection functions (pure functions → easy to test)
- Migration from V2 → V3
- Edge cases (empty log, malformed events)

---

## 7. File Impact Summary

### 7.1 Files to Create

```
src/core/events/
├── types.ts              # Event type definitions
├── schema.ts             # Zod validation
├── store.ts              # GroveEventLog management
├── dispatch.ts           # Event dispatch
├── projections/
│   ├── index.ts
│   ├── session.ts
│   ├── context.ts
│   ├── telemetry.ts      # Backward compatibility
│   ├── moments.ts
│   └── stream.ts
├── hooks/
│   ├── index.ts
│   ├── useGroveEvents.ts
│   ├── useDispatch.ts
│   ├── useSession.ts
│   ├── useContext.ts
│   ├── useTelemetry.ts
│   └── useMomentContext.ts
├── compat.ts             # V2 compatibility layer
├── migration.ts          # V2 → V3 migration
└── __tests__/
    ├── projections.test.ts
    ├── migration.test.ts
    └── integration.test.ts
```

### 7.2 Files to Modify

| File | Change | Risk |
|------|--------|------|
| `useMoments.ts` | Import projection instead of constructing V2 | Low |
| `moment-evaluator.ts` | Accept projected context | Low |
| Route providers | Add EventProvider | Medium |

### 7.3 Files Untouched (Strangler Fig Boundary)

| File | Reason |
|------|--------|
| `engagement/machine.ts` | Legacy routes still use it |
| `EngagementBus` | Legacy routes |
| Genesis/Terminal marketing | Not in scope |

---

## 8. Risk Assessment

### 8.1 Technical Risks

| Risk | Mitigation |
|------|-----------|
| Type conflicts | Extend, don't replace; use `Omit<>` if needed |
| Migration data loss | V2 → V3 migration is lossless; test extensively |
| Performance | Projection memoization; lazy computation |

### 8.2 Scope Risks

| Risk | Mitigation |
|------|-----------|
| Scope creep to hooks | Sprint 1 is types + projections ONLY |
| Integration complexity | Feature flag for switch-over |

---

## 9. DEX Compliance Verification

| Pillar | Status | Evidence |
|--------|--------|----------|
| Declarative Sovereignty | ✅ | Event types in schema, not code |
| Capability Agnosticism | ✅ | Works with any event source |
| Provenance as Infrastructure | ✅ | Every event has fieldId + timestamp |
| Organic Scalability | ✅ | New events extend base type |

---

## 10. Recommendation

**Proceed with Sprint 1: `bedrock-event-schema-v1`**

The audit confirms:
1. Telemetry types are correct foundation
2. Event explosion (43 → 15) is achievable via consolidation
3. No blockers identified
4. Clear strangler fig boundaries

**Next Phase:** Architecture document defining target state.

---

*Generated by Foundation Loop Phase 1*
