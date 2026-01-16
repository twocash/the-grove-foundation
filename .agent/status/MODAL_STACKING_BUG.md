# Bug Report: Dual Modal Stacking - Old and New Modals Appear Simultaneously

**Reporter:** Jim (User)  
**Date:** 2026-01-15  
**Severity:** HIGH - Blocks user after closing new modal  
**Sprint:** sprout-finishing-room-v1  
**Status:** Root cause identified, fix ready for developer

---

## User Report

> "Confirmed - that's fixed. However, as that new modal is loading the modal you see in the screenshot loads first, and persists underneath it. Closing the new modal, the user is blocked with this abomination of a modal, instead of returning to Explore as expected."

**Screenshot shows:**
- Blue "Research Results - Insufficient Evidence" modal (OLD)
- Appears underneath new Sprout Finishing Room modal
- After closing new modal, old modal remains and blocks user

---

## Expected Behavior

1. User clicks completed sprout (🌻) in GardenTray
2. **ONLY** the new 3-column Sprout Finishing Room modal opens
3. User interacts with modal (view document, use actions)
4. User clicks X to close
5. Modal closes, user returns to Explore page

---

## Actual Behavior

1. User clicks completed sprout in GardenTray ✅
2. **BOTH** modals open simultaneously:
   - New Sprout Finishing Room (z-index: appears on top)
   - Old "Research Results" modal (z-index: underneath)
3. User sees new modal (correct) ✅
4. User clicks X to close new modal ✅
5. ❌ **BUG:** Old blue modal still visible, blocking user
6. ❌ User stuck, must manually close old modal or refresh page

---

## Root Cause Analysis

### The Problem: Two Competing Integration Paths

When a sprout is clicked in GardenTray, there are **TWO code paths** that both run:

#### Path 1: NEW Integration (US-E001) - Correct ✅
```typescript
// File: src/explore/context/ResearchSproutContext.tsx (line 713)
const selectSprout = useCallback((id: string | null) => {
  setSelectedSproutId(id);

  // Dispatch event to open Sprout Finishing Room
  if (id) {
    window.dispatchEvent(new CustomEvent('open-finishing-room', {
      detail: { sproutId: id },
      bubbles: true
    }));
  }
}, []);
```

**Result:** Opens new 3-column Sprout Finishing Room modal (FinishingRoomGlobal in RootLayout.tsx)

#### Path 2: OLD Integration (results-wiring-v1) - Incorrect ❌
```typescript
// File: src/surface/components/KineticStream/ExploreShell.tsx (lines 171-187)
// Sprint: results-wiring-v1 - Auto-open GardenInspector when a sprout is selected from GardenTray
const lastOpenedSproutIdRef = React.useRef<string | null>(null);
React.useEffect(() => {
  if (!selectedSproutId) {
    lastOpenedSproutIdRef.current = null;
    return;
  }

  // Prevent re-opening for the same sprout
  if (lastOpenedSproutIdRef.current === selectedSproutId) {
    return;
  }

  // Open the overlay - GardenInspector will handle fetching the correct data
  lastOpenedSproutIdRef.current = selectedSproutId;
  setOverlay({ type: 'garden-inspector' });  // ❌ THIS IS THE PROBLEM
}, [selectedSproutId]);
```

**Result:** Opens old GardenInspector overlay with ResearchResultsView (blue modal)

### Why Both Run

The `selectSprout()` function sets `selectedSproutId` state (line 713 in ResearchSproutContext.tsx):
```typescript
setSelectedSproutId(id);  // This triggers ExploreShell's useEffect
```

**Sequence:**
1. User clicks sprout → `selectSprout(id)` called
2. `setSelectedSproutId(id)` updates state
3. Event dispatched → ✅ New modal opens
4. ExploreShell detects `selectedSproutId` change → ❌ Old modal opens
5. Both modals now visible

---

## The Fix

**Option 1: Remove Old Integration (Recommended)**

The new Sprout Finishing Room modal is the replacement for the old GardenInspector results view. Remove the old integration entirely.

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`  
**Lines to DELETE:** 171-187

```typescript
// DELETE THIS ENTIRE BLOCK:

