# Bedrock Event Architecture v1
## Foundation Sprint Specification

**Sprint Tier:** Foundation (Multi-sprint initiative)  
**Status:** Ready for Foundation Loop  
**Author:** Claude + Jim  
**Date:** January 4, 2026  
**Revision:** 3 (Telemetry Integration + Strategic Rationalization)

---

## Domain Contract

**Applicable contract:** `BEDROCK_SPRINT_CONTRACT.md` v1.1  
**Sprint type:** Core Infrastructure (not console development)  
**Note:** This sprint creates shared infrastructure in `src/core/events/` that both bedrock and legacy can consume. Per Section 6.3 of the contract, console-specific requirements are omitted.

---

## Constitutional Reference

- [x] Read: `The_Trellis_Architecture__First_Order_Directives.md`
- [x] Read: `Bedrock_Architecture_Specification.md`
- [x] Read: `Trellis_Architecture_Bedrock_Addendum.md`
- [x] Read: `src/core/schema/telemetry.ts` (existing event model foundation)

---

## DEX Compliance Matrix

### Feature: Event Sourcing Infrastructure

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| **Declarative Sovereignty** | ✅ Pass | Event types are schema-defined in TypeScript; projections are pure functions with no hidden state; event shape controlled by types, not imperative code |
| **Capability Agnosticism** | ✅ Pass | Events are model-agnostic data structures; projections work regardless of how events were generated; no LLM-specific assumptions in event types |
| **Provenance as Infrastructure** | ✅ Pass | Every event inherits `fieldId` + `timestamp` from MetricAttribution; event log preserves full history; cognitive archaeology built into data structure |
| **Organic Scalability** | ✅ Pass | New event types added to union without code changes; new projections consume same log structure; migration path preserves existing data |

**Blocking issues:** None

### Feature: Projection System

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| **Declarative Sovereignty** | ✅ Pass | Projection results are fully determined by event log input; no side effects; configuration via pure function composition |
| **Capability Agnosticism** | ✅ Pass | Projections derive state from events; no model dependency; works identically regardless of event source |
| **Provenance as Infrastructure** | ✅ Pass | All derived state traceable to source events; `projectToCumulativeMetricsV2()` maintains lineage to original telemetry types |
| **Organic Scalability** | ✅ Pass | New projections can be added without modifying event types; projection composition enables complex derived state |

**Blocking issues:** None

---

## Object Model Boundary Note

Per Section 4.4 of the Bedrock Sprint Contract:

**Events are NOT GroveObjects.** This sprint creates event types (`GroveEvent`), not persistent objects (`GroveObject`). Events record temporal occurrences; objects represent persistent entities. Events use `MetricAttribution` as their base type (provenance-first design). GroveObjects may be derived FROM events via projections, but events themselves are not subject to Section 4.1 requirements.

---

## Pattern Check (Phase 0)

### Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Event types | Pattern 3 (Schema System) | Event types defined in `src/core/events/types.ts` |
| Type validation | Zod schemas (established) | New schemas in `schema.ts` extending pattern |
| State derivation | Pattern 2 (Engagement Machine) | Projections replace XState context queries |
| Provenance | Pattern 7 (Object Model) - MetricAttribution | All events extend MetricAttribution |
| Telemetry | CumulativeMetricsV2 pattern | Extended to all events, backward compat via projection |

### New Patterns Proposed

**None.** All requirements are met by extending existing patterns:
- Event types extend `MetricAttribution` from telemetry.ts
- Projections follow the `computeMetrics()` pattern already in telemetry.ts
- Validation follows established Zod patterns

### Canonical Source Audit

| Capability | Canonical Home | Current Approach | Recommendation |
|------------|----------------|------------------|----------------|
| Event types | `src/core/events/types.ts` (new) | N/A (new capability) | **CREATE** |
| Telemetry types | `src/core/schema/telemetry.ts` | ✅ Extends existing | Keep |
| Projections | `src/core/events/projections/` (new) | N/A | **CREATE** |
| CumulativeMetricsV2 | `src/core/schema/telemetry.ts` | ✅ Preserved via projection | Keep |

### No Duplication Certification

This sprint does not duplicate existing capabilities. It extends the proven telemetry pattern to all engagement events while maintaining backward compatibility.

---

## Executive Summary

This specification extends Grove's existing DEX-compliant telemetry types into a unified event architecture. The core insight: **the telemetry types are the right foundation; the plumbing around them needs replacement.**

### Strategic Framing

