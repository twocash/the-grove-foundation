# Repository Audit — Epic 6: Consumer Migration v2

## Audit Date: 2024-12-24

## Current State Summary

Epics 1-5 created the complete engagement infrastructure:
- `engagementMachine` — XState v5 state machine (24 tests)
- `useLensState` — Lens selection with persistence (11 tests)
- `useJourneyState` — Journey lifecycle management (15 tests)
- `useEntropyState` — Entropy monitoring with threshold detection (12 tests)
- `EngagementProvider` — Context for actor sharing (8 tests)

Epic 6.1 fixed React 19 test infrastructure. All 152 tests now pass.

**This sprint wires the engagement system into the application** by installing `EngagementProvider` and migrating components from `useNarrativeEngine` to the new hooks.

## File Structure Analysis

### Key Files — Engagement System (New)

| File | Purpose | Tests |
|------|---------|-------|
| `src/core/engagement/machine.ts` | XState v5 state machine | 24 |
| `src/core/engagement/hooks/use-lens-state.ts` | Lens hook | 11 |
| `src/core/engagement/hooks/use-journey-state.ts` | Journey hook | 15 |
| `src/core/engagement/hooks/use-entropy-state.ts` | Entropy hook | 12 |
| `src/core/engagement/context.tsx` | Provider + useEngagement | 8 |
| `src/core/engagement/index.ts` | Barrel exports | — |

### Key Files — Legacy System (To Migrate From)

| File | Purpose | Lines |
|------|---------|-------|
| `hooks/NarrativeEngineContext.tsx` | Monolithic context | 694 |
| `hooks/useNarrativeEngine.ts` | Re-export wrapper | 15 |

### Consumer Components

| Component | File | Engagement State Used |
|-----------|------|----------------------|
| JourneyList | `src/explore/JourneyList.tsx` | startJourney, activeJourneyId |
| JourneysModal | `components/Terminal/Modals/JourneysModal.tsx` | schema.journeys (no engagement) |
| JourneyInspector | `src/explore/JourneyInspector.tsx` | activeJourneyId, startJourney, exitJourney |
| LensPicker | `src/explore/LensPicker.tsx` | session.activeLens, selectLens |
| LensInspector | `src/explore/LensInspector.tsx` | getEnabledPersonas (no engagement) |
| NodeGrid | `src/explore/NodeGrid.tsx` | schema only (no engagement) |
| SproutInspector | `src/cultivate/SproutInspector.tsx` | session (no engagement) |
| Terminal | `components/Terminal.tsx` | ALL states + legacy |

## Architecture Assessment

### DEX Compliance

| Area | Status | Notes |
|------|--------|-------|
| Declarative config | ✅ | Engagement machine uses XState declarative states |
| Capability agnostic | ✅ | Hooks work regardless of model capability |
| Single source of truth | ⚠️ | Two systems coexist during migration |

### Violations Found

None in the new engagement system. The migration must avoid introducing:
- Hardcoded conditionals (`if (lens === 'engineer')`)
- New handler callbacks for domain logic
- Implementation-coupled tests

## Test Coverage Assessment

### Current Test State

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Unit | 11 | 152 | Engagement hooks, machine, persistence |
| E2E | 22 | 22 | Terminal flows, journey navigation |
| Integration | — | — | No dedicated files |

### Test Quality

- [x] Tests verify behavior (not implementation)
- [x] Tests use semantic queries  
- [x] Tests report to Health system

### Test Gaps

- [ ] No E2E tests for engagement hook integration
- [ ] No migration verification tests
- [ ] No dual-system coexistence tests

## API Surface Mapping

### Lens State

| NarrativeEngineContext | Engagement Hook | Notes |
|------------------------|-----------------|-------|
| `session.activeLens` | `lens` | Direct mapping |
| `selectLens(id)` | `selectLens(id)` | Same name |

### Journey State

| NarrativeEngineContext | Engagement Hook | Notes |
|------------------------|-----------------|-------|
| `activeJourneyId` | `journey?.id` | Access via journey object |
| `startJourney(id)` | `startJourney(journey)` | Takes full journey object |
| `advanceNode()` | `advanceStep()` | Renamed |
| `exitJourney()` | `exitJourney()` | Same name |
| — | `isActive` | New property |
| — | `journeyProgress` | New property |

### Entropy State

| NarrativeEngineContext | Engagement Hook | Notes |
|------------------------|-----------------|-------|
| `entropyState.currentEntropy` | `entropy` | Simplified |
| `entropyState.threshold` | `entropyThreshold` | Extracted |
| — | `updateEntropy(delta)` | New method |
| — | `resetEntropy()` | New method |

## Technical Debt

1. **Dual context overhead** — Both systems will run simultaneously during migration
2. **API naming inconsistencies** — Some methods renamed between systems
3. **Journey object shape** — New system uses full Journey objects, old uses IDs

## Risk Assessment

| Area | Risk | Mitigation |
|------|------|------------|
| State divergence | Medium | Migrate components fully, don't mix old/new |
| Breaking existing UI | Medium | E2E tests verify user-visible behavior |
| Terminal complexity | High | Terminal.tsx is large; migrate last |
| Provider ordering | Low | EngagementProvider inside NarrativeEngineProvider |

## Recommendations

1. **Install provider first** — Add `EngagementProvider` at app root
2. **Migrate simple components first** — JourneyInspector, JourneyList (low complexity)
3. **Skip non-engagement consumers** — NodeGrid, JourneysModal, LensInspector don't need migration
4. **Terminal last** — Most complex, save for final migration
5. **Full component migration** — Don't mix old/new hooks in same component
6. **E2E verification** — Test each migrated flow manually and with Playwright
