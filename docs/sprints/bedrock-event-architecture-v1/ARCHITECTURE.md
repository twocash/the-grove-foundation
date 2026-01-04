# Bedrock Event Architecture v1 — Architecture

**Sprint:** bedrock-event-architecture-v1  
**Phase:** 3 (Architecture)  
**Generated:** January 4, 2026  
**Architect:** Claude + Foundation Loop

---

## 1. Design Philosophy

### 1.1 Core Principle

> **Keep the types. Replace the plumbing.**

Grove's telemetry types (`MetricAttribution`, `JourneyCompletion`, etc.) already implement event sourcing in miniature. This architecture extends that pattern to all engagement state.

### 1.2 DEX Alignment

| DEX Pillar | Implementation |
|------------|----------------|
| Declarative Sovereignty | Event types defined in schema; projections are configuration |
| Capability Agnosticism | Events record what happened, not how to render it |
| Provenance as Infrastructure | Every event has `fieldId`, `timestamp`, `sessionId` |
| Organic Scalability | New events extend base type; new projections compose existing |

---

## 2. Type Hierarchy

### 2.1 Base Event Type

```typescript
// src/core/events/types.ts

import type { MetricAttribution } from '../schema/telemetry';

/**
 * Base type for all Grove events.
 * Extends MetricAttribution with session scoping and type discriminant.
 */
export interface GroveEventBase extends MetricAttribution {
  // From MetricAttribution
  fieldId: string;
  timestamp: number;
  
  // Added for event discrimination
  type: string;
  sessionId: string;
}
```

### 2.2 Type Inheritance Diagram

```
MetricAttribution (existing)
├── fieldId: string
└── timestamp: number
         │
         ▼
GroveEventBase (new)
├── fieldId: string      ← inherited
├── timestamp: number    ← inherited
├── type: string         ← added (discriminant)
└── sessionId: string    ← added (session scope)
         │
    ┌────┴────┐
    ▼         ▼
Session    Cumulative
Events     Events
    │         │
    │    ┌────┼────┐
    │    ▼    ▼    ▼
    │  Journey Topic Insight
    │  Completed Explored Captured
    │    │    │    │
    │    │    │    └── extends SproutCapture
    │    │    └── extends TopicExploration
    │    └── extends JourneyCompletion
    │
    ├── SessionStarted
    ├── LensActivated
    ├── QuerySubmitted
    ├── ResponseCompleted
    └── ... (session-scoped events)
```

### 2.3 Event Categories

**Session Events** (cleared on new session):
| Event | Purpose | Key Fields |
|-------|---------|------------|
| `SESSION_STARTED` | Session initialization | `isReturning`, `previousSessionId` |
| `SESSION_RESUMED` | Return from inactivity | `minutesSinceLastActivity` |
| `LENS_ACTIVATED` | Lens selection | `lensId`, `source`, `isCustom` |
| `QUERY_SUBMITTED` | User query | `queryId`, `content`, `intent` |
| `RESPONSE_COMPLETED` | AI response finalized | `responseId`, `spanCount`, `hasNavigation` |
| `FORK_SELECTED` | Fork navigation | `forkId`, `forkType`, `label` |
| `PIVOT_TRIGGERED` | Pivot click | `conceptId`, `sourceText` |
| `HUB_ENTERED` | Hub navigation | `hubId`, `source` |
| `JOURNEY_STARTED` | Journey begins | `journeyId`, `waypointCount` |
| `JOURNEY_ADVANCED` | Waypoint progress | `waypointId`, `position` |
| `MOMENT_SURFACED` | Moment shown | `momentId`, `surface`, `priority` |
| `MOMENT_RESOLVED` | Moment action/dismiss | `resolution`, `actionType` |

**Cumulative Events** (persisted across sessions, extend existing telemetry):
| Event | Extends | Purpose |
|-------|---------|---------|
| `JOURNEY_COMPLETED` | `JourneyCompletion` | Journey completion with duration |
| `TOPIC_EXPLORED` | `TopicExploration` | Topic visit with hub context |
| `INSIGHT_CAPTURED` | `SproutCapture` | Sprout capture with provenance |

---

## 3. Event Log Schema

### 3.1 GroveEventLog Structure

