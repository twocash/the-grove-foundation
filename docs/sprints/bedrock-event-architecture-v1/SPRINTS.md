# Bedrock Event Architecture v1 — Sprint Breakdown

**Sprint:** bedrock-event-architecture-v1  
**Phase:** 6 (Story Breakdown)  
**Generated:** January 4, 2026  
**Planner:** Claude + Foundation Loop

---

## Sprint Overview

**Duration:** 4 days  
**Scope:** Types, schemas, projections, migration (NO hooks, NO route integration)  
**Coverage Target:** 90%+

---

## Epic 1: Core Event Types

**Goal:** Define all event types extending MetricAttribution

**Duration:** Day 1 (first half)

### Story 1.1: Create GroveEventBase

**Task:** Create `src/core/events/types.ts` with base event type

**Acceptance Criteria:**
- [ ] `GroveEventBase` extends `MetricAttribution`
- [ ] Adds `type: string` discriminant
- [ ] Adds `sessionId: string` for session scoping
- [ ] Imports work without circular dependencies

**Code Sample:**
```typescript
import type { MetricAttribution } from '../schema/telemetry';

export interface GroveEventBase extends MetricAttribution {
  fieldId: string;    // From MetricAttribution
  timestamp: number;  // From MetricAttribution
  type: string;       // Event discriminant
  sessionId: string;  // Session scope
}
```

### Story 1.2: Define Session Events

**Task:** Add session lifecycle event types

**Acceptance Criteria:**
- [ ] `SessionStartedEvent` with `isReturning`, `previousSessionId`
- [ ] `SessionResumedEvent` with `minutesSinceLastActivity`
- [ ] `LensActivatedEvent` with `lensId`, `source`, `isCustom`

### Story 1.3: Define Exploration Events

**Task:** Add exploration stream event types

**Acceptance Criteria:**
- [ ] `QuerySubmittedEvent` with `queryId`, `content`, `intent`
- [ ] `ResponseCompletedEvent` with `responseId`, `spanCount`, `hasNavigation`
- [ ] `ForkSelectedEvent` with `forkId`, `forkType`, `label`
- [ ] `PivotTriggeredEvent` with `conceptId`, `sourceText`
- [ ] `HubEnteredEvent` with `hubId`, `source`

### Story 1.4: Define Journey Events

**Task:** Add journey lifecycle event types

**Acceptance Criteria:**
- [ ] `JourneyStartedEvent` with `journeyId`, `waypointCount`
- [ ] `JourneyAdvancedEvent` with `waypointId`, `position`
- [ ] `JourneyCompletedEvent` extends existing `JourneyCompletion`

### Story 1.5: Define Cumulative Events

**Task:** Add cumulative event types extending existing telemetry

**Acceptance Criteria:**
- [ ] `JourneyCompletedEvent` extends `JourneyCompletion` + `GroveEventBase`
- [ ] `TopicExploredEvent` extends `TopicExploration` + `GroveEventBase`
- [ ] `InsightCapturedEvent` extends `SproutCapture` + `GroveEventBase`

### Story 1.6: Define Moment Events

**Task:** Add moment lifecycle event types

**Acceptance Criteria:**
- [ ] `MomentSurfacedEvent` with `momentId`, `surface`, `priority`
- [ ] `MomentResolvedEvent` with `resolution`, `actionId`, `actionType`

### Story 1.7: Create Union Type and EventLog

**Task:** Define GroveEvent union and GroveEventLog interface

**Acceptance Criteria:**
- [ ] `GroveEvent` is discriminated union of all event types
- [ ] `GroveEventLog` includes `sessionEvents`, `cumulativeEvents`
- [ ] Version set to `3`

**Tests:**
- Unit: `src/core/events/__tests__/types.test.ts`
  - [ ] Type guards correctly narrow discriminant
  - [ ] GroveEventLog structure is valid

