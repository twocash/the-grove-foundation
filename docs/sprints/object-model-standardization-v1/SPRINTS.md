# Sprint Breakdown — Object Model Standardization

## Overview

| Metric | Value |
|--------|-------|
| Epics | 5 |
| Stories | 15 |
| Estimated Time | 3-4 hours |
| Risk Level | Low (surgical changes, no new dependencies) |

---

## Epic 1: Fix Lens Flow Root Cause

**Goal**: Selecting a lens closes inspector and returns to chat

### Story 1.1: Fix handleSelect in LensPicker
- **File**: `src/explore/LensPicker.tsx`
- **Change**: Replace `openInspector` with `closeInspector` + `navigateTo`
- **Commit**: `fix: lens selection closes inspector and returns to chat`

### Story 1.2: Fix button handler in LensInspector
- **File**: `src/explore/LensInspector.tsx`
- **Change**: Update button onClick to use handleActivate with closeInspector
- **Commit**: `fix: lens inspector button properly closes inspector`

### Build Gate
```bash
npm run build
# Manual: Select a lens, verify inspector closes
```

---

## Epic 2: Fix Journey Flow Parity

**Goal**: Journey selection matches lens behavior

### Story 2.1: Add closeInspector to handleStart in JourneyList
- **File**: `src/explore/JourneyList.tsx`
- **Change**: Add `closeInspector()` call before navigation
- **Commit**: `fix: journey selection closes inspector`

### Story 2.2: Verify JourneyInspector (no changes)
- **File**: `src/explore/JourneyInspector.tsx`
- **Verify**: handleStart already includes closeInspector
- **Commit**: None (verification only)

### Build Gate
```bash
npm run build
# Manual: Start a journey, verify inspector closes
```

---

## Epic 3: Add Visual Highlight for Inspected State

**Goal**: Cards show ring highlight when their details are in the inspector

### Story 3.1: Derive inspectedLensId in LensPicker
- **File**: `src/explore/LensPicker.tsx`
- **Change**: Add logic to derive which lens is being inspected from context
- **Commit**: `feat: derive inspected lens from workspace context`

### Story 3.2: Add isInspected prop to LensCard
- **File**: `src/explore/LensPicker.tsx`
- **Change**: Update interface, className, and prop passing
- **Commit**: `feat: LensCard shows ring highlight when inspected`

### Story 3.3: Add isInspected prop to CustomLensCard
- **File**: `src/explore/LensPicker.tsx`
- **Change**: Same pattern with violet variant
- **Commit**: `feat: CustomLensCard shows violet ring when inspected`

### Story 3.4: Derive inspectedJourneyId in JourneyList
- **File**: `src/explore/JourneyList.tsx`
- **Change**: Add logic to derive which journey is being inspected
- **Commit**: `feat: derive inspected journey from workspace context`

### Story 3.5: Add isInspected prop to JourneyCard
- **File**: `src/explore/JourneyList.tsx`
- **Change**: Update interface, className, and prop passing
- **Commit**: `feat: JourneyCard shows ring highlight when inspected`

### Build Gate
```bash
npm run build
# Manual: Click card body, verify ring appears
# Manual: Click different card, verify ring moves
```

---

## Epic 4: Button Style Consistency

**Goal**: Lens "Select" button matches Journey "Start" button style

### Story 4.1: Update LensCard button to filled style
- **File**: `src/explore/LensPicker.tsx`
- **Change**: Replace ghost/outline style with `bg-primary text-white`
- **Commit**: `style: lens select button uses filled primary style`

### Story 4.2: Update CustomLensCard button to filled violet style
- **File**: `src/explore/LensPicker.tsx`
- **Change**: Replace ghost/outline with `bg-violet-500 text-white`
- **Commit**: `style: custom lens select button uses filled violet style`

### Build Gate
```bash
npm run build
# Manual: Verify button styles match between flows
```

---

## Epic 5: E2E Automated Tests

**Goal**: Automated regression tests for selection flows

### Story 5.1: Create object-model-selection.spec.ts
- **File**: `tests/e2e/object-model-selection.spec.ts`
- **Tests**:
  - Lens card click opens inspector with ring highlight
  - Lens Select button activates and closes inspector
  - Journey card click opens inspector with ring highlight
  - Journey Start button activates and closes inspector
  - Inspector primary buttons match card button behavior
- **Commit**: `test: add E2E tests for object model selection flows`

### Build Gate
```bash
npm run test:e2e
# All new tests pass
```

---

## Manual Test Scenarios

Verify after all changes (in addition to automated tests):

| # | Scenario | Expected Result | Status |
|---|----------|-----------------|--------|
| 1 | Open Lenses, click 'Concerned Citizen' card body | Card shows ring-2 highlight, Inspector shows lens details | ☐ |
| 2 | With inspector open, click 'Academic' card body | Ring moves to Academic card, Inspector updates | ☐ |
| 3 | Click 'Select' button on any lens card | Lens activates, Inspector closes, Chat view appears | ☐ |
| 4 | In Inspector, click 'Select Lens' button | Same as #3: activates, closes, returns to Chat | ☐ |
| 5 | Open Journeys, click 'Ghost in the Machine' card | Card shows ring-2 highlight, Inspector shows journey details | ☐ |
| 6 | Click 'Start' on journey card | Journey starts, Inspector closes, Chat view appears | ☐ |
| 7 | In Journey Inspector, click 'Start Journey' | Same as #6: starts, closes, returns to Chat | ☐ |
| 8 | Select a lens that is already active | Button shows 'Return to Chat', clicking returns without re-selecting | ☐ |
| 9 | View Custom Lens card | Uses violet ring-2 variant, same interaction pattern | ☐ |
| 10 | Use compact mode (chat nav) to switch lens | Selection works, returns to chat via onBack callback | ☐ |

---

## Final Verification

```bash
# Build passes
npm run build

# Unit/integration tests pass
npm test

# E2E tests pass
npm run test:e2e

# All manual scenarios pass
# (documented in DEVLOG.md)
```

## Commit Sequence

1. `fix: lens selection closes inspector and returns to chat`
2. `fix: lens inspector button properly closes inspector`
3. `fix: journey selection closes inspector`
4. `feat: derive inspected lens from workspace context`
5. `feat: LensCard shows ring highlight when inspected`
6. `feat: CustomLensCard shows violet ring when inspected`
7. `feat: derive inspected journey from workspace context`
8. `feat: JourneyCard shows ring highlight when inspected`
9. `style: lens select button uses filled primary style`
10. `style: custom lens select button uses filled violet style`
11. `test: add E2E tests for object model selection flows`

Or combine into fewer commits:
1. `fix: selection flows close inspector and return to chat`
2. `feat: cards show ring highlight when inspected`
3. `style: button consistency across lens and journey flows`
4. `test: E2E tests for object model selection flows`