| Keep (Right Rails) | Replace (Plumbing) |
|-------------------|-------------------|
| `MetricAttribution` base type | XState storing event arrays |
| `JourneyCompletion`, `TopicExploration`, `SproutCapture` | `useMoments` manual V2 construction |
| `CumulativeMetricsV2` structure | EngagementBus duplicate counters |
| `computeMetrics()` projection | Multiple persistence keys |
| Provenance on every record | 43 mixed event types |

### The Pattern That Works

```typescript
// EXISTING - This is correct
interface CumulativeMetricsV2 {
  journeyCompletions: JourneyCompletion[];  // Events, not counts
  topicExplorations: TopicExploration[];    // Events, not counts
  sproutCaptures: SproutCapture[];          // Events, not counts
}

// Counts DERIVED from events
function computeMetrics(metrics: CumulativeMetricsV2): ComputedMetrics {
  return {
    journeysCompleted: metrics.journeyCompletions.length,
    sproutsCaptured: metrics.sproutCaptures.length,
    topicsExplored: [...new Set(metrics.topicExplorations.map(t => t.topicId))],
  };
}
```

**This IS event sourcing.** We extend it to all events, not just cumulative metrics.

---

## Part 1: Current State Analysis

### 1.1 What's Right (Telemetry Foundation)

**Location:** `src/core/schema/telemetry.ts`

```typescript
// Base attribution - provenance on everything
interface MetricAttribution {
  fieldId: string;
  timestamp: number;
}

// Typed event records
interface JourneyCompletion extends MetricAttribution {
  journeyId: string;
  durationMs?: number;
  waypointsVisited?: number;
}

interface TopicExploration extends MetricAttribution {
  topicId: string;
  hubId: string;
  queryTrigger?: string;
}

interface SproutCapture extends MetricAttribution {
  sproutId: string;
  journeyId?: string;
  hubId?: string;
}
```

**Why this is right:**
- Every record has `fieldId` + `timestamp` (provenance)
- Typed records, not generic objects
- Arrays store events; counts are derived
- Aligns with DEX Pillar III: Provenance as Infrastructure

### 1.2 What's Wrong (Current Plumbing)

**Problem 1: XState as Event Store**

The engagement machine stores telemetry arrays in its context:
```typescript
// src/core/engagement/machine.ts
context: {
  journeyCompletions: JourneyCompletion[],
  topicExplorations: TopicExploration[],
  sproutCaptures: SproutCapture[],
  // ... plus 20+ other fields
}
```

State machines should manage state transitions, not be event stores.

**Problem 2: useMoments as Adapter**

```typescript
// src/surface/hooks/useMoments.ts (lines 72-81)
// Manual construction of CumulativeMetricsV2 from XState context
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

This hook is glue code. It shouldn't need to manually construct the V2 structure.

**Problem 3: Parallel Event Systems**

| System | Events | Storage | Truth |
|--------|--------|---------|-------|
| EngagementMachine | ~25 types | `grove-telemetry-*-v2` | Telemetry arrays |
| EngagementBus | ~18 types | `grove-engagement-state` | Counters |

Two systems tracking overlapping concerns with different storage.

**Problem 4: Event Type Explosion**

43+ event types mixing semantic and implementation:
```typescript
// Semantic (what happened)
'JOURNEY_COMPLETED'
'SPROUT_CAPTURED'

// Implementation (how to render)
'STREAM_CHUNK'
'FINALIZE_RESPONSE'
'SET_FLAG'
'SET_COOLDOWN'
```

### 1.3 The Adapter Problem Illustrated

**Today's flow for moment evaluation:**

```
XState Machine Context
    │
    ├── journeyCompletions[]  ─┐
    ├── topicExplorations[]   ─┼── useMoments manually constructs
    ├── sproutCaptures[]      ─┘   CumulativeMetricsV2
    │                                    │
    │                                    ▼
    │                             computeMetrics()
    │                                    │
    ├── entropy                          │
    ├── flags                            │
    ├── momentCooldowns                  ▼
    └── streamHistory ──────────▶ MomentEvaluationContext
                                         │
                                         ▼
                                getEligibleMoments()
```

**Go-forward flow:**

```
GroveEventLog (single source)
    │
    ▼
projectTelemetry()  ──────────▶  ComputedMetrics
projectContext()    ──────────▶  ContextState
projectMoments()    ──────────▶  MomentEvaluationContext
    │
    ▼