### Build Gate (Epic 1)
```bash
npx tsc --noEmit  # Types compile
```

---

## Epic 2: Zod Validation Schemas

**Goal:** Runtime validation for all event types

**Duration:** Day 1 (second half) - Day 2 (first half)

### Story 2.1: Create Base Schemas

**Task:** Create `src/core/events/schema.ts` with base schemas

**Acceptance Criteria:**
- [ ] `GroveEventBaseSchema` validates base fields
- [ ] `fieldId` requires non-empty string
- [ ] `timestamp` requires positive integer
- [ ] `sessionId` requires non-empty string

**Code Sample:**
```typescript
import { z } from 'zod';

export const GroveEventBaseSchema = z.object({
  fieldId: z.string().min(1),
  timestamp: z.number().int().positive(),
  type: z.string().min(1),
  sessionId: z.string().min(1),
});
```

### Story 2.2: Create Session Event Schemas

**Task:** Add Zod schemas for session events

**Acceptance Criteria:**
- [ ] `SessionStartedEventSchema` with literal type
- [ ] `SessionResumedEventSchema` with literal type
- [ ] `LensActivatedEventSchema` with enum for source

### Story 2.3: Create Exploration Event Schemas

**Task:** Add Zod schemas for exploration events

**Acceptance Criteria:**
- [ ] All exploration events have schemas
- [ ] Optional fields marked correctly
- [ ] Enums match type definitions

### Story 2.4: Create Journey and Cumulative Event Schemas

**Task:** Add Zod schemas for journey and cumulative events

**Acceptance Criteria:**
- [ ] Journey schemas validate waypoint fields
- [ ] Cumulative schemas extend base properly

### Story 2.5: Create Discriminated Union Schema

**Task:** Create `GroveEventSchema` discriminated union

**Acceptance Criteria:**
- [ ] Union discriminates on `type` field
- [ ] All 15 event types included
- [ ] `validateEvent()` function exported

### Story 2.6: Create EventLog Schema

**Task:** Create `GroveEventLogSchema` for full log validation

**Acceptance Criteria:**
- [ ] Validates version field (literal 3)
- [ ] Validates nested `cumulativeEvents` structure
- [ ] `validateEventLog()` function exported

**Tests:**
- Unit: `src/core/events/__tests__/schema.test.ts`
  - [ ] Valid events pass validation
  - [ ] Invalid events rejected with clear errors
  - [ ] Edge cases handled (empty strings, negative numbers)
  - [ ] Discriminated union narrows correctly

### Build Gate (Epic 2)
```bash
npx tsc --noEmit
npx vitest run src/core/events/__tests__/schema.test.ts
```

---

## Epic 3: Projection Functions

**Goal:** Pure functions deriving state from event log

**Duration:** Day 2 (second half) - Day 3

### Story 3.1: Create Projection Types

**Task:** Create `src/core/events/projections/types.ts`

**Acceptance Criteria:**
- [ ] `SessionState` interface defined
- [ ] `ContextState` interface defined
- [ ] `MomentEvaluationContext` interface defined
- [ ] `StreamHistoryState` interface defined

### Story 3.2: Implement Session Projection

**Task:** Create `src/core/events/projections/session.ts`

**Acceptance Criteria:**
- [ ] `projectSession()` derives session state from events
- [ ] Handles all session event types
- [ ] Returns `INITIAL_SESSION_STATE` for empty events
- [ ] Correctly tracks interaction count

