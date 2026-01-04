# Bedrock Event Architecture v1 — Migration Map

**Sprint:** bedrock-event-architecture-v1  
**Phase:** 4 (Migration Planning)  
**Generated:** January 4, 2026  
**Planner:** Claude + Foundation Loop

---

## 1. Migration Overview

### 1.1 Scope Summary

| Category | Count | Risk |
|----------|-------|------|
| Files to create | 15 | Low (new files) |
| Files to modify | 0 (Sprint 1) | N/A |
| Files deprecated | 0 (Sprint 1) | N/A |
| Tests to create | 4 | Low |

### 1.2 Sprint 1 Boundary

**Sprint 1 creates foundation only.** No existing code is modified.

- ✅ Create event type definitions
- ✅ Create Zod validation schemas
- ✅ Create projection functions
- ✅ Create migration function
- ✅ Create comprehensive tests
- ❌ React hooks (Sprint 2)
- ❌ Route integration (Sprint 3)

---

## 2. File Creation Plan

### 2.1 Core Types File

**File:** `src/core/events/types.ts`

**Purpose:** Event type definitions extending MetricAttribution

**Contents:**
```typescript
// Exports:
- GroveEventBase (interface)
- SessionStartedEvent, SessionResumedEvent
- LensActivatedEvent
- QuerySubmittedEvent, ResponseCompletedEvent
- ForkSelectedEvent, PivotTriggeredEvent, HubEnteredEvent
- JourneyStartedEvent, JourneyAdvancedEvent, JourneyCompletedEvent
- InsightCapturedEvent, TopicExploredEvent
- MomentSurfacedEvent, MomentResolvedEvent
- GroveEvent (union type)
- GroveEventLog (interface)
```

**Lines:** ~200

**Dependencies:**
- `../schema/telemetry` (MetricAttribution, JourneyCompletion, etc.)

---

### 2.2 Validation Schema File

**File:** `src/core/events/schema.ts`

**Purpose:** Zod schemas for runtime validation

**Contents:**
```typescript
// Exports:
- GroveEventBaseSchema
- SessionStartedEventSchema, SessionResumedEventSchema
- LensActivatedEventSchema
- QuerySubmittedEventSchema, ResponseCompletedEventSchema
- ForkSelectedEventSchema, PivotTriggeredEventSchema, HubEnteredEventSchema
- JourneyStartedEventSchema, JourneyAdvancedEventSchema, JourneyCompletedEventSchema
- InsightCapturedEventSchema, TopicExploredEventSchema
- MomentSurfacedEventSchema, MomentResolvedEventSchema
- GroveEventSchema (discriminated union)
- GroveEventLogSchema
- validateEvent(), validateEventLog()
```

**Lines:** ~300

**Dependencies:**
- `zod`
- `./types`

---

### 2.3 Store Management File

**File:** `src/core/events/store.ts`

**Purpose:** GroveEventLog creation and manipulation

**Contents:**
```typescript
// Exports:
- createEventLog(options): GroveEventLog
- appendEvent(log, event): GroveEventLog
- clearSessionEvents(log): GroveEventLog
- startNewSession(log): GroveEventLog
- DEFAULT_FIELD_ID
- generateSessionId()
```

**Lines:** ~80

**Dependencies:**
- `./types`
- `./schema` (validation)

---

### 2.4 Projection Files

#### 2.4.1 Projection Index

**File:** `src/core/events/projections/index.ts`

**Purpose:** Re-exports all projections

**Lines:** ~15

---

#### 2.4.2 Projection Types

**File:** `src/core/events/projections/types.ts`

**Purpose:** Return type definitions for projections

**Contents:**
```typescript
// Exports:
- SessionState (interface)
- ContextState (interface)
- MomentEvaluationContext (interface)
- StreamHistoryState (interface)
```

**Lines:** ~60

---

#### 2.4.3 Session Projection

**File:** `src/core/events/projections/session.ts`

**Purpose:** Derive session state from events

**Contents:**
```typescript
// Exports:
- projectSession(events: GroveEvent[]): SessionState
- INITIAL_SESSION_STATE
```

**Lines:** ~50

**Dependencies:**
- `../types`
- `./types`

---

#### 2.4.4 Telemetry Projection

**File:** `src/core/events/projections/telemetry.ts`

**Purpose:** Backward compatibility with CumulativeMetricsV2

**Contents:**
```typescript
// Exports:
- projectToCumulativeMetricsV2(log): CumulativeMetricsV2
- projectComputedMetrics(log): ComputedMetrics
```

**Lines:** ~30

