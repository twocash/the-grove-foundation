# Bedrock Event Architecture v1
## Comprehensive Specification Draft (Revised)

**Sprint Tier:** Foundation (Multi-sprint initiative)  
**Status:** Draft for Review (Rev 2 - Telemetry Integration)  
**Author:** Claude + Jim  
**Date:** January 4, 2026

---

## Executive Summary

This specification proposes extending Grove's existing DEX-compliant telemetry pattern to become a unified event architecture for bedrock/explore routes. Rather than building a new event system from scratch, we recognize that **the telemetry system already implements event sourcing correctly** and extend that proven pattern.

### The Insight

The `CumulativeMetricsV2` system already does event sourcing:

```typescript
// EXISTING PATTERN (src/core/schema/telemetry.ts)
interface CumulativeMetricsV2 {
  journeyCompletions: JourneyCompletion[];  // Events, not counts
  topicExplorations: TopicExploration[];    // Events, not counts
  sproutCaptures: SproutCapture[];          // Events, not counts
}

// Counts are DERIVED from event arrays
function computeMetrics(metrics: CumulativeMetricsV2): ComputedMetrics {
  return {
    journeysCompleted: metrics.journeyCompletions.length,
    // ...
  };
}
```

**The solution:** Extend this pattern to ALL events, not just cumulative metrics.

### The Problem

Grove currently operates two parallel event systems:

| System | Telemetry Approach | Gap |
|--------|-------------------|-----|
| EngagementMachine | CumulativeMetricsV2 (event arrays) ✅ | Only cross-session metrics |
| EngagementBus | Raw counters + event history | Duplicates, doesn't use provenance pattern |

Both systems track similar things differently. The machine has the right pattern for metrics; we need to extend it to session events.

### The Solution

1. **Recognize `MetricAttribution` as the base event type**
2. **Extend to session-scoped events** (stream, navigation, pivots)
3. **Unify under single `GroveEventLog`**
4. **Derive ALL state from event log** (projections)

---

## Part 1: Existing Telemetry Foundation

### 1.1 MetricAttribution — The Base Pattern

```typescript
// src/core/schema/telemetry.ts — EXISTING
interface MetricAttribution {
  fieldId: string;   // Multi-field support
  timestamp: number; // Unix ms
}
```

This is the foundation. Every telemetry record has provenance.

### 1.2 Existing Metric Types

```typescript
// JourneyCompletion — EXISTING
interface JourneyCompletion extends MetricAttribution {
  journeyId: string;
  durationMs?: number;
  waypointsVisited?: number;
}

// TopicExploration — EXISTING
interface TopicExploration extends MetricAttribution {
  topicId: string;
  hubId: string;
  queryTrigger?: string;
}

// SproutCapture — EXISTING
interface SproutCapture extends MetricAttribution {
  sproutId: string;
  journeyId?: string;
  hubId?: string;
}
```

### 1.3 CumulativeMetricsV2 — The Event Store Pattern

```typescript
// src/core/schema/telemetry.ts — EXISTING
interface CumulativeMetricsV2 {
  version: 2;
  fieldId: string;
  journeyCompletions: JourneyCompletion[];   // Event array
  topicExplorations: TopicExploration[];     // Event array
  sproutCaptures: SproutCapture[];           // Event array
  sessionCount: number;
  lastSessionAt: number;
}
```

**This IS event sourcing.** The arrays ARE the event log. Counts are derived.

### 1.4 Current Flow

```
EngagementMachine
    │
    ├── JOURNEY_COMPLETED_TRACKED event
    │       ↓
    │   journeyCompletions.push(completion)
    │       ↓
    │   persistMetrics() → localStorage
    │
    └── useMoments reads context
            ↓
        constructs CumulativeMetricsV2
            ↓
        computeMetrics() → derived counts
            ↓
        MomentEvaluationContext
```

### 1.5 What's Missing

The pattern works for **cumulative metrics** but NOT for:

| Event Category | Current Storage | Problem |
|----------------|-----------------|---------|
| Stream events | `streamHistory[]` in machine | Not persisted, no provenance |
| Navigation | `USER.SELECT_FORK` | Processed but not logged |
| Pivots | `USER.CLICK_PIVOT` | Processed but not logged |
| Lens changes | Machine state | Not event-logged |
| Session lifecycle | EngagementBus | Separate system |

---

## Part 2: Proposed Extension

### 2.1 Extended Base Type