useMoments() just consumes projections
```

---

## Part 2: Proposed Architecture

### 2.1 Core Principle

**Keep the types. Replace the plumbing.**

```
TELEMETRY TYPES (keep)           PLUMBING (replace)
──────────────────               ─────────────────
MetricAttribution          →     XState context storage
JourneyCompletion          →     Manual V2 construction
TopicExploration           →     EngagementBus counters
SproutCapture              →     Multiple persistence keys
CumulativeMetricsV2        →     Adapter hooks
computeMetrics()           →     43 event types
```

### 2.2 Extended Base Type

```typescript
// src/core/events/types.ts

import { MetricAttribution } from '../schema/telemetry';

/**
 * Base for all Grove events.
 * Extends MetricAttribution with session scoping and type discriminant.
 */
interface GroveEventBase extends MetricAttribution {
  fieldId: string;    // From MetricAttribution
  timestamp: number;  // From MetricAttribution
  sessionId: string;  // NEW: Session scoping
  type: string;       // NEW: Event type discriminant
}
```

### 2.3 Event Categories

**Cumulative Events** (cross-session, extend existing types):
- `JOURNEY_COMPLETED` — extends `JourneyCompletion`
- `TOPIC_EXPLORED` — extends `TopicExploration`
- `INSIGHT_CAPTURED` — extends `SproutCapture`

**Session Events** (new, session-scoped):
- `SESSION_STARTED`, `SESSION_RESUMED`
- `LENS_ACTIVATED`
- `QUERY_SUBMITTED`, `RESPONSE_COMPLETED`
- `FORK_SELECTED`, `PIVOT_TRIGGERED`, `HUB_ENTERED`
- `JOURNEY_STARTED`, `JOURNEY_ADVANCED`
- `MOMENT_SURFACED`, `MOMENT_RESOLVED`

**Total: 15 semantic events** (down from 43)

### 2.4 Event Type Definitions

```typescript
// ─────────────────────────────────────────────────────────────────
// SESSION LIFECYCLE
// ─────────────────────────────────────────────────────────────────

interface SessionStartedEvent extends GroveEventBase {
  type: 'SESSION_STARTED';
  isReturning: boolean;
  previousSessionId?: string;
}

interface SessionResumedEvent extends GroveEventBase {
  type: 'SESSION_RESUMED';
  previousSessionId: string;
  minutesSinceLastActivity: number;
}

// ─────────────────────────────────────────────────────────────────
// LENS / PERSPECTIVE
// ─────────────────────────────────────────────────────────────────

interface LensActivatedEvent extends GroveEventBase {
  type: 'LENS_ACTIVATED';
  lensId: string;
  source: 'url' | 'selection' | 'system' | 'localStorage';
  isCustom: boolean;
}

// ─────────────────────────────────────────────────────────────────
// EXPLORATION STREAM
// ─────────────────────────────────────────────────────────────────

interface QuerySubmittedEvent extends GroveEventBase {
  type: 'QUERY_SUBMITTED';
  queryId: string;
  content: string;
  intent?: 'deep_dive' | 'pivot' | 'apply' | 'challenge';
  sourceResponseId?: string;
}

interface ResponseCompletedEvent extends GroveEventBase {
  type: 'RESPONSE_COMPLETED';
  responseId: string;
  queryId: string;
  hubId?: string;
  hasNavigation: boolean;
  spanCount: number;
}

interface ForkSelectedEvent extends GroveEventBase {
  type: 'FORK_SELECTED';
  forkId: string;
  forkType: 'deep_dive' | 'pivot' | 'apply' | 'challenge';
  label: string;
  responseId: string;
}

interface PivotTriggeredEvent extends GroveEventBase {
  type: 'PIVOT_TRIGGERED';
  conceptId: string;
  sourceText: string;
  responseId: string;
}

interface HubEnteredEvent extends GroveEventBase {
  type: 'HUB_ENTERED';
  hubId: string;
  source: 'query' | 'navigation' | 'pivot' | 'journey';
}

// ─────────────────────────────────────────────────────────────────
// JOURNEY LIFECYCLE
// ─────────────────────────────────────────────────────────────────

interface JourneyStartedEvent extends GroveEventBase {
  type: 'JOURNEY_STARTED';
  journeyId: string;
  lensId: string;
  waypointCount: number;
}

interface JourneyAdvancedEvent extends GroveEventBase {
  type: 'JOURNEY_ADVANCED';
  journeyId: string;
  waypointId: string;
  position: number;
}

// Extends existing telemetry type
interface JourneyCompletedEvent extends JourneyCompletion, GroveEventBase {
  type: 'JOURNEY_COMPLETED';
}