**Dependencies:**
- `../../schema/telemetry` (CumulativeMetricsV2, computeMetrics)
- `../types`

---

#### 2.4.5 Context Projection

**File:** `src/core/events/projections/context.ts`

**Purpose:** Derive context state for components

**Contents:**
```typescript
// Exports:
- projectContext(log): ContextState
- computeStage(interactionCount, metrics): string
- computeEntropy(events): number
- deriveActiveMoments(events): string[]
```

**Lines:** ~80

**Dependencies:**
- `./session`
- `./telemetry`
- `./types`

---

#### 2.4.6 Moments Projection

**File:** `src/core/events/projections/moments.ts`

**Purpose:** Derive MomentEvaluationContext (replaces useMoments adapter)

**Contents:**
```typescript
// Exports:
- projectMomentContext(log): MomentEvaluationContext
- deriveFlags(events): Record<string, boolean>
- deriveCooldowns(events): Record<string, number>
- deriveActiveJourney(events): string | null
- computeMinutesActive(startedAt): number
```

**Lines:** ~100

**Dependencies:**
- `./session`
- `./context`
- `./telemetry`
- `./types`

---

#### 2.4.7 Stream Projection

**File:** `src/core/events/projections/stream.ts`

**Purpose:** Derive stream/conversation history

**Contents:**
```typescript
// Exports:
- projectStream(events): StreamHistoryState
- deriveConversationHistory(events): ConversationItem[]
```

**Lines:** ~50

**Dependencies:**
- `../types`
- `./types`

---

### 2.5 Migration File

**File:** `src/core/events/migration.ts`

**Purpose:** V2 → V3 data migration

**Contents:**
```typescript
// Exports:
- migrateFromCumulativeMetricsV2(v2: CumulativeMetricsV2): GroveEventLog
- isCumulativeMetricsV2(data: unknown): boolean
- MIGRATED_SESSION_ID
```

**Lines:** ~60

**Dependencies:**
- `../../schema/telemetry` (CumulativeMetricsV2)
- `./types`
- `./store`

---

### 2.6 Compatibility File

**File:** `src/core/events/compat.ts`

**Purpose:** Utilities for gradual migration

**Contents:**
```typescript
// Exports:
- syncToLegacyFormat(log): void  // Writes back to V2 keys for legacy consumers
- isLegacySystemActive(): boolean
```

**Lines:** ~40

**Dependencies:**
- `./types`
- `./projections/telemetry`

---

### 2.7 Index File

**File:** `src/core/events/index.ts`

**Purpose:** Public API exports

**Lines:** ~40

---

### 2.8 Test Files

#### 2.8.1 Type Tests

**File:** `src/core/events/__tests__/types.test.ts`

**Coverage:**
- Type guard functions
- Event creation helpers
- Type narrowing via discriminant

**Lines:** ~100

---

#### 2.8.2 Projection Tests

**File:** `src/core/events/__tests__/projections.test.ts`

**Coverage:**
- projectSession (all event types)
- projectToCumulativeMetricsV2 (backward compat)
- projectComputedMetrics (reuse validation)
- projectContext (derivation correctness)
- projectMomentContext (complete context)
- projectStream (conversation reconstruction)

**Lines:** ~300

---

#### 2.8.3 Schema Tests

**File:** `src/core/events/__tests__/schema.test.ts`

**Coverage:**
- Valid event acceptance
- Invalid event rejection
- Edge cases (empty strings, negative numbers)
- Discriminated union behavior

**Lines:** ~200

---

#### 2.8.4 Migration Tests

**File:** `src/core/events/__tests__/migration.test.ts`

**Coverage:**
- V2 → V3 field mapping
- Cumulative event extension (adding type/sessionId)
- Empty V2 handling
- Data integrity verification

**Lines:** ~150

---

## 3. Execution Order

### 3.1 Epic 1: Core Types (Day 1)

| Order | File | Depends On |
|-------|------|-----------|
| 1.1 | `types.ts` | `../schema/telemetry` |
| 1.2 | `projections/types.ts` | `types.ts` |

### 3.2 Epic 2: Validation (Day 1-2)

| Order | File | Depends On |
|-------|------|-----------|
| 2.1 | `schema.ts` | `types.ts`, zod |
| 2.2 | `__tests__/schema.test.ts` | `schema.ts` |

### 3.3 Epic 3: Projections (Day 2-3)

