# Browser Diagnostic Checklist - GardenTray Not Visible

**Date:** 2026-01-15  
**Issue:** GardenTray component not showing despite clean incognito build  

---

## Critical Finding

**GardenTray renders UNCONDITIONALLY** at ExploreShell.tsx:937

```typescript
{/* Garden Tray (Sprint: garden-tray-mvp) - Shows Research Sprouts */}
<GardenTray />
```

**No feature flags. No conditions. No lazy loading.**

If you're not seeing it, it's either:
1. React error crashing the component
2. CSS hiding it (z-index, position, visibility)
3. Provider error preventing context

---

## Immediate Diagnostics (Run These Now)

### Step 1: Check Browser Console for Errors

**Open DevTools:**
```
F12 → Console tab
```

**Look for:**
- ❌ Red errors (component crashes)
- ⚠️ Yellow warnings (missing props, context)
- 🔴 Network errors (failed asset loads)

**Common error patterns:**
```
Uncaught Error: useResearchSprouts must be used within ResearchSproutProvider
Cannot read property 'sprouts' of undefined
Failed to load resource: net::ERR_FILE_NOT_FOUND
```

**Take screenshot of console and report what you see.**

---

### Step 2: Check if GardenTray is in the DOM

**DevTools → Elements tab:**

1. Press `Ctrl+F` to search
2. Search for: `garden-tray`
3. Or search for: `GardenTray`

**Possible outcomes:**

#### ✅ Found in DOM
If `data-testid="garden-tray"` exists:
- Component IS rendering
- Problem is CSS/visibility
- Proceed to Step 3

#### ❌ Not found in DOM
If no match:
- Component NOT rendering
- React error likely
- Check console (Step 1)
- Provider missing

---

### Step 3: Inspect GardenTray Element (If Found)

**DevTools → Elements → Right-click element → Inspect**

Check computed styles:

| Property | Expected | If Wrong |
|----------|----------|----------|
| `position` | `fixed` | Element not positioned correctly |
| `right` | `0` | Not at right edge |
| `z-index` | `40` | Hidden behind other elements |
| `width` | `56px` (collapsed) | Too narrow? |
| `height` | `100vh` | Not full height |
| `display` | Not `none` | Hidden by CSS |
| `opacity` | Not `0` | Invisible |
| `visibility` | `visible` | Hidden by CSS |

**Screenshot the computed styles panel.**

---

### Step 4: Check React Component Tree

**Install React DevTools Extension:**
- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Edge](https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil)

**After install:**
1. DevTools → Components tab
2. Search for "GardenTray"
3. Check if it's in the tree
4. Check props: `sprouts`, `isLoading`, `error`

**If GardenTray NOT in tree:**
- ExploreShell crashed before rendering it
- Check parent components for errors

---

### Step 5: Check Network Tab for Asset Loading

**DevTools → Network tab → Reload page:**

1. Look for `index-Bzndkrn8.js`
2. Status should be `200 OK` (not 304 Not Modified, not disk cache)
3. Click on it → Preview tab
4. Search for "open-finishing-room"

**If "open-finishing-room" NOT found:**
- Browser serving wrong bundle
- Cache issue despite incognito
- Server serving stale files

**If "open-finishing-room" found:**
- Correct bundle is loading
- Problem is runtime, not build

---

## Quick Test: Force Modal Open

**Browser console:**

```javascript
// Test 1: Check if window.dispatchEvent works
window.dispatchEvent(new CustomEvent('open-finishing-room', {
  detail: { sproutId: 'test-id' }
}));

// Expected: Modal should attempt to open (may error if no sprout)
// If nothing happens: Event listener not registered

// Test 2: Check if ResearchSproutContext is available
console.log(window.React);

// Test 3: Check localStorage for sprouts
console.log(localStorage.getItem('grove-research-sprouts'));

// Expected: JSON array or null
```

---

## If GardenTray IS Rendering But Not Visible

### Fix 1: Z-Index Conflict

Another element might be on top. Check:

```javascript
// In console: Find all fixed elements with high z-index
Array.from(document.querySelectorAll('*'))
  .filter(el => window.getComputedStyle(el).position === 'fixed')
  .map(el => ({
    tag: el.tagName,
    class: el.className,
    zIndex: window.getComputedStyle(el).zIndex
  }))
  .sort((a, b) => parseInt(b.zIndex) - parseInt(a.zIndex))
  .slice(0, 10);
```

If another element has `z-index > 40`, it's covering GardenTray.

### Fix 2: CSS Override

**In DevTools → Elements → Styles panel:**

Try adding inline styles to force visibility:

```css
/* Right-click GardenTray element → Edit as HTML */
style="display: block !important; opacity: 1 !important; visibility: visible !important; background: red !important;"
```

If red box appears → CSS was hiding it.

---

## If Providers Are Missing

**Check route structure:**

```javascript
// In console: Check if providers rendered
console.log(document.body.innerHTML.includes('ResearchSproutProvider'));
console.log(document.body.innerHTML.includes('ExploreEventProvider'));
```

---

## Report Back With

**Please provide:**

1. ✅ Screenshot of **Console tab** (errors/warnings)
2. ✅ Screenshot of **Elements tab** search for "garden-tray"
3. ✅ Screenshot of **Network tab** showing `index-Bzndkrn8.js` load
4. ✅ Result of "Force Modal Open" test (did modal appear?)
5. ✅ React DevTools screenshot (if installed) showing component tree

**This will tell us EXACTLY where the problem is.**

---

*Randy - Chief of Staff v1.2*  
*"Component renders. Browser disagrees. Console has answers."*