```typescript
// src/core/events/types.ts

/**
 * GroveEventLog v3 — Unified event store
 * Extends CumulativeMetricsV2 pattern to all events.
 */
export interface GroveEventLog {
  /** Schema version for migration support */
  version: 3;
  
  /** Field identifier (e.g., 'grove') */
  fieldId: string;
  
  /** Current session identifier */
  currentSessionId: string;
  
  /** Session-scoped events (cleared on new session) */
  sessionEvents: GroveEvent[];
  
  /** 
   * Cumulative events (persisted across sessions)
   * Direct extension of CumulativeMetricsV2 arrays
   */
  cumulativeEvents: {
    journeyCompletions: JourneyCompletedEvent[];
    topicExplorations: TopicExploredEvent[];
    insightCaptures: InsightCapturedEvent[];
  };
  
  /** Session count (from CumulativeMetricsV2) */
  sessionCount: number;
  
  /** Last session timestamp (from CumulativeMetricsV2) */
  lastSessionAt: number;
}
```

### 3.2 Storage Layout

```
localStorage
├── grove-event-log-v3        ← Single source of truth
│   ├── version: 3
│   ├── fieldId: 'grove'
│   ├── currentSessionId: string
│   ├── sessionEvents: GroveEvent[]
│   ├── cumulativeEvents: { ... }
│   ├── sessionCount: number
│   └── lastSessionAt: number
│
└── grove-telemetry-*-v2      ← DEPRECATED (migration source)
```

---

## 4. Projection Architecture

### 4.1 Core Principle

> **All state is derived from events. No stored state that isn't computable from the event log.**

Projections are pure functions: `(GroveEventLog) => DerivedState`

### 4.2 Projection Hierarchy

```
GroveEventLog
    │
    ├─► projectToCumulativeMetricsV2()  ──►  CumulativeMetricsV2 (backward compat)
    │                                              │
    │                                              └─► computeMetrics()  ──►  ComputedMetrics
    │
    ├─► projectSession()  ──────────────►  SessionState
    │
    ├─► projectContext()  ──────────────►  ContextState
    │       │
    │       └─► (depends on projectSession, projectComputedMetrics)
    │
    ├─► projectMomentContext()  ────────►  MomentEvaluationContext
    │       │
    │       └─► (depends on projectSession, projectContext, projectComputedMetrics)
    │
    └─► projectStream()  ───────────────►  StreamState (for history)
```

### 4.3 Projection Interfaces

```typescript
// src/core/events/projections/types.ts

/** Session state derived from session events */
export interface SessionState {
  sessionId: string;
  fieldId: string;
  startedAt: number;
  isReturning: boolean;
  lensId: string | null;
  lensSource: 'url' | 'selection' | 'system' | 'localStorage' | null;
  isCustomLens: boolean;
  interactionCount: number;
  activeJourneyId: string | null;
  journeyProgress: number;
  journeyTotal: number;
}

/** Context state for components */
export interface ContextState {
  stage: 'anonymous' | 'exploring' | 'engaged' | 'invested';
  entropy: number;
  activeLensId: string | null;
  activeMoments: string[];
  interactionCount: number;
  topicsExplored: string[];
  sproutsCaptured: number;
  offTopicCount: number;
}

/** Moment evaluation context (replaces manual construction in useMoments) */
export interface MomentEvaluationContext {
  stage: string;
  exchangeCount: number;
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];
  entropy: number;
  minutesActive: number;
  sessionCount: number;
  activeLens: string | null;
  activeJourney: string | null;
  hasCustomLens: boolean;
  flags: Record<string, boolean>;
  momentCooldowns: Record<string, number>;
}
```

### 4.4 Backward Compatibility Projection

```typescript
// src/core/events/projections/telemetry.ts

import type { CumulativeMetricsV2, ComputedMetrics } from '../schema/telemetry';
import { computeMetrics } from '../schema/telemetry';

/**
 * Project GroveEventLog to CumulativeMetricsV2.
 * Maintains backward compatibility with existing consumers.
 */
export function projectToCumulativeMetricsV2(log: GroveEventLog): CumulativeMetricsV2 {
  return {
    version: 2,
    fieldId: log.fieldId,
    journeyCompletions: log.cumulativeEvents.journeyCompletions,
    topicExplorations: log.cumulativeEvents.topicExplorations,
    sproutCaptures: log.cumulativeEvents.insightCaptures,  // Note: rename mapping
    sessionCount: log.sessionCount,
    lastSessionAt: log.lastSessionAt,
  };
}

/**
 * Derive computed metrics using existing function.
 * Reuses the proven computeMetrics() from telemetry.ts
 */
export function projectComputedMetrics(log: GroveEventLog): ComputedMetrics {
  const v2 = projectToCumulativeMetricsV2(log);
  return computeMetrics(v2);  // Reuse existing function!
}
```