// Sprint: results-wiring-v1 - Auto-open GardenInspector when a sprout is selected from GardenTray
// Fix: Removed researchSprouts from dependencies to prevent flashing from array reference changes
// The overlay opens once when selectedSproutId changes; GardenInspector handles its own data lookup
const lastOpenedSproutIdRef = React.useRef<string | null>(null);
React.useEffect(() => {
  if (!selectedSproutId) {
    lastOpenedSproutIdRef.current = null;
    return;
  }

  // Prevent re-opening for the same sprout
  if (lastOpenedSproutIdRef.current === selectedSproutId) {
    return;
  }

  // Open the overlay - GardenInspector will handle fetching the correct data
  lastOpenedSproutIdRef.current = selectedSproutId;
  setOverlay({ type: 'garden-inspector' });
}, [selectedSproutId]);
```

**Rationale:**
- US-E001 introduced the new event-based integration
- The old state-based integration is now redundant
- GardenInspector overlay is still accessible via other paths (e.g., creating new sprout)
- Only the "view completed sprout" path should use the new modal

---

**Option 2: Feature Flag (If Gradual Rollout Needed)**

If you want to keep both temporarily:

```typescript
React.useEffect(() => {
  // Check if new Sprout Finishing Room is enabled
  const useFinishingRoom = true; // TODO: Replace with feature flag
  
  if (useFinishingRoom) {
    // New modal handles this via event - skip old integration
    return;
  }

  // OLD CODE (fallback)
  if (!selectedSproutId) {
    lastOpenedSproutIdRef.current = null;
    return;
  }

  if (lastOpenedSproutIdRef.current === selectedSproutId) {
    return;
  }

  lastOpenedSproutIdRef.current = selectedSproutId;
  setOverlay({ type: 'garden-inspector' });
}, [selectedSproutId]);
```

But this is **NOT recommended** - simpler to just remove the old code.

---

## Verification Steps

After applying fix:

### Step 1: Navigate to Explore
```
http://localhost:8080/explore
```

### Step 2: Open GardenTray
- Hover over right edge
- Tray expands showing sprouts

### Step 3: Click completed sprout (🌻)
- Click any sprout with completed status
- **Verify:** ONLY new 3-column modal opens
- **Verify:** NO blue "Research Results" modal underneath

### Step 4: Close modal
- Click X button on new modal
- **Verify:** Modal closes completely
- **Verify:** User returns to Explore page
- **Verify:** NO leftover modal blocking screen

### Step 5: Test console (optional)
```javascript
// Trigger event directly
window.dispatchEvent(new CustomEvent('open-finishing-room', {
  detail: { sproutId: 'any-valid-id' }
}));
```
- **Verify:** ONLY new modal opens
- **Verify:** NO old modal appears

---

## Files Involved

| File | Lines | Issue | Action |
|------|-------|-------|--------|
| `src/surface/components/KineticStream/ExploreShell.tsx` | 171-187 | Old integration triggers GardenInspector overlay | **DELETE** useEffect block |
| `src/explore/context/ResearchSproutContext.tsx` | 713-725 | New integration dispatches event | ✅ Keep as-is (working correctly) |
| `src/router/RootLayout.tsx` | 185-310 | FinishingRoomGlobal listens for event | ✅ Keep as-is (working correctly) |
| `src/explore/GardenInspector.tsx` | 163 | Renders ResearchResultsView | ✅ Keep (still used for other flows) |
| `src/explore/components/ResearchResultsView.tsx` | All | Old modal component | ✅ Keep (may be used elsewhere) |

---

## Impact Assessment

### What Gets Removed
- Auto-opening GardenInspector overlay when clicking sprout in GardenTray

### What Still Works
- GardenInspector overlay for **creating new sprouts** (confirmation flow)
- GardenInspector overlay for **viewing active sprouts** (progress view)
- All other GardenTray functionality (search, filter, status badges)
- New Sprout Finishing Room modal (the replacement)

### Migration Path
Users clicking completed sprouts will now see:
- **Before:** Old blue "Research Results" modal via GardenInspector
- **After:** New 3-column Sprout Finishing Room modal

This is the **intended behavior** from sprint sprout-finishing-room-v1.

---

## Success Criteria

Bug is fixed when:
- ✅ Click sprout in GardenTray
- ✅ ONLY new Sprout Finishing Room modal opens
- ✅ NO old blue modal appears
- ✅ Close modal → Returns to Explore cleanly
- ✅ No leftover modals blocking user

---

## Related Sprint Context

**Sprint:** sprout-finishing-room-v1  
**User Story:** US-E001 - GardenTray entry point + event wiring

**Previous bug fixed:** Data source mismatch (FinishingRoomGlobal looking in localStorage instead of Supabase) - ✅ Resolved

**Current bug:** Dual modal stacking due to competing integration paths - ⚠️ Awaiting developer fix

**Integration approach:** Event-based decoupling (CustomEvent 'open-finishing-room')

---

*Bug documented by Randy - Chief of Staff v1.2*  
*"One modal to rule them all. Delete the old integration."*
