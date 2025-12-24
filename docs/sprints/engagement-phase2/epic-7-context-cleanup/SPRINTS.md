# Epic 7: Context Cleanup - Sprint Breakdown

**Version:** 1.0
**Date:** 2024-12-24

---

## Epic Overview

| Epic | Description | Priority | Complexity |
|------|-------------|----------|------------|
| 7 | Remove duplicate state from NarrativeEngineContext | High | Medium |

**Estimated Time:** 1-2 hours
**Files Modified:** 2 (NarrativeEngineContext.tsx, Terminal.tsx)
**Files Verified:** 3 (JourneyInspector.tsx, JourneyList.tsx, LensPicker.tsx)

---

## Story Breakdown

### Story 7.1: Remove Interface Fields
**Points:** 1
**Time:** 10 min

**Tasks:**
1. Open `hooks/NarrativeEngineContext.tsx`
2. Find `NarrativeEngineContextType` interface (line ~187)
3. Remove 14 fields (lens, journey, entropy)
4. Run `npm run build` - expect errors

**Acceptance:**
- [ ] Interface has ~36 fields (down from ~50)
- [ ] TypeScript errors show missing callbacks

---

### Story 7.2: Remove Entropy State & Callbacks
**Points:** 2
**Time:** 15 min

**Tasks:**
1. Delete `entropyState` useState (line ~264)
2. Delete `STORAGE_KEY_ENTROPY` constant (line ~33)
3. Delete entropy load effect (lines ~358-368)
4. Delete entropy persist effect (lines ~370-377)
5. Delete `evaluateEntropy` callback
6. Delete `checkShouldInject` callback
7. Delete `recordEntropyInjection` callback
8. Delete `recordEntropyDismiss` callback
9. Delete `tickEntropyCooldown` callback
10. Delete `getJourneyIdForCluster` callback
11. Update `resetSession` - remove entropy references
12. Run `npm run build` - expect errors

**Acceptance:**
- [ ] No entropyState in provider
- [ ] No entropy localStorage persistence
- [ ] resetSession doesn't reference entropy

---

### Story 7.3: Remove Journey Callbacks
**Points:** 2
**Time:** 15 min

**Tasks:**
1. Delete `startJourney` callback (lines ~462-502)
2. Delete `advanceNode` callback (lines ~504-521)
3. Delete `exitJourney` callback (lines ~523-526)
4. Run `npm run build` - expect errors

**Acceptance:**
- [ ] No startJourney callback
- [ ] No advanceNode callback
- [ ] No exitJourney callback

---

### Story 7.4: Remove Lens Callback
**Points:** 1
**Time:** 5 min

**Tasks:**
1. Delete `selectLens` callback (lines ~370-376)
2. Run `npm run build` - expect errors

**Acceptance:**
- [ ] No selectLens callback

---

### Story 7.5: Update Context Value Object
**Points:** 1
**Time:** 10 min

**Tasks:**
1. Find `value` object (line ~630)
2. Remove all 14 deleted fields from value
3. Run `npm run build` - should pass now

**Acceptance:**
- [ ] Value object matches interface
- [ ] Build passes

---

### Story 7.6: Remove Unused Imports
**Points:** 1
**Time:** 5 min

**Tasks:**
1. Find entropy imports from entropyDetector (lines ~17-27)
2. Delete entire import or remove specific items
3. Run `npm run build` - should pass

**Acceptance:**
- [ ] No entropy-related imports
- [ ] Build still passes

---

### Story 7.7: Update Terminal.tsx Imports
**Points:** 2
**Time:** 15 min

**Tasks:**
1. Open `components/Terminal.tsx`
2. Find useNarrativeEngine destructuring (lines ~130-161)
3. Remove: selectLens, startJourney, advanceNode, exitJourney
4. Remove: activeJourneyId, currentNodeId (if not used elsewhere)
5. Remove: visitedNodes (if not used elsewhere)
6. Remove: all entropy fields
7. Search file for any remaining references to removed fields
8. Run `npm run build`
9. Run `npm test`

**Acceptance:**
- [ ] Terminal only imports available fields
- [ ] No TypeScript errors
- [ ] All tests pass

---

### Story 7.8: Verify Other Consumers
**Points:** 1
**Time:** 10 min

**Tasks:**
1. Check `src/explore/JourneyInspector.tsx` line 15
2. Check `src/explore/JourneyList.tsx` line 139
3. Check `src/explore/LensPicker.tsx` line 340
4. Verify none import removed fields
5. If any do, update them

**Acceptance:**
- [ ] All consumers compile
- [ ] No runtime errors

---

## Build Gates

| After Story | Gate Command | Expected |
|-------------|--------------|----------|
| 7.1 | `npm run build` | TS errors (callbacks missing) |
| 7.2 | `npm run build` | TS errors (callbacks missing) |
| 7.3 | `npm run build` | TS errors (callbacks missing) |
| 7.4 | `npm run build` | TS errors (callbacks missing) |
| 7.5 | `npm run build` | PASS |
| 7.6 | `npm run build` | PASS |
| 7.7 | `npm run build && npm test` | PASS (152 tests) |
| 7.8 | `npm run build && npm test` | PASS (152 tests) |

---

## Commit Sequence

| # | Commit Message | Files |
|---|----------------|-------|
| 1 | `refactor(narrative): remove entropy state and callbacks` | NarrativeEngineContext.tsx |
| 2 | `refactor(narrative): remove journey callbacks` | NarrativeEngineContext.tsx |
| 3 | `refactor(narrative): remove lens callback` | NarrativeEngineContext.tsx |
| 4 | `refactor(narrative): update interface and value object` | NarrativeEngineContext.tsx |
| 5 | `refactor(narrative): remove unused imports` | NarrativeEngineContext.tsx |
| 6 | `refactor(terminal): remove dead narrative imports` | Terminal.tsx |
| 7 | `chore: verify consumer imports` | (verify only, may be no changes) |

---

## Rollback Plan

If issues arise:
1. `git checkout HEAD~N -- hooks/NarrativeEngineContext.tsx`
2. `git checkout HEAD~N -- components/Terminal.tsx`

The engagement hooks remain unchanged, so rollback is safe.

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| NarrativeEngineContext.tsx lines | 694 | ~500 |
| Interface fields | ~50 | ~36 |
| Entropy imports | 9 | 0 |
| Unit tests passing | 152 | 152 |
| Build status | Pass | Pass |