**Code Sample:**
```typescript
export function projectSession(events: GroveEvent[]): SessionState {
  return events.reduce((state, event) => {
    switch (event.type) {
      case 'SESSION_STARTED':
        return { ...state, sessionId: event.sessionId, startedAt: event.timestamp };
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

### Story 3.3: Implement Telemetry Projection

**Task:** Create `src/core/events/projections/telemetry.ts`

**Acceptance Criteria:**
- [ ] `projectToCumulativeMetricsV2()` returns valid V2 structure
- [ ] `projectComputedMetrics()` reuses existing `computeMetrics()`
- [ ] Field mapping handles `insightCaptures` → `sproutCaptures` rename

**Tests:**
- [ ] Output matches CumulativeMetricsV2 type
- [ ] computeMetrics() integration works

### Story 3.4: Implement Context Projection

**Task:** Create `src/core/events/projections/context.ts`

**Acceptance Criteria:**
- [ ] `projectContext()` derives full context state
- [ ] `computeStage()` returns correct stage based on metrics
- [ ] `computeEntropy()` calculates from event patterns
- [ ] `deriveActiveMoments()` extracts currently surfaced moments

### Story 3.5: Implement Moment Context Projection

**Task:** Create `src/core/events/projections/moments.ts`

**Acceptance Criteria:**
- [ ] `projectMomentContext()` returns full MomentEvaluationContext
- [ ] `deriveFlags()` extracts flag state from events
- [ ] `deriveCooldowns()` extracts cooldown state
- [ ] Output compatible with existing moment-evaluator

### Story 3.6: Implement Stream Projection

**Task:** Create `src/core/events/projections/stream.ts`

**Acceptance Criteria:**
- [ ] `projectStream()` reconstructs conversation history
- [ ] Query/response pairing correct
- [ ] Fork/pivot events linked to source responses

### Story 3.7: Create Projection Index

**Task:** Create `src/core/events/projections/index.ts`

**Acceptance Criteria:**
- [ ] All projections exported
- [ ] Types re-exported

**Tests:**
- Unit: `src/core/events/__tests__/projections.test.ts`
  - [ ] projectSession with all event types
  - [ ] projectToCumulativeMetricsV2 backward compatibility
  - [ ] projectComputedMetrics matches existing behavior
  - [ ] projectContext stage transitions
  - [ ] projectMomentContext complete output
  - [ ] Empty event log handling

### Build Gate (Epic 3)
```bash
npx tsc --noEmit
npx vitest run src/core/events/__tests__/projections.test.ts
```

---

## Epic 4: Store and Migration

**Goal:** Event log management and V2 → V3 migration

**Duration:** Day 3 (second half) - Day 4 (first half)

### Story 4.1: Implement Store Functions

**Task:** Create `src/core/events/store.ts`

**Acceptance Criteria:**
- [ ] `createEventLog()` creates fresh log with options
- [ ] `appendEvent()` adds event with validation
- [ ] `clearSessionEvents()` clears session array
- [ ] `startNewSession()` increments session count
- [ ] `generateSessionId()` creates unique IDs

**Code Sample:**
```typescript
export function createEventLog(options: Partial<GroveEventLog> = {}): GroveEventLog {
  return {
    version: 3,
    fieldId: options.fieldId ?? DEFAULT_FIELD_ID,
    currentSessionId: options.currentSessionId ?? generateSessionId(),
    sessionEvents: options.sessionEvents ?? [],
    cumulativeEvents: options.cumulativeEvents ?? {
      journeyCompletions: [],
      topicExplorations: [],
      insightCaptures: [],
    },
    sessionCount: options.sessionCount ?? 1,
    lastSessionAt: options.lastSessionAt ?? Date.now(),
  };
}
```

### Story 4.2: Implement Migration Function

**Task:** Create `src/core/events/migration.ts`

**Acceptance Criteria:**
- [ ] `migrateFromCumulativeMetricsV2()` converts V2 to V3
- [ ] Cumulative events extended with `type` and `sessionId='migrated'`
- [ ] Session events start empty
- [ ] `isCumulativeMetricsV2()` type guard exported

**Code Sample:**
```typescript
export function migrateFromCumulativeMetricsV2(v2: CumulativeMetricsV2): GroveEventLog {
  return {
    version: 3,
    fieldId: v2.fieldId,
    currentSessionId: generateSessionId(),
    sessionEvents: [],
    cumulativeEvents: {
      journeyCompletions: v2.journeyCompletions.map(jc => ({
        ...jc,
        type: 'JOURNEY_COMPLETED' as const,
        sessionId: MIGRATED_SESSION_ID,
      })),
      // ... similar for other arrays
    },
    sessionCount: v2.sessionCount,
    lastSessionAt: v2.lastSessionAt,
  };
}
```

### Story 4.3: Implement Compatibility Layer

**Task:** Create `src/core/events/compat.ts`

**Acceptance Criteria:**
- [ ] `syncToLegacyFormat()` writes back to V2 keys
- [ ] `isLegacySystemActive()` detects legacy route

**Tests:**
- Unit: `src/core/events/__tests__/migration.test.ts`
  - [ ] V2 → V3 field mapping correct
  - [ ] Cumulative events properly extended
  - [ ] Empty V2 data handled
  - [ ] Session count preserved
  - [ ] Data integrity verified

### Build Gate (Epic 4)
```bash
npx tsc --noEmit
npx vitest run src/core/events/__tests__/migration.test.ts
```

---

## Epic 5: Integration and Export

**Goal:** Public API and final validation

**Duration:** Day 4

### Story 5.1: Create Public Index

**Task:** Create `src/core/events/index.ts`

**Acceptance Criteria:**
- [ ] All types exported
- [ ] All projections exported
- [ ] Store functions exported
- [ ] Migration functions exported
- [ ] Validation functions exported

### Story 5.2: Type Test Coverage

**Task:** Complete type tests

**Acceptance Criteria:**
- [ ] All type guards tested
- [ ] Discriminant narrowing verified
- [ ] Export completeness checked

### Story 5.3: Integration Testing

**Task:** Run full test suite

**Acceptance Criteria:**
- [ ] All unit tests pass
- [ ] Coverage ≥ 90%
- [ ] No TypeScript errors
- [ ] No import errors

**Tests:**
- Integration: Full test suite
  - [ ] `npm test` passes
  - [ ] `npx vitest run --coverage` shows ≥ 90%

### Story 5.4: Documentation

**Task:** Add JSDoc comments

**Acceptance Criteria:**
- [ ] All exported functions have JSDoc
- [ ] All interfaces have field descriptions
- [ ] Usage examples in key files

### Build Gate (Epic 5 / Sprint Complete)
```bash
# Full build
npm run build

