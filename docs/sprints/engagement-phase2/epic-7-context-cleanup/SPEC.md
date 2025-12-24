# Epic 7: Context Cleanup - Specification

**Version:** 1.0
**Date:** 2024-12-24
**Status:** Ready for Implementation

---

## 1. Goals

### Primary Goal
Remove ~200 lines of duplicate state management code from `NarrativeEngineContext.tsx`, now that engagement hooks handle lens, journey, and entropy state.

### Secondary Goals
1. Simplify the `NarrativeEngineContextType` interface
2. Update consumers to remove dead imports
3. Clean up unused localStorage persistence code
4. Reduce cognitive overhead for future development

---

## 2. Non-Goals

- **NOT** removing NarrativeEngineContext entirely (it provides schema access)
- **NOT** migrating session tracking (exchangeCount, visitedCards, etc.)
- **NOT** touching first-time user detection logic
- **NOT** removing legacy thread methods (deprecated but used)
- **NOT** refactoring component logic beyond import cleanup
- **NOT** adding new tests (existing 152 tests cover behavior)

---

## 3. Success Criteria

### SC-1: Build Success
- [ ] TypeScript compilation passes with no errors
- [ ] All 152 unit tests pass
- [ ] Build completes successfully

### SC-2: Interface Reduction
- [ ] Remove 14 fields from NarrativeEngineContextType
- [ ] Interface reduced from ~50 to ~36 fields

### SC-3: Code Reduction
- [ ] NarrativeEngineContext.tsx reduced from 694 to ~500 lines
- [ ] ~194 lines removed (lens, journey, entropy state)

### SC-4: Consumer Cleanup
- [ ] Terminal.tsx: dead imports removed
- [ ] JourneyInspector.tsx: verified clean
- [ ] JourneyList.tsx: verified clean
- [ ] LensPicker.tsx: verified clean

### SC-5: Runtime Verification
- [ ] Dev server starts without errors
- [ ] Lens selection works via engagement hooks
- [ ] Journey start/advance/exit works via engagement hooks
- [ ] Session tracking (exchangeCount) still works

---

## 4. Acceptance Criteria

### AC-1: Lens State Removed
- `selectLens` callback removed from context
- Lens localStorage persistence removed from session effect
- Interface field removed

### AC-2: Journey State Removed
- `startJourney`, `advanceNode`, `exitJourney` callbacks removed
- `activeJourneyId`, `currentNodeId`, `visitedNodes` removed from interface
- Journey-related session state updates removed

### AC-3: Entropy State Removed
- `entropyState` useState removed
- All entropy callbacks removed (evaluateEntropy, checkShouldInject, etc.)
- Entropy localStorage persistence removed
- Entropy imports from entropyDetector removed

### AC-4: Consumers Updated
- Terminal.tsx imports only what NarrativeEngineContext still provides
- No TypeScript errors in any component

---

## 5. Out of Scope

| Item | Reason |
|------|--------|
| Session tracking | Not duplicated, still needed |
| First-time user detection | Not duplicated, still needed |
| Legacy thread methods | Deprecated but still referenced |
| Schema loading | Core functionality |
| Persona/card/node getters | Schema access, not state |

---

## 6. Dependencies

### Required Before Starting
- ✅ Epic 6 complete (consumer migration)
- ✅ All 152 tests passing
- ✅ Build succeeds

### No External Dependencies
This is purely internal refactoring.

---

## 7. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Remove something still used | Low | High | TypeScript catches immediately |
| Break runtime behavior | Low | High | Test suite + manual verification |
| Confuse session.visitedNodes with journey state | Medium | Medium | Careful review of what stays |

---

## 8. Deliverables

1. Updated `hooks/NarrativeEngineContext.tsx` (~500 lines, down from 694)
2. Updated `components/Terminal.tsx` (dead imports removed)
3. Verified clean: `src/explore/JourneyInspector.tsx`
4. Verified clean: `src/explore/JourneyList.tsx`
5. Verified clean: `src/explore/LensPicker.tsx`
6. All tests passing
7. Clean build