| Order | File | Depends On |
|-------|------|-----------|
| 3.1 | `projections/session.ts` | `types.ts` |
| 3.2 | `projections/telemetry.ts` | `types.ts`, `../schema/telemetry` |
| 3.3 | `projections/context.ts` | `projections/session.ts`, `projections/telemetry.ts` |
| 3.4 | `projections/moments.ts` | All above projections |
| 3.5 | `projections/stream.ts` | `types.ts` |
| 3.6 | `projections/index.ts` | All projections |
| 3.7 | `__tests__/projections.test.ts` | All projections |

### 3.4 Epic 4: Store & Migration (Day 3-4)

| Order | File | Depends On |
|-------|------|-----------|
| 4.1 | `store.ts` | `types.ts`, `schema.ts` |
| 4.2 | `migration.ts` | `types.ts`, `store.ts` |
| 4.3 | `compat.ts` | `types.ts`, `projections/telemetry.ts` |
| 4.4 | `__tests__/migration.test.ts` | `migration.ts` |

### 3.5 Epic 5: Integration (Day 4)

| Order | File | Depends On |
|-------|------|-----------|
| 5.1 | `index.ts` | All above |
| 5.2 | `__tests__/types.test.ts` | `types.ts` |
| 5.3 | Integration test run | All tests |

---

## 4. Dependency Graph

```
telemetry.ts (existing)
       │
       ▼
   types.ts ──────────────────────────────────┐
       │                                       │
       ├─────────────────┐                     │
       ▼                 ▼                     ▼
  schema.ts        projections/           migration.ts
       │           ├── types.ts                │
       │           ├── session.ts              │
       │           ├── telemetry.ts ◄──────────┘
       │           ├── context.ts
       │           ├── moments.ts
       │           └── stream.ts
       │                 │
       ▼                 ▼
   store.ts        projections/index.ts
       │                 │
       ▼                 │
   compat.ts             │
       │                 │
       └────────┬────────┘
                ▼
            index.ts
```

---

## 5. Build Gates

### 5.1 After Each Epic

```bash
# TypeScript compilation
npx tsc --noEmit

# Unit tests for new files
npx vitest run src/core/events/

# Ensure no import errors
npm run build
```

### 5.2 Sprint Completion

```bash
# Full test suite
npm test

# Coverage verification (target: 90%+)
npx vitest run --coverage src/core/events/

# E2E (should still pass - no behavior changes)
npx playwright test
```

---

## 6. Rollback Plan

### 6.1 Sprint 1 Rollback

Since Sprint 1 creates new files without modifying existing code:

```bash
# Remove all new files
rm -rf src/core/events/

# No other changes needed
```

### 6.2 Migration Rollback (If Data Issues)

```javascript
// src/core/events/compat.ts includes:
export function rollbackToV2(): void {
  const log = getEventLog();
  const v2 = projectToCumulativeMetricsV2(log);
  setCumulativeMetricsV2(v2);
  localStorage.removeItem('grove-event-log-v3');
}
```

---

## 7. File Line Count Summary

| File | Estimated Lines |
|------|-----------------|
| `types.ts` | 200 |
| `schema.ts` | 300 |
| `store.ts` | 80 |
| `projections/types.ts` | 60 |
| `projections/session.ts` | 50 |
| `projections/telemetry.ts` | 30 |
| `projections/context.ts` | 80 |
| `projections/moments.ts` | 100 |
| `projections/stream.ts` | 50 |
| `projections/index.ts` | 15 |
| `migration.ts` | 60 |
| `compat.ts` | 40 |
| `index.ts` | 40 |
| **Production Total** | **~1,105** |
| `__tests__/types.test.ts` | 100 |
| `__tests__/schema.test.ts` | 200 |
| `__tests__/projections.test.ts` | 300 |
| `__tests__/migration.test.ts` | 150 |
| **Test Total** | **~750** |
| **Grand Total** | **~1,855** |

**Comparison:** Current engagement system is ~1,122 lines. New event system is similar in size but cleaner architecture.

---

## 8. Sprint 2-3 Preview (Not This Sprint)

### Sprint 2: Hooks

Files to create:
- `hooks/useGroveEvents.ts` — Provider + context
- `hooks/useDispatch.ts` — Event dispatch hook
- `hooks/useSession.ts` — Session state hook
- `hooks/useContext.ts` — Context state hook
- `hooks/useTelemetry.ts` — Telemetry hook
- `hooks/useMomentContext.ts` — Moment evaluation hook
- `hooks/index.ts` — Re-exports

### Sprint 3: Integration

Files to modify:
- Route providers (add EventProvider)
- `useMoments.ts` (switch to new hook)
- Feature flag configuration

---

*Generated by Foundation Loop Phase 4*