# All tests
npm test

# Coverage verification
npx vitest run --coverage src/core/events/

# E2E (should still pass - no behavior changes)
npx playwright test
```

---

## Test Summary

| Test File | Coverage Target | Focus |
|-----------|-----------------|-------|
| `types.test.ts` | 100% | Type guards, narrowing |
| `schema.test.ts` | 95%+ | Validation acceptance/rejection |
| `projections.test.ts` | 90%+ | Output correctness |
| `migration.test.ts` | 100% | Data integrity |

---

## Commit Sequence

| Order | Commit Message |
|-------|---------------|
| 1 | `feat(events): add core event type definitions` |
| 2 | `feat(events): add projection types` |
| 3 | `feat(events): add Zod validation schemas` |
| 4 | `test(events): add schema validation tests` |
| 5 | `feat(events): add session projection` |
| 6 | `feat(events): add telemetry projection (backward compat)` |
| 7 | `feat(events): add context and moment projections` |
| 8 | `feat(events): add stream projection` |
| 9 | `test(events): add projection unit tests` |
| 10 | `feat(events): add store functions` |
| 11 | `feat(events): add V2 → V3 migration` |
| 12 | `feat(events): add compatibility layer` |
| 13 | `test(events): add migration tests` |
| 14 | `feat(events): add public API exports` |
| 15 | `test(events): add type tests` |
| 16 | `docs(events): add JSDoc documentation` |

---

*Generated by Foundation Loop Phase 6*