---

## 5. File Organization

### 5.1 Directory Structure

```
src/core/events/
├── index.ts                  # Public API exports
├── types.ts                  # Event type definitions
├── schema.ts                 # Zod validation schemas
├── store.ts                  # GroveEventLog management
├── dispatch.ts               # Event dispatch with middleware
│
├── projections/
│   ├── index.ts              # Projection exports
│   ├── types.ts              # Projection return types
│   ├── session.ts            # SessionState projection
│   ├── context.ts            # ContextState projection
│   ├── telemetry.ts          # CumulativeMetricsV2 compat
│   ├── moments.ts            # MomentEvaluationContext
│   └── stream.ts             # Stream history projection
│
├── hooks/                    # (Sprint 2)
│   ├── index.ts
│   ├── useGroveEvents.ts
│   ├── useDispatch.ts
│   ├── useSession.ts
│   ├── useContext.ts
│   ├── useTelemetry.ts
│   └── useMomentContext.ts
│
├── compat.ts                 # V2 compatibility utilities
├── migration.ts              # V2 → V3 migration
│
└── __tests__/
    ├── types.test.ts         # Type validation tests
    ├── projections.test.ts   # Projection unit tests
    ├── migration.test.ts     # Migration tests
    └── integration.test.ts   # End-to-end tests
```

### 5.2 Export Structure

```typescript
// src/core/events/index.ts

// Types
export type {
  GroveEventBase,
  GroveEvent,
  GroveEventLog,
  // Session events
  SessionStartedEvent,
  LensActivatedEvent,
  QuerySubmittedEvent,
  ResponseCompletedEvent,
  // ... etc
} from './types';

// Projections
export {
  projectToCumulativeMetricsV2,
  projectComputedMetrics,
  projectSession,
  projectContext,
  projectMomentContext,
  projectStream,
} from './projections';

// Store
export { createEventLog, appendEvent, clearSessionEvents } from './store';

// Migration
export { migrateFromCumulativeMetricsV2 } from './migration';

// Validation
export { validateEvent, validateEventLog } from './schema';
```

---

## 6. Data Flow Architecture

### 6.1 Event Dispatch Flow

```
User Action (e.g., select lens)
         │
         ▼
dispatch({ type: 'LENS_ACTIVATED', lensId: 'engineer', ... })
         │
         ▼
validateEvent(event)  ─── Invalid? ──► Error boundary
         │ Valid
         ▼
GroveEventLog.sessionEvents.push(event)
         │
         ▼
persist(log)  ──► localStorage['grove-event-log-v3']
         │
         ▼
notify subscribers (React context / zustand)
         │
         ▼
Components re-render via projections
```

### 6.2 Projection Consumption Flow

```
Component needs MomentEvaluationContext
         │
         ▼
useMomentContext()  ─── hook call
         │
         ▼
useGroveEvents()  ─── gets GroveEventLog from context
         │
         ▼
projectMomentContext(log)  ─── memoized projection
         │
         ▼
Returns MomentEvaluationContext
```

### 6.3 Migration Flow (V2 → V3)

```
App initialization
         │
         ▼
Check localStorage['grove-event-log-v3']
         │
    ┌────┴────┐
    ▼         ▼
  Exists    Not Found
    │         │
    │         ▼
    │    Check localStorage['grove-telemetry-*-v2']
    │         │
    │    ┌────┴────┐
    │    ▼         ▼
    │  Exists    Not Found
    │    │         │
    │    ▼         ▼
    │  migrateFromCumulativeMetricsV2()
    │    │    createFreshEventLog()
    │    │         │
    │    └────┬────┘
    │         ▼
    │    Save to 'grove-event-log-v3'
    │         │
    └────┬────┘
         ▼
     Return GroveEventLog
```

---

## 7. Validation Schema (Zod)

### 7.1 Base Schemas