// ─────────────────────────────────────────────────────────────────
// CAPTURE (extends existing telemetry type)
// ─────────────────────────────────────────────────────────────────

interface InsightCapturedEvent extends SproutCapture, GroveEventBase {
  type: 'INSIGHT_CAPTURED';
}

// ─────────────────────────────────────────────────────────────────
// TOPIC EXPLORATION (extends existing telemetry type)
// ─────────────────────────────────────────────────────────────────

interface TopicExploredEvent extends TopicExploration, GroveEventBase {
  type: 'TOPIC_EXPLORED';
}

// ─────────────────────────────────────────────────────────────────
// MOMENT LIFECYCLE
// ─────────────────────────────────────────────────────────────────

interface MomentSurfacedEvent extends GroveEventBase {
  type: 'MOMENT_SURFACED';
  momentId: string;
  surface: string;
  priority: number;
}

interface MomentResolvedEvent extends GroveEventBase {
  type: 'MOMENT_RESOLVED';
  momentId: string;
  resolution: 'actioned' | 'dismissed';
  actionId?: string;
  actionType?: string;
}

// ─────────────────────────────────────────────────────────────────
// UNION TYPE
// ─────────────────────────────────────────────────────────────────

type GroveEvent =
  | SessionStartedEvent
  | SessionResumedEvent
  | LensActivatedEvent
  | QuerySubmittedEvent
  | ResponseCompletedEvent
  | ForkSelectedEvent
  | PivotTriggeredEvent
  | HubEnteredEvent
  | JourneyStartedEvent
  | JourneyAdvancedEvent
  | JourneyCompletedEvent
  | InsightCapturedEvent
  | TopicExploredEvent
  | MomentSurfacedEvent
  | MomentResolvedEvent;
```

### 2.5 Event Log Schema

```typescript
/**
 * GroveEventLog v3 — Unified event store
 * Extends CumulativeMetricsV2 pattern to all events
 */
interface GroveEventLog {
  version: 3;
  fieldId: string;
  
  // Session-scoped events (cleared on new session)
  currentSessionId: string;
  sessionEvents: GroveEvent[];
  
  // Cumulative events (persisted across sessions)
  // Direct extension of CumulativeMetricsV2 arrays
  cumulativeEvents: {
    journeyCompletions: JourneyCompletedEvent[];
    topicExplorations: TopicExploredEvent[];
    insightCaptures: InsightCapturedEvent[];
  };
  
  // Session tracking (from CumulativeMetricsV2)
  sessionCount: number;
  lastSessionAt: number;
}
```

### 2.6 Type Relationship Diagram

```
EXISTING TELEMETRY              PROPOSED EVENTS
──────────────────              ───────────────
MetricAttribution          ══▶  GroveEventBase (extends)
        │                              │
        ▼                              ▼
JourneyCompletion          ══▶  JourneyCompletedEvent (extends)
TopicExploration           ══▶  TopicExploredEvent (extends)
SproutCapture              ══▶  InsightCapturedEvent (extends)
        │                              │
        ▼                              ▼
CumulativeMetricsV2        ══▶  GroveEventLog.cumulativeEvents
        │                              │
        ▼                              ▼
computeMetrics()           ══▶  projectTelemetry()

Key: ══▶ means "extends/builds upon", not "replaces"
```

---

## Part 3: Projections

### 3.1 Core Principle

All state is **derived** from events. No stored state that isn't computable from the event log.

### 3.2 Telemetry Projection (Backward Compatible)

```typescript
// src/core/events/projections/telemetry.ts

import { CumulativeMetricsV2, ComputedMetrics, computeMetrics } from '../schema/telemetry';

/**
 * Project GroveEventLog to CumulativeMetricsV2
 * Maintains backward compatibility with existing consumers
 */
function projectToCumulativeMetricsV2(log: GroveEventLog): CumulativeMetricsV2 {
  return {
    version: 2,
    fieldId: log.fieldId,
    journeyCompletions: log.cumulativeEvents.journeyCompletions,
    topicExplorations: log.cumulativeEvents.topicExplorations,
    sproutCaptures: log.cumulativeEvents.insightCaptures,
    sessionCount: log.sessionCount,
    lastSessionAt: log.lastSessionAt,
  };
}

/**
 * Derive computed metrics using existing function
 */