```typescript
// src/core/events/types.ts — NEW

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

### 2.2 Event Categories

**Cumulative Events** (cross-session, already exist):
- `JOURNEY_COMPLETED` — JourneyCompletion
- `TOPIC_EXPLORED` — TopicExploration  
- `INSIGHT_CAPTURED` — SproutCapture

**Session Events** (new, session-scoped):
- `SESSION_STARTED`
- `SESSION_RESUMED`
- `LENS_ACTIVATED`
- `QUERY_SUBMITTED`
- `RESPONSE_COMPLETED`
- `FORK_SELECTED`
- `PIVOT_TRIGGERED`
- `HUB_ENTERED`
- `JOURNEY_STARTED`
- `JOURNEY_ADVANCED`
- `MOMENT_SURFACED`
- `MOMENT_RESOLVED`

### 2.3 Full Event Type Definitions

```typescript
// src/core/events/types.ts

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
  sourceResponseId?: string;  // If from fork selection
}

interface ResponseCompletedEvent extends GroveEventBase {
  type: 'RESPONSE_COMPLETED';
  responseId: string;
  queryId: string;
  hubId?: string;           // Which hub answered
  hasNavigation: boolean;   // Did response include forks
  spanCount: number;        // Rhetorical spans detected
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

// Reuse existing type with extension
interface JourneyCompletedEvent extends JourneyCompletion, GroveEventBase {
  type: 'JOURNEY_COMPLETED';
}

// ─────────────────────────────────────────────────────────────────
// CAPTURE
// ─────────────────────────────────────────────────────────────────

// Reuse existing type with extension
interface InsightCapturedEvent extends SproutCapture, GroveEventBase {
  type: 'INSIGHT_CAPTURED';
}

// ─────────────────────────────────────────────────────────────────
// TOPIC EXPLORATION
// ─────────────────────────────────────────────────────────────────

// Reuse existing type with extension
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
  // Session
  | SessionStartedEvent
  | SessionResumedEvent
  // Lens
  | LensActivatedEvent
  // Stream
  | QuerySubmittedEvent
  | ResponseCompletedEvent
  | ForkSelectedEvent
  | PivotTriggeredEvent
  | HubEnteredEvent
  // Journey
  | JourneyStartedEvent
  | JourneyAdvancedEvent
  | JourneyCompletedEvent
  // Capture
  | InsightCapturedEvent
  | TopicExploredEvent
  // Moments
  | MomentSurfacedEvent
  | MomentResolvedEvent;
```

### 2.4 Event Log Schema

```typescript
// src/core/events/types.ts

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
  // These replace the arrays in CumulativeMetricsV2
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

### 2.5 Relationship to Existing Types

```
EXISTING                          PROPOSED
────────                          ────────
MetricAttribution        ──────▶  GroveEventBase (extends)

JourneyCompletion        ──────▶  JourneyCompletedEvent (extends)
TopicExploration         ──────▶  TopicExploredEvent (extends)
SproutCapture            ──────▶  InsightCapturedEvent (extends)

CumulativeMetricsV2      ──────▶  GroveEventLog.cumulativeEvents
                                  (backward compatible)
```

---

## Part 3: Projections (State Derivation)

### 3.1 Core Principle

State is **always derived** from the event log. No stored state that isn't computable from events.

### 3.2 Session Projection

```typescript
// src/core/events/projections/session.ts

interface SessionState {
  sessionId: string;
  fieldId: string;
  startedAt: number;
  isReturning: boolean;
  lensId: string | null;
  lensSource: string | null;
  minutesActive: number;
  interactionCount: number;
}

function projectSession(events: GroveEvent[]): SessionState {
  return events.reduce((state, event) => {
    switch (event.type) {
      case 'SESSION_STARTED':
        return {
          ...state,
          sessionId: event.sessionId,
          fieldId: event.fieldId,
          startedAt: event.timestamp,
          isReturning: event.isReturning,
        };
      case 'LENS_ACTIVATED':
        return {
          ...state,
          lensId: event.lensId,
          lensSource: event.source,
        };
      case 'QUERY_SUBMITTED':
        return {
          ...state,
          interactionCount: state.interactionCount + 1,
        };
      default:
        return state;
    }
  }, INITIAL_SESSION_STATE);
}
```

### 3.3 Context Projection (Replaces useContextState Adapter)

```typescript
// src/core/events/projections/context.ts

import { Stage, ContextState } from '../context-fields/types';

function projectContext(
  sessionEvents: GroveEvent[],
  cumulativeEvents: GroveEventLog['cumulativeEvents']
): ContextState {
  const session = projectSession(sessionEvents);
  
  // Derive stage from interaction count (matches existing logic)
  const stage = computeStage(session.interactionCount, cumulativeEvents);
  
  // Derive entropy from exploration patterns
  const entropy = computeEntropy(sessionEvents);
  
  // Derive topics from cumulative explorations
  const topicsExplored = [...new Set(
    cumulativeEvents.topicExplorations.map(e => e.topicId)
  )];
  
  // Derive active moments from recent events
  const activeMoments = deriveActiveMoments(sessionEvents);
  
  return {
    stage,
    entropy,
    activeLensId: session.lensId,
    activeMoments,
    interactionCount: session.interactionCount,
    topicsExplored,
    sproutsCaptured: cumulativeEvents.insightCaptures.length,
    offTopicCount: 0, // TODO: Track
  };
}
```

### 3.4 Stream Projection

```typescript
// src/core/events/projections/stream.ts

import { StreamItem, QueryStreamItem, ResponseStreamItem } from '../schema/stream';

interface StreamState {
  items: StreamItem[];
  currentQueryId: string | null;
  isAwaitingResponse: boolean;
}

function projectStream(events: GroveEvent[]): StreamState {
  const items: StreamItem[] = [];
  let currentQueryId: string | null = null;
  
  for (const event of events) {
    switch (event.type) {
      case 'QUERY_SUBMITTED':
        items.push({
          id: event.queryId,
          type: 'query',
          content: event.content,
          timestamp: event.timestamp,
          role: 'user',
          createdBy: 'user',
          intent: event.intent,
        });
        currentQueryId = event.queryId;
        break;
        
      case 'RESPONSE_COMPLETED':
        // Mark response complete (content comes from elsewhere)
        currentQueryId = null;
        break;
    }
  }
  
  return {
    items,
    currentQueryId,
    isAwaitingResponse: currentQueryId !== null,
  };
}
```

### 3.5 Telemetry Projection (Backward Compatible)

```typescript
// src/core/events/projections/telemetry.ts

import { CumulativeMetricsV2, ComputedMetrics, computeMetrics } from '../schema/telemetry';

/**
 * Project GroveEventLog to CumulativeMetricsV2 for backward compatibility
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
 * Derive computed metrics (for moment evaluation)
 */
function projectComputedMetrics(log: GroveEventLog): ComputedMetrics {
  const v2 = projectToCumulativeMetricsV2(log);
  return computeMetrics(v2);
}
```

---

## Part 4: Integration with Existing Systems

### 4.1 Backward Compatibility Layer

```typescript
// src/core/events/compat.ts

/**
 * Emit event to both new system and legacy EngagementMachine
 * Used during migration period
 */
function emitWithCompat(
  newDispatch: (event: GroveEvent) => void,
  legacySend: (event: EngagementEvent) => void,
  event: GroveEvent
): void {
  // Emit to new system
  newDispatch(event);
  
  // Map to legacy event if applicable
  const legacyEvent = mapToLegacyEvent(event);
  if (legacyEvent) {
    legacySend(legacyEvent);
  }
}

function mapToLegacyEvent(event: GroveEvent): EngagementEvent | null {
  switch (event.type) {
    case 'LENS_ACTIVATED':
      return { type: 'SELECT_LENS', lens: event.lensId, source: event.source };
    case 'JOURNEY_STARTED':
      return { type: 'START_JOURNEY', journey: { id: event.journeyId, ... } };
    case 'INSIGHT_CAPTURED':
      return { type: 'SPROUT_CAPTURED', sproutId: event.sproutId, ... };
    // ...
    default:
      return null;
  }
}
```

### 4.2 Migration from CumulativeMetricsV2

```typescript
// src/core/events/migration.ts

function migrateFromCumulativeMetricsV2(
  v2: CumulativeMetricsV2
): GroveEventLog {
  return {
    version: 3,
    fieldId: v2.fieldId,
    currentSessionId: generateSessionId(),
    sessionEvents: [],  // Start fresh for session
    cumulativeEvents: {
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

---

## Part 5: File Structure

```
src/core/events/
├── types.ts              # Event type definitions (extends telemetry)
├── schema.ts             # Zod validation schemas
├── store.ts              # GroveEventLog management
├── dispatch.ts           # Event dispatch with middleware
├── projections/
│   ├── index.ts          # Re-exports
│   ├── session.ts        # Session state projection
│   ├── context.ts        # Context state (replaces adapter)
│   ├── stream.ts         # Stream/conversation projection
│   └── telemetry.ts      # CumulativeMetricsV2 compatibility
├── hooks/
│   ├── index.ts
│   ├── useGroveEvents.ts # Provider + context
│   ├── useDispatch.ts    # Event dispatch hook
│   ├── useSession.ts     # Session state hook
│   ├── useContext.ts     # Context state hook
│   └── useStream.ts      # Stream state hook
├── compat.ts             # Backward compatibility layer
├── migration.ts          # V2 → V3 migration
└── __tests__/
    ├── projections.test.ts
    ├── migration.test.ts
    └── integration.test.ts
```

---

## Part 6: Sprint Plan

### Sprint 1: `bedrock-event-schema-v1` (This Sprint)

**Goal:** Define event types and build core infrastructure

**Deliverables:**
- [ ] Event type definitions extending MetricAttribution
- [ ] Zod validation schemas for all events
- [ ] GroveEventLog schema
- [ ] Projection functions (pure, tested)
- [ ] Migration utility from CumulativeMetricsV2
- [ ] 90%+ test coverage

**NOT in scope:**
- React hooks (Sprint 2)
- Integration with explore route (Sprint 3)
- Legacy system deprecation (future)

### Sprint 2: `bedrock-event-hooks-v1`

- React context provider
- Optimized hooks with memoization
- DevTools for event inspection

### Sprint 3: `bedrock-event-integration-v1`

- Wire to explore route
- Feature flag for switch-over
- Backward compatibility during transition

### Sprint 4: `kinetic-suggested-prompts-v1` (Deferred)

- Now trivial: useContext() → NavigationBlock
- No adapter needed

---

## Part 7: Acceptance Criteria

### P0: Must Have

- [ ] Event types extend MetricAttribution (proven base)
- [ ] All existing telemetry types preserved (JourneyCompletion, etc.)
- [ ] Session events defined (13 types)
- [ ] GroveEventLog schema backward compatible with CumulativeMetricsV2
- [ ] Projection functions are pure and tested
- [ ] Migration from V2 works without data loss
- [ ] 90%+ coverage on projections

### P1: Should Have

- [ ] Zod validation for all event types
- [ ] Type guards for event discrimination
- [ ] Event factory functions with validation

### P2: Nice to Have

- [ ] Event schema versioning
- [ ] Event compression for long sessions

---

## Part 8: Key Design Decisions

### D1: Extend MetricAttribution, Don't Replace

**Decision:** All events extend `MetricAttribution` from telemetry.ts

**Rationale:** 
- Pattern is proven (CumulativeMetricsV2 works)
- Maintains provenance infrastructure
- Backward compatible

### D2: Cumulative vs Session Events

**Decision:** Separate storage for cumulative (persist forever) vs session (clear on new session)

**Rationale:**
- Different lifecycle requirements
- Cumulative events are the "cognitive archaeology" 
- Session events can grow large, need cleanup

### D3: Projections, Not Stored State

**Decision:** All state derived from events via projection functions

**Rationale:**
- Single source of truth
- Easy testing (given events, expect state)
- Enables time-travel debugging
- Matches DEX "Provenance as Infrastructure"

### D4: Backward Compatibility Layer

**Decision:** During migration, emit to both systems

**Rationale:**
- Genesis/terminal routes unchanged
- No big-bang cutover
- Can verify parity before switching

---

## Appendix A: Event Count Comparison

| Current System | Count | Proposed | Count |
|----------------|-------|----------|-------|
| EngagementBus events | ~18 | → Merged into | 15 |
| EngagementMachine events | ~25 | → Semantic only | |
| **Total unique** | **~43** | **Total** | **15** |

**Reduction:** 43 → 15 event types (65% reduction)

---

## Appendix B: Telemetry System Alignment

The proposed architecture treats the existing telemetry system as the **foundation**, not something to replace:

```
EXISTING TELEMETRY              PROPOSED EVENTS
──────────────────              ───────────────
MetricAttribution          ══▶  GroveEventBase
        │                              │
        ▼                              ▼
JourneyCompletion          ══▶  JourneyCompletedEvent
TopicExploration           ══▶  TopicExploredEvent
SproutCapture              ══▶  InsightCapturedEvent
        │                              │
        ▼                              ▼
CumulativeMetricsV2        ══▶  GroveEventLog.cumulativeEvents
        │                              │
        ▼                              ▼
computeMetrics()           ══▶  projectTelemetry()
```

**Key:** `══▶` means "extends/builds upon", not "replaces"

---

*This specification builds on Grove's existing DEX-compliant telemetry foundation rather than proposing a parallel system.*
