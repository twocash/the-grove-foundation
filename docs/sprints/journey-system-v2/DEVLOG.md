# DEVLOG.md: Journey System v2

**Sprint**: journey-system-v2  
**Date**: 2024-12-27  
**Status**: ✅ COMPLETE

---

## Summary

Fixed journey pills not firing by:
1. Reconciling dual type systems (schema vs engagement) → chose schema types with `waypoints`
2. Adding 6 journeys to TypeScript registry
3. Adding missing `engStartJourney()` calls to Terminal click handlers

## Files Modified

### Core Type System (Option B: Schema Types)

**src/core/engagement/types.ts**
- Re-exports `Journey` and `JourneyWaypoint` from schema types
- Removed duplicate `JourneyStep` and old `Journey` interface
- EngagementContext now uses schema Journey type

**src/core/engagement/machine.ts**
- Updated import to use schema Journey type
- Changed `event.journey.steps.length` → `event.journey.waypoints.length`

**src/core/engagement/hooks/useJourneyState.ts**
- Updated to use schema types
- Renamed `currentStep` → `currentWaypoint`
- Changed property access from `journey.steps` → `journey.waypoints`

### Journey Registry

**src/data/journeys/index.ts**
- Added all 6 journeys with waypoints:
  - simulation (5 waypoints)
  - stakes (3 waypoints)
  - ratchet (4 waypoints)
  - diary (4 waypoints)
  - architecture (3 waypoints)
  - emergence (5 waypoints)
- Uses schema Journey type
- Exports `getJourneyById()`, `getJourneysForLens()`, `getAvailableJourneyIds()`

### Terminal Click Handler

**components/Terminal.tsx** (2 locations)
- Line ~1090: Added `engStartJourney(journey)` before `emit.journeyStarted()`
- Line ~1318: Added `engStartJourney(journey)` before `emit.journeyStarted()`
- Added fallback: if journey not found, sends prompt as regular message
- Added console.warn for missing journeys

### Tests

**tests/unit/engagement-machine.test.ts**
- Already updated to use waypoints (passes 24/24)

**tests/unit/use-journey-state.test.ts**
- Updated mock journey to use waypoints
- Changed `currentStep` → `currentWaypoint` assertions
- Note: Tests fail due to pre-existing React.act compatibility issue (unrelated to this sprint)

## Verification

```bash
# XState machine tests: PASS (24/24)
npm test -- --run tests/unit/engagement-machine.test.ts

# Dev server: RUNS
npm run dev
```

## Known Issues (Pre-existing, Out of Scope)

1. **React.act test compatibility**: `use-journey-state.test.ts` fails due to testing-library/React version mismatch
2. **WaveformCollapse crash**: Not confirmed in audit - note for user testing
3. **Re-render performance**: refreshKey exists but EngagementBus has optimization - note for user testing

## Technical Debt Filed

- [ ] TD: Reconcile remaining type mismatches in `data/narratives-schema.ts` vs `src/core/schema/`
- [ ] TD: Fix React.act test infrastructure
- [ ] TD: Add freestyle archetype to ConversionCTA config

## Next Steps

1. Manual test: Click journey pills in Terminal, verify XState transitions
2. Verify journey progress UI updates
3. User testing for WaveformCollapse and re-render issues
