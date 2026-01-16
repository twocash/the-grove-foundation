# Bug Report: Sprout Finishing Room Not Accessible from UI

**Reporter:** Jim (User)
**Date:** 2026-01-15
**Severity:** HIGH - Feature complete but not accessible
**Sprint:** sprout-finishing-room-v1

---

## User Report

> "honestly, the first user test in the how to test is a fail"

**Screenshot shows:**
- URL: `localhost:8080/explore`
- OLD modal visible ("Research Results - Insufficient Evidence")
- NO GardenTray visible on right side
- Expected: New 3-column Sprout Finishing Room modal

---

## Expected Behavior

1. Navigate to http://localhost:8080/explore
2. GardenTray appears on right edge (vertical panel with 🌱)
3. Hover to expand tray
4. Click completed sprout (🌻)
5. New Sprout Finishing Room modal opens

---

## Actual Behavior

1. Navigate to http://localhost:8080/explore ✅
2. No GardenTray visible ❌
3. Old results modal showing instead ❌

---

## Investigation Results

### ✅ Components Exist

```bash
$ grep -n "GardenTray" src/surface/components/KineticStream/ExploreShell.tsx
51:import { GardenTray } from '@explore/components/GardenTray';
944:      <GardenTray />
```

**GardenTray IS imported and rendered** in ExploreShell.

### ✅ Event Wiring Added

File: `src/explore/context/ResearchSproutContext.tsx` (line 713)
Event dispatch code WAS added by Randy (ChiefOfStaff).

### ❌ Build Status Unknown

Randy started `npm run build` but command is running in background.
User needs fresh build to see changes.

### ❌ Possible Issues

1. **Build not complete** - Changes to ResearchSproutContext.tsx not in dist/
2. **ResearchSproutProvider not wrapping route** - Context missing
3. **GardenTray rendering but not visible** - CSS/z-index issue
4. **Route structure different than expected** - /explore not using ExploreShell

---

## Developer Tasks

### Task 1: Verify Build

```bash
# Stop any running builds
taskkill /F /IM node.exe

# Clean build
npm run build

# Restart server
npm start
```

### Task 2: Check if ResearchSproutProvider wraps /explore route

Look at routing structure:
- Does `/explore` route use ExploreShell?
- Is ResearchSproutProvider wrapping it?
- Is GardenTray actually in the component tree?

**Files to check:**
- `src/router/` - Route configuration
- `src/surface/components/KineticStream/ExploreShell.tsx` (line 944)

### Task 3: Browser DevTools Inspection

In browser at http://localhost:8080/explore:

1. Open DevTools (F12)
2. Search DOM for `data-testid="garden-tray"` - Does it exist?
3. Check Console for any errors
4. Check if ResearchSproutProvider is mounted
5. Look for GardenTray component in React DevTools

### Task 4: Verify Event Flow

If GardenTray IS rendering:

1. Does clicking a sprout fire the event?
2. Check console: `[ResearchSproutContext] Opening Sprout Finishing Room for: <id>`
3. Check console: `[FinishingRoomGlobal] Registering event listener`
4. Does event reach RootLayout listener?

### Task 5: CSS/Visibility Check

If GardenTray exists in DOM but not visible:

1. Check computed styles
2. Check z-index (should be 40)
3. Check position (should be `fixed right-0`)
4. Check width (collapsed: 56px)

---

## Code Changed by Randy (Needs Review)

**File:** `src/explore/context/ResearchSproutContext.tsx`

**Change:** Added event dispatch in `selectSprout` function

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

**This change is UNTESTED** - Randy made it but didn't rebuild/verify.

---

## Quick Diagnostic Commands

```bash
# 1. Check if GardenTray component file exists
ls src/explore/components/GardenTray/GardenTray.tsx

# 2. Check if it's imported in ExploreShell
grep "GardenTray" src/surface/components/KineticStream/ExploreShell.tsx

# 3. Check if build is up to date
git diff src/explore/context/ResearchSproutContext.tsx

# 4. Rebuild
npm run build && npm start
```

---

## Success Criteria

Bug is fixed when:
- ✅ Navigate to http://localhost:8080/explore
- ✅ GardenTray visible on right edge
- ✅ Hover expands the tray
- ✅ Completed sprouts show 🌻 emoji
- ✅ Click sprout → New 3-column modal opens
- ✅ Old modal does NOT appear

---

## Related Files

| File | Purpose | Status |
|------|---------|--------|
| `src/explore/components/GardenTray/GardenTray.tsx` | Tray component | ✅ Exists |
| `src/surface/components/KineticStream/ExploreShell.tsx` | Renders GardenTray | ✅ Imports/renders |
| `src/explore/context/ResearchSproutContext.tsx` | Event dispatch | ⚠️ Modified by Randy |
| `src/router/RootLayout.tsx` | Event listener | ✅ Working (verified in E2E) |
| `src/surface/components/modals/SproutFinishingRoom/` | Modal components | ✅ Complete |

---

## Next Steps

1. Developer: Review Randy's code change
2. Developer: Rebuild application
3. Developer: Verify GardenTray renders on /explore
4. Developer: Test click → modal flow
5. Randy: Verify server startup after rebuild

---

*Bug documented by Randy - Chief of Staff v1.2*
*"Code freeze. Developer takes over."*
