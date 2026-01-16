# Developer Directive: Sprout Finishing Room UI Integration Bug

**Issued by:** Randy (Chief of Staff)  
**Date:** 2026-01-15  
**Priority:** HIGH  
**Sprint:** sprout-finishing-room-v1  

---

## The Problem

User cannot access Sprout Finishing Room modal from production UI.

**User Report:**
- Navigate to http://localhost:8080/explore
- GardenTray NOT visible on right edge
- Clicking sprouts shows OLD modal instead of new 3-column modal
- Screenshot confirms: old "Research Results - Insufficient Evidence" modal visible

---

## Code Change Requiring Review

⚠️ **UNTESTED CODE CHANGE** ⚠️

Randy made an unauthorized code edit that needs your review:

**File:** `src/explore/context/ResearchSproutContext.tsx` (line 713)

**What was added:**
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

**This change is NOT tested and NOT built.**

---

## Your Tasks

### Task 1: Review Randy's Code Change ⚠️

1. Review the event dispatch code above
2. Decide: keep, modify, or revert
3. If keeping: ensure it's correct for the event pattern

### Task 2: Rebuild Application

The change was made to source code but not built:

```bash
# Stop server if running
taskkill /F /IM node.exe

# Clean build
npm run build

# Restart production server
npm start
```

### Task 3: Verify Build Deployed

Check that dist/ contains updated code:
```bash
git diff src/explore/context/ResearchSproutContext.tsx
```

If diff shows changes, they need to be in dist/.

### Task 4: Diagnostic Sequence

If GardenTray still not visible after rebuild:

**4.1: Check Route Structure**
- Does `/explore` route use ExploreShell.tsx?
- Is ResearchSproutProvider wrapping the route?
- File to check: `src/router/` configuration

**4.2: Browser DevTools**

At http://localhost:8080/explore:
1. Open DevTools (F12)
2. Search DOM for `data-testid="garden-tray"`
3. Check Console for errors
4. Check if GardenTray renders in React DevTools
5. Check if ResearchSproutProvider is mounted

**4.3: CSS/Visibility**

If GardenTray exists in DOM but not visible:
- Check computed styles (Inspect Element)
- Check z-index (should be 40)
- Check position (should be `fixed right-0`)
- Check width (collapsed: 56px)

**4.4: Event Flow**

If GardenTray IS visible:
1. Click a completed sprout (🌻)
2. Check console: `[ResearchSproutContext] Opening Sprout Finishing Room for: <id>`
3. Check console: `[FinishingRoomGlobal] Registering event listener`
4. Does modal open?

### Task 5: Complete Testing

Once modal opens:

**Method 1: Via GardenTray**
1. Navigate to http://localhost:8080/explore
2. Hover over right edge → GardenTray expands
3. Click completed sprout (🌻)
4. Verify: 3-column modal opens (not old modal)

**Method 2: Via Console** (quick test)
```javascript
const sprouts = JSON.parse(localStorage.getItem('grove-sprouts') || '[]');
const sproutId = sprouts[0]?.id;
if (sproutId) {
  window.dispatchEvent(new CustomEvent('open-finishing-room', {
    detail: { sproutId }
  }));
}
```

---

## Success Criteria

- ✅ Navigate to http://localhost:8080/explore
- ✅ GardenTray visible on right edge (🌱 icon)
- ✅ Hover expands tray
- ✅ Click 🌻 sprout → NEW modal opens
- ✅ Modal has 3-column layout (Provenance | Document | Actions)
- ✅ Old modal does NOT appear

---

## Reference Documentation

| Document | Purpose |
|----------|---------|
| `.agent/status/BUG_REPORT_SFR_MODAL.md` | Full bug analysis |
| `.agent/status/HOW_TO_TEST_MODAL.md` | Testing methods |
| `.agent/status/SFR_INTEGRATION_STATUS.md` | Integration troubleshooting |

---

## Escalation

If stuck after exhausting all tasks:
1. Document what you tried
2. Document what failed
3. Report findings to user with screenshots

**No shortcuts:**
- No `// TODO: fix later` comments
- No skipped verification steps
- Software that doesn't run isn't complete

---

*Randy - Chief of Staff v1.2*  
*"Code freeze violated. Developer owns the fix. Make it work."*
