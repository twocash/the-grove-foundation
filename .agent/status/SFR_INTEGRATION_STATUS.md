# Sprout Finishing Room Integration Status

**Date:** 2026-01-15
**Reporter:** Randy (Chief of Staff)
**Issue:** Modal not accessible from UI

---

## Problem

User clicks on sprouts in `/explore` → GardenTray, but the **old modal** opens instead of the new **Sprout Finishing Room** modal.

**Root Cause:** Event wiring incomplete in US-E001.

---

## Current State

### ✅ What's Complete

| Component | Status | Location |
|-----------|--------|----------|
| SproutFinishingRoom | ✅ Built | `src/surface/components/modals/SproutFinishingRoom/` |
| ActionPanel | ✅ Built | All 6 US (D001-D005, E001) complete |
| E2E Tests | ✅ Passing | 9/9 tests pass |
| Global Listener | ✅ Wired | `RootLayout.tsx` line 105 |
| GardenTray UI | ✅ Built | Select sprout works |

### ❌ What's Missing

**Event dispatch from GardenTray → FinishingRoom**

```typescript
// This line is MISSING from ResearchSproutContext.tsx
window.dispatchEvent(new CustomEvent('open-finishing-room', {
  detail: { sproutId: id }
}));
```

---

## How It Should Work

```
User clicks sprout in GardenTray
       ↓
SproutRow calls onSelect(sproutId)
       ↓
GardenTray passes to selectSprout(sproutId)
       ↓
ResearchSproutContext.selectSprout() dispatches event  ← MISSING!
       ↓
window.dispatchEvent('open-finishing-room', { sproutId })
       ↓
FinishingRoomGlobal hears event (RootLayout.tsx line 105)
       ↓
Loads sprout from localStorage
       ↓
Opens SproutFinishingRoom modal ✨
```

**Currently:** Steps 1-3 happen, then nothing (step 4 missing).

---

## The Fix

### File: `src/explore/context/ResearchSproutContext.tsx`

**Find:** (around line 713)
```typescript
const selectSprout = useCallback((id: string | null) => {
  setSelectedSproutId(id);
}, []);
```

**Replace with:**
```typescript
const selectSprout = useCallback((id: string | null) => {
  setSelectedSproutId(id);

  // Sprint: sprout-finishing-room-v1, US-E001
  // Dispatch event to open Sprout Finishing Room
  if (id) {
    console.log('[ResearchSproutContext] Opening Sprout Finishing Room for:', id);
    window.dispatchEvent(new CustomEvent('open-finishing-room', {
      detail: { sproutId: id },
      bubbles: true
    }));
  }
}, []);
```

---

## How to Test the Fix

### 1. Apply the fix above

### 2. Refresh browser at http://localhost:8080

### 3. Navigate to `/explore`

### 4. Look for GardenTray on right side (slide-out panel with 🌱)

### 5. Hover to expand it

### 6. Click on any sprout with 🌻 emoji (completed status)

**Expected:** New Sprout Finishing Room modal opens with:
- 3-column layout
- Provenance panel (left)
- Document viewer (center)
- Action panel (right) with all 6 features

**Currently:** Nothing happens OR old modal opens

---

## Alternative: Manual Test in Console

If you want to test the modal without fixing the code:

### Open browser console on http://localhost:8080

### Run this:
```javascript
// Get a sprout ID from localStorage
const sprouts = JSON.parse(localStorage.getItem('grove-sprouts') || '[]');
const sproutId = sprouts[0]?.id;

if (sproutId) {
  // Manually dispatch the event
  window.dispatchEvent(new CustomEvent('open-finishing-room', {
    detail: { sproutId }
  }));
  console.log('Dispatched event for sprout:', sproutId);
} else {
  console.log('No sprouts in localStorage. Create one first.');
}
```

**Result:** Modal should open immediately.

---

## Why US-E001 Was Marked Complete

From commit `662ff17`:
> "GardenTray wiring pattern documented for implementation."

This means:
- ✅ ActionPanel integration done
- ✅ Event listener registered (RootLayout)
- ✅ Pattern documented
- ❌ **Event dispatch NOT implemented**

**Developer Note:** Commit message indicated incomplete work ("documented for implementation"), but sprint was marked COMPLETE. This is a 5-minute fix that completes the user story.

---

## Complete Fix PR Checklist

If creating a PR to fix this:

- [ ] Add event dispatch to `ResearchSproutContext.tsx`
- [ ] Test in browser (click sprout → modal opens)
- [ ] Update E2E test to verify GardenTray integration
- [ ] Screenshot of modal opening from GardenTray click
- [ ] Update sprint status: US-E001 truly complete

**Estimated time:** 10 minutes

---

*Randy - Chief of Staff v1.2*
*"Found the missing link. One CustomEvent away from working."*
