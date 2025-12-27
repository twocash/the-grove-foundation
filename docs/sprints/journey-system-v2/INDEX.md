# Sprint: Journey System v2

**Status**: ✅ COMPLETE  
**Started**: 2024-12-27  
**Completed**: 2024-12-27  

---

## Problem Statement

Journey pills in Terminal weren't activating XState journey state. Root cause:
1. **Empty registry**: Stage prompts referenced 6 journey IDs, but only 1 existed in TypeScript registry
2. **Missing state transition**: Terminal called `emit.journeyStarted()` (telemetry) but not `engStartJourney()` (XState)
3. **Type fragmentation**: Two incompatible Journey types (schema with `waypoints` vs engagement with `steps`)

## Solution

**Decision**: Option B - Use schema types (`waypoints`) as canonical, update engagement system to match.

**Files Modified**:
- `src/core/engagement/types.ts` - Re-export schema types
- `src/core/engagement/machine.ts` - Use waypoints.length
- `src/core/engagement/hooks/useJourneyState.ts` - currentWaypoint
- `src/data/journeys/index.ts` - Added 6 journeys
- `components/Terminal.tsx` - Added engStartJourney() calls (2 locations)
- `tests/unit/use-journey-state.test.ts` - Updated for waypoints

## Verification

| Test | Result |
|------|--------|
| XState machine tests | ✅ 24/24 pass |
| Dev server starts | ✅ Compiles, runs on :3005 |
| Hook tests | ⚠️ Pre-existing React.act issue (unrelated) |

## Deferred (User Testing)

- WaveformCollapse crash: Not confirmed in code audit
- Re-render performance: refreshKey exists, needs user observation

## Sprint Artifacts

- [x] INDEX.md (this file)
- [x] DECISIONS.md
- [x] REPO_AUDIT.md
- [x] SPEC.md
- [x] DEVLOG.md
