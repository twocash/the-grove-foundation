# SPRINTS.md - DEX Telemetry Compliance

**Sprint:** dex-telemetry-compliance-v1
**Status:** Planning
**Created:** 2025-12-29

---

## Epic Breakdown

| EPIC | Name | Files | Priority |
|------|------|-------|----------|
| 1 | Schema & Config | 2 | High |
| 2 | Persistence Layer | 1 | High |
| 3 | XState Types | 1 | Medium |
| 4 | XState Machine | 1 | Medium |
| 5 | Hooks Layer | 1 | High |
| 6 | Tests | 2 | High |

---

## EPIC 1: Schema & Config

**Goal:** Create declarative types and configuration for DEX compliance.

### Tasks

- [ ] **1.1** Create `src/core/schema/telemetry.ts`
  - Define `MetricAttribution` interface
  - Define `JourneyCompletion` interface
  - Define `TopicExploration` interface
  - Define `SproutCapture` interface
  - Define `CumulativeMetricsV2` interface
  - Define `ComputedMetrics` interface
  - Implement `computeMetrics()` function

- [ ] **1.2** Add to `src/core/config/defaults.ts`
  - Add `DEFAULT_STAGE_THRESHOLDS` constant
  - Add `EngagementStage` type
  - Implement `computeStage()` function

### Acceptance Criteria
- [ ] All types exported from `@core/schema/telemetry`
- [ ] `computeStage()` returns correct stage for all thresholds
- [ ] `computeMetrics()` correctly derives counts from arrays

---

## EPIC 2: Persistence Layer

**Goal:** Add Field-scoped V2 persistence with migration support.

### Tasks

- [ ] **2.1** Add imports to `src/core/engagement/persistence.ts`
  - Import types from `@core/schema/telemetry`

- [ ] **2.2** Add Field constant
  - Define `DEFAULT_FIELD_ID = 'grove'`

- [ ] **2.3** Update `STORAGE_KEYS`
  - Add `cumulativeMetricsV2` function key

- [ ] **2.4** Implement `getCumulativeMetricsV2()`
  - Field-scoped storage key
  - Auto-migration from V1

- [ ] **2.5** Implement `setCumulativeMetricsV2()`
  - Field-scoped storage key

- [ ] **2.6** Implement `migrateV1ToV2()`
  - Convert raw counts to provenance arrays
  - Mark migrated entries with `legacy-migration` prefix

- [ ] **2.7** Update `HydratedContextOverrides`
  - Replace raw counts with provenance arrays

- [ ] **2.8** Update `getHydratedContextOverrides()`
  - Use `getCumulativeMetricsV2()`
  - Return provenance arrays

### Acceptance Criteria
- [ ] V2 storage uses Field-scoped keys
- [ ] V1 data migrates automatically on first read
- [ ] Hydration returns provenance arrays

---

## EPIC 3: XState Types

**Goal:** Update EngagementContext to use provenance types.

### Tasks

- [ ] **3.1** Add imports to `src/core/engagement/types.ts`
  - Import provenance types from `@core/schema/telemetry`

- [ ] **3.2** Replace raw counters in `EngagementContext`
  - Remove `journeysCompleted: number`
  - Remove `sproutsCaptured: number`
  - Remove `topicsExplored: string[]`
  - Add `journeyCompletions: JourneyCompletion[]`
  - Add `sproutCaptures: SproutCapture[]`
  - Add `topicExplorations: TopicExploration[]`

- [ ] **3.3** Update `initialContext`
  - Initialize arrays as empty `[]`

- [ ] **3.4** Update event type payloads
  - `JOURNEY_COMPLETED_TRACKED` adds `journeyId`, `durationMs`
  - `SPROUT_CAPTURED` adds `journeyId`, `hubId`
  - `TOPIC_EXPLORED` adds `hubId`

### Acceptance Criteria
- [ ] `EngagementContext` uses provenance arrays
- [ ] Event payloads include attribution data
- [ ] No TypeScript errors

---

## EPIC 4: XState Machine

**Goal:** Update machine actions to append provenance entries.

### Tasks

- [ ] **4.1** Add imports to `src/core/engagement/machine.ts`
  - Import provenance types
  - Import `computeMetrics`

- [ ] **4.2** Add Field constant
  - Define `DEFAULT_FIELD_ID = 'grove'`

- [ ] **4.3** Replace increment actions
  - Remove `incrementJourneysCompleted`
  - Remove `incrementSproutsCaptured`
  - Remove `addTopicExplored`
  - Add `addJourneyCompletion`
  - Add `addSproutCapture`
  - Add `addTopicExploration`

- [ ] **4.4** Update `persistMetrics` action
  - Use `setCumulativeMetricsV2()`
  - Build full `CumulativeMetricsV2` object

- [ ] **4.5** Update event handlers
  - Wire new actions to events

### Acceptance Criteria
- [ ] Actions append to provenance arrays
- [ ] Persistence uses V2 format
- [ ] Events trigger correct actions

---

## EPIC 5: Hooks Layer

**Goal:** Remove hardcoded thresholds, use declarative config.

### Tasks

- [ ] **5.1** Add imports to `src/surface/hooks/useMoments.ts`
  - Import `computeStage` from `@core/config/defaults`
  - Import `computeMetrics` from `@core/schema/telemetry`

- [ ] **5.2** Replace hardcoded stage computation
  - Remove inline threshold checks
  - Use `computeStage(exchangeCount)`

- [ ] **5.3** Update evaluation context mapping
  - Build `CumulativeMetricsV2` from XState context
  - Use `computeMetrics()` for derived values
  - Map to `MomentEvaluationContext`

### Acceptance Criteria
- [ ] No magic numbers in useMoments.ts
- [ ] Stage computed via `computeStage()`
- [ ] Metrics computed via `computeMetrics()`

---

## EPIC 6: Tests

**Goal:** Add unit tests for new functionality.

### Tasks

- [ ] **6.1** Create `tests/unit/telemetry.test.ts`
  - Test `computeMetrics()` for journey count
  - Test `computeMetrics()` for sprout count
  - Test `computeMetrics()` for topic deduplication

- [ ] **6.2** Create `tests/unit/stage-computation.test.ts`
  - Test default thresholds
  - Test custom thresholds
  - Test boundary values

- [ ] **6.3** Run full test suite
  - Ensure no regressions (363+ tests passing)

### Acceptance Criteria
- [ ] All new tests pass
- [ ] No regression in existing tests
- [ ] Coverage for edge cases

---

## Execution Order

```
EPIC 1 (Schema & Config)
    │
    ├─► EPIC 2 (Persistence)
    │       │
    │       └─► EPIC 3 (Types)
    │               │
    │               └─► EPIC 4 (Machine)
    │                       │
    │                       └─► EPIC 5 (Hooks)
    │
    └─► EPIC 6 (Tests) [can start after EPIC 1]
```

**Parallel opportunities:**
- EPIC 6 (Tests) can start after EPIC 1 completes
- Types and Persistence can be done in parallel after EPIC 1

---

## Verification Checklist

After all EPICs complete:

- [ ] `npm run build` succeeds
- [ ] `npm run test` passes (363+ tests)
- [ ] No TypeScript errors
- [ ] Storage migration works (clear localStorage, refresh)
- [ ] Stage computation uses config thresholds
- [ ] Provenance data persists correctly
- [ ] Existing moments still trigger correctly

---

## DEX Grade Targets

| Pillar | Before | After |
|--------|--------|-------|
| Declarative Sovereignty | C+ | A |
| Provenance as Infrastructure | B- | A |
| Capability Agnosticism | A | A |
| Organic Scalability | A- | A |
