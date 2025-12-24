# Specification — Epic 6: Consumer Migration v2

## Overview

Wire the engagement infrastructure (Epics 1-5) into the Grove application by installing `EngagementProvider` at the app root and migrating components from `useNarrativeEngine` to the new engagement hooks (`useLensState`, `useJourneyState`, `useEntropyState`).

## Goals

1. Install `EngagementProvider` so engagement hooks work throughout the app
2. Migrate components that use engagement state to new hooks
3. Maintain existing functionality during migration (dual-system coexistence)
4. Verify migration with E2E tests

## Non-Goals

- Remove `NarrativeEngineContext` (Epic 7)
- Migrate non-engagement features (schema, cards, threads)
- Change UI behavior or appearance
- Refactor component logic beyond hook replacement

## Success Criteria

After this sprint:
1. `EngagementProvider` wraps the app at root level
2. Components using lens/journey/entropy state use new hooks
3. All existing E2E tests pass
4. New E2E migration test confirms integration works
5. All 152 unit tests continue to pass

## Acceptance Criteria

### Functional Requirements

- [ ] AC-1: `EngagementProvider` installed inside `NarrativeEngineProvider`
- [ ] AC-2: At least one component migrated from `useNarrativeEngine` to engagement hooks
- [ ] AC-3: Migrated components function identically to before
- [ ] AC-4: Both old and new systems coexist without conflicts

### Test Requirements (MANDATORY)

- [ ] AC-T1: E2E test verifies app loads with EngagementProvider
- [ ] AC-T2: E2E test verifies migrated component behavior
- [ ] AC-T3: All 152 unit tests pass
- [ ] AC-T4: All 22 E2E tests pass
- [ ] AC-T5: Health check passes: `npm run health`

### DEX Compliance

- [ ] AC-D1: No new hardcoded handlers added
- [ ] AC-D2: Migration uses declarative hook composition
- [ ] AC-D3: No implementation-detail tests added

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| xstate | State machine | 5.x (already installed) |
| @testing-library/react | Hook testing | 16.x (already installed) |

## Migration Priority

Based on complexity and dependency analysis:

| Priority | Component | Reason |
|----------|-----------|--------|
| 1 | Provider Install | Required for all migrations |
| 2 | JourneyInspector | Simple, journey-only |
| 3 | JourneyList | Simple, journey-only |
| 4 | LensPicker | Medium, lens + session |
| 5 | Terminal | Complex, all states |

### Components NOT Migrating

| Component | Reason |
|-----------|--------|
| JourneysModal | Uses schema only, no engagement state |
| LensInspector | Uses getEnabledPersonas only |
| NodeGrid | Uses schema only |
| SproutInspector | Uses session only, no engagement state |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| State divergence | Medium | High | Migrate fully, don't mix |
| Breaking Terminal | Medium | High | Migrate Terminal last |
| Provider race conditions | Low | Medium | Test dual-provider scenario |

## Out of Scope

- Removing `NarrativeEngineContext` (deferred to Epic 7)
- Migrating thread management
- Migrating card navigation
- Changing any visual UI
- Performance optimization