function projectComputedMetrics(log: GroveEventLog): ComputedMetrics {
  const v2 = projectToCumulativeMetricsV2(log);
  return computeMetrics(v2);  // Reuse existing function!
}
```

### 3.3 Context Projection

```typescript
// src/core/events/projections/context.ts

import { ContextState } from '../context-fields/types';

function projectContext(log: GroveEventLog): ContextState {
  const session = projectSession(log.sessionEvents);
  const metrics = projectComputedMetrics(log);
  
  return {
    stage: computeStage(session.interactionCount, metrics),
    entropy: computeEntropy(log.sessionEvents),
    activeLensId: session.lensId,
    activeMoments: deriveActiveMoments(log.sessionEvents),
    interactionCount: session.interactionCount,
    topicsExplored: metrics.topicsExplored,
    sproutsCaptured: metrics.sproutsCaptured,
    offTopicCount: 0,
  };
}
```

### 3.4 Session Projection

```typescript
// src/core/events/projections/session.ts

interface SessionState {
  sessionId: string;
  fieldId: string;
  startedAt: number;
  isReturning: boolean;
  lensId: string | null;
  lensSource: string | null;
  interactionCount: number;
}

function projectSession(events: GroveEvent[]): SessionState {
  return events.reduce((state, event) => {
    switch (event.type) {
      case 'SESSION_STARTED':
        return { ...state, sessionId: event.sessionId, startedAt: event.timestamp, isReturning: event.isReturning };
      case 'LENS_ACTIVATED':
        return { ...state, lensId: event.lensId, lensSource: event.source };
      case 'QUERY_SUBMITTED':
        return { ...state, interactionCount: state.interactionCount + 1 };
      default:
        return state;
    }
  }, INITIAL_SESSION_STATE);
}
```

### 3.5 Moment Evaluation Projection

```typescript
// src/core/events/projections/moments.ts

import { MomentEvaluationContext } from '../engagement/moment-evaluator';

/**
 * Project event log to MomentEvaluationContext
 * Replaces manual construction in useMoments
 */
function projectMomentContext(log: GroveEventLog): MomentEvaluationContext {
  const session = projectSession(log.sessionEvents);
  const metrics = projectComputedMetrics(log);
  const context = projectContext(log);
  
  return {
    stage: context.stage,
    exchangeCount: session.interactionCount,
    journeysCompleted: metrics.journeysCompleted,
    sproutsCaptured: metrics.sproutsCaptured,
    topicsExplored: metrics.topicsExplored,
    entropy: context.entropy,
    minutesActive: computeMinutesActive(session.startedAt),
    sessionCount: log.sessionCount,
    activeLens: session.lensId,
    activeJourney: deriveActiveJourney(log.sessionEvents),
    hasCustomLens: deriveHasCustomLens(log.sessionEvents),
    flags: deriveFlags(log.sessionEvents),
    momentCooldowns: deriveCooldowns(log.sessionEvents),
  };
}
```

### 3.6 The useMoments Transformation

**Before (adapter):**
```typescript
// 15 lines of manual construction
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
// ... then build MomentEvaluationContext manually
```

**After (consumer):**
```typescript
// 1 line - projection does the work
const momentContext = useMomentContext();
```

---

## Part 4: File Structure

```
src/core/events/
├── types.ts              # Event type definitions (extends telemetry)
├── schema.ts             # Zod validation schemas
├── store.ts              # GroveEventLog management
├── dispatch.ts           # Event dispatch with middleware
├── projections/
│   ├── index.ts          # Re-exports
│   ├── session.ts        # Session state projection
│   ├── context.ts        # Context state projection
│   ├── telemetry.ts      # CumulativeMetricsV2 compatibility
│   ├── moments.ts        # MomentEvaluationContext projection
│   └── stream.ts         # Stream/conversation projection
├── hooks/
│   ├── index.ts
│   ├── useGroveEvents.ts # Provider + context
│   ├── useDispatch.ts    # Event dispatch hook
│   ├── useSession.ts     # Session state hook
│   ├── useContext.ts     # Context state hook (replaces adapter)
│   ├── useTelemetry.ts   # Telemetry hook
│   └── useMomentContext.ts # Moment evaluation hook
├── compat.ts             # Backward compatibility layer
├── migration.ts          # V2 → V3 migration
└── __tests__/
    ├── projections.test.ts
    ├── migration.test.ts
    └── integration.test.ts
```

---

## Part 5: Migration Strategy

### 5.1 From CumulativeMetricsV2

```typescript
// src/core/events/migration.ts