```typescript
// src/core/events/schema.ts

import { z } from 'zod';

/** Base event schema - all events must satisfy */
export const GroveEventBaseSchema = z.object({
  fieldId: z.string().min(1),
  timestamp: z.number().int().positive(),
  type: z.string().min(1),
  sessionId: z.string().min(1),
});

/** Session started event */
export const SessionStartedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('SESSION_STARTED'),
  isReturning: z.boolean(),
  previousSessionId: z.string().optional(),
});

/** Lens activated event */
export const LensActivatedEventSchema = GroveEventBaseSchema.extend({
  type: z.literal('LENS_ACTIVATED'),
  lensId: z.string().min(1),
  source: z.enum(['url', 'selection', 'system', 'localStorage']),
  isCustom: z.boolean(),
});

// ... additional event schemas
```

### 7.2 Union Schema

```typescript
/** Union of all valid Grove events */
export const GroveEventSchema = z.discriminatedUnion('type', [
  SessionStartedEventSchema,
  SessionResumedEventSchema,
  LensActivatedEventSchema,
  QuerySubmittedEventSchema,
  ResponseCompletedEventSchema,
  ForkSelectedEventSchema,
  PivotTriggeredEventSchema,
  HubEnteredEventSchema,
  JourneyStartedEventSchema,
  JourneyAdvancedEventSchema,
  JourneyCompletedEventSchema,
  InsightCapturedEventSchema,
  TopicExploredEventSchema,
  MomentSurfacedEventSchema,
  MomentResolvedEventSchema,
]);
```

---

## 8. Strangler Fig Boundaries

### 8.1 Boundary Definition

```
┌─────────────────────────────────────────────────────────────────────┐
│ LEGACY ZONE (Unchanged)                                              │
│ ────────────────────────                                            │
│ Routes: /, /surface/*, /terminal (marketing)                         │
│ Systems: EngagementMachine, EngagementBus                           │
│ Storage: grove-engagement-state, grove-telemetry-*-v2               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                     Migration boundary
                              │
┌─────────────────────────────────────────────────────────────────────┐
│ BEDROCK ZONE (New System)                                            │
│ ─────────────────────────                                           │
│ Routes: /explore/*, /foundation/*, bedrock branch                   │
│ Systems: GroveEventLog + Projections                                │
│ Storage: grove-event-log-v3                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Import Rules

```typescript
// ✅ ALLOWED in bedrock zone
import { GroveEventLog, projectMomentContext } from '@/core/events';
import { CumulativeMetricsV2, computeMetrics } from '@/core/schema/telemetry';

// ❌ NOT ALLOWED in bedrock zone
import { engagementMachine } from '@/core/engagement/machine';
import { EngagementBus } from '@/core/engagement/bus';
```

---

## 9. Performance Considerations

### 9.1 Memoization Strategy

```typescript
// Projections are memoized at the hook level
function useMomentContext(): MomentEvaluationContext {
  const log = useGroveEvents();
  
  // useMemo prevents recalculation unless log changes
  return useMemo(() => projectMomentContext(log), [log]);
}
```

### 9.2 Event Log Size Management

| Concern | Strategy |
|---------|----------|
| Session events | Clear on new session; typical session < 100 events |
| Cumulative events | Append-only; compress after threshold |
| Projection cost | O(n) where n = events; memoization handles re-renders |

### 9.3 Lazy Computation

```typescript
// Projections computed only when consumed
const session = useMemo(() => projectSession(log), [log]);
const context = useMemo(() => projectContext(log), [log, session]);
```

---

## 10. Testing Strategy

### 10.1 Test Categories

| Category | Focus | Location |
|----------|-------|----------|
| Type tests | Type guards, discrimination | `types.test.ts` |
| Schema tests | Zod validation, edge cases | `schema.test.ts` |
| Projection tests | Pure function correctness | `projections.test.ts` |
| Migration tests | V2 → V3 data integrity | `migration.test.ts` |
| Integration tests | End-to-end flow | `integration.test.ts` |

### 10.2 Coverage Target

**Sprint 1 target: 90%+ coverage on:**
- All event type definitions
- All projection functions
- Migration function
- Validation schemas

---

## 11. ADR Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| D1 | Extend MetricAttribution | Proven pattern, maintains provenance |
| D2 | Separate session/cumulative | Different lifecycles, cognitive archaeology |
| D3 | Projections over stored state | Single source of truth, testable |
| D4 | Backward compat via projection | Gradual migration, no breaking changes |
| D5 | Zod for validation | Runtime safety, TypeScript inference |
| D6 | Strangler fig pattern | Minimize risk, clear boundaries |

---

*Generated by Foundation Loop Phase 3*