function migrateFromCumulativeMetricsV2(v2: CumulativeMetricsV2): GroveEventLog {
  return {
    version: 3,
    fieldId: v2.fieldId,
    currentSessionId: generateSessionId(),
    sessionEvents: [],  // Start fresh for session events
    cumulativeEvents: {
      // Extend existing records with type discriminant
      journeyCompletions: v2.journeyCompletions.map(jc => ({
        ...jc,
        type: 'JOURNEY_COMPLETED' as const,
        sessionId: 'migrated',
      })),
      topicExplorations: v2.topicExplorations.map(te => ({
        ...te,
        type: 'TOPIC_EXPLORED' as const,
        sessionId: 'migrated',
      })),
      insightCaptures: v2.sproutCaptures.map(sc => ({
        ...sc,
        type: 'INSIGHT_CAPTURED' as const,
        sessionId: 'migrated',
      })),
    },
    sessionCount: v2.sessionCount,
    lastSessionAt: v2.lastSessionAt,
  };
}
```

### 5.2 Strangler Fig Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│ Genesis / Terminal Marketing Routes                          │
│ ─────────────────────────────────────────                   │
│ UNCHANGED - Continue using EngagementBus + EngagementMachine │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Bedrock / Explore Routes                                     │
│ ─────────────────────────────────────────                   │
│ NEW SYSTEM - src/core/events/*                              │
│ Clean event sourcing built on telemetry foundation           │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 6: Sprint Breakdown

### Sprint 1: `bedrock-event-schema-v1` (This Sprint)

**Goal:** Define event types and build core infrastructure

**Deliverables:**
- [ ] Event types extending MetricAttribution
- [ ] Zod validation schemas
- [ ] GroveEventLog schema
- [ ] Projection functions (pure, tested)
- [ ] Migration from CumulativeMetricsV2
- [ ] 90%+ test coverage

**NOT in scope:** React hooks, route integration

### Sprint 2: `bedrock-event-hooks-v1`

- React context provider
- Optimized projection hooks
- DevTools for event inspection

### Sprint 3: `bedrock-event-integration-v1`

- Wire to explore route
- Feature flag for switch-over
- Backward compatibility verification

### Sprint 4: `kinetic-suggested-prompts-v1` (Deferred)

- Now trivial on clean foundation

---

## Part 7: Acceptance Criteria

### P0: Must Have

- [ ] Event types extend MetricAttribution
- [ ] Existing telemetry types preserved and extended
- [ ] 15 semantic event types defined
- [ ] GroveEventLog backward compatible with CumulativeMetricsV2
- [ ] Projection functions are pure and tested
- [ ] Migration from V2 preserves all data
- [ ] 90%+ coverage on projections

### P1: Should Have

- [ ] Zod validation for all events
- [ ] Type guards for discrimination
- [ ] Event factory functions

### P2: Nice to Have

- [ ] Event schema versioning
- [ ] Compression for long sessions

---

## Part 8: Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Event types | 43+ (overlapping) | 15 (semantic) |
| Event system files | 1,122 lines | ~600 lines |
| Adapter hooks | 3+ (useContextState, useMoments glue) | 0 |
| Persistence keys | 4+ | 2 |
| Test coverage | ~40% | 90%+ |

---

## Part 9: Key Design Decisions

### D1: Extend MetricAttribution, Don't Replace

**Decision:** All events extend `MetricAttribution`

**Rationale:** Proven pattern, maintains provenance, backward compatible

### D2: Cumulative vs Session Event Separation

**Decision:** Separate storage for cross-session vs session-scoped events

**Rationale:** Different lifecycles, cumulative = cognitive archaeology

### D3: Projections Over Stored State

**Decision:** All state derived from events via pure projections

**Rationale:** Single source of truth, testable, DEX-compliant

### D4: Backward Compatibility via Projection

**Decision:** `projectToCumulativeMetricsV2()` enables gradual migration

**Rationale:** Existing consumers (useMoments, moment-evaluator) work unchanged

---

## Appendix: Advisory Council Alignment

| Advisor | Weight | Alignment |
|---------|--------|-----------|
| **Park (10)** | Event sourcing = clean memory architecture |
| **Benet (10)** | Append-only log = IPFS-compatible pattern |
| **Adams (8)** | Events tell exploration story |
| **Short (8)** | Good foundation for diary generation |
| **Asparouhova (7)** | Clean architecture = easier contribution |
| **Vallor (6)** | Provenance built-in, traceable |

---

*This specification builds on Grove's existing DEX-compliant telemetry foundation. The types are right; we're fixing the plumbing.*
