# Cache vs Route Diagnostic - SFR Modal Issue

**Date:** 2026-01-15  
**Issue:** User sees old blue modal, Playwright sees new 3-column modal  

---

## Why Playwright Works But Your Browser Doesn't

### Playwright E2E Tests
- **Clean slate every run** - No cache, no localStorage, no cookies
- **Isolated browser context** - Fresh Chromium instance per test
- **Loads from dist/ directly** - Gets latest build every time
- **Screenshot proves:** New modal DOES work when cache is clean

### Your Browser
- **Cached JavaScript** - Old bundle still in memory
- **Cached HTML** - Old index.html references old hashes
- **Service Workers?** - May be serving stale assets
- **localStorage state** - Old engagement state may conflict

---

## Cache Clearing Protocol

### Method 1: Hard Refresh (Try First)

**Windows Chrome/Edge:**
```
Ctrl + Shift + R
```

**Or:**
```
Ctrl + F5
```

**What this does:** Bypasses cache for current page load

### Method 2: DevTools Cache Clear (Recommended)

1. Open DevTools (F12)
2. Right-click the refresh button (⟳)
3. Select **"Empty Cache and Hard Reload"**

**IMPORTANT:** DevTools must be OPEN for this option to appear.

### Method 3: Full Browser Reset (Nuclear Option)

**Chrome/Edge:**
1. DevTools (F12) → Network tab
2. Check "Disable cache" checkbox
3. Keep DevTools open
4. Reload page (Ctrl + R)

**Then close/reopen browser to clear:**
1. Settings → Privacy → Clear browsing data
2. Select: Cached images and files
3. Time range: Last hour
4. Clear data

### Method 4: Incognito/Private Window

**Quickest test:**
```
Ctrl + Shift + N  (Chrome)
Ctrl + Shift + P  (Edge)
```

Navigate to: http://localhost:8080/explore

If it works in incognito → **Cache is the culprit**

---

## Service Worker Check

Service workers can aggressively cache assets.

### Check if one exists:

1. DevTools (F12) → Application tab
2. Left sidebar → Service Workers
3. If any listed → Click "Unregister"
4. Reload page

---

## Other Possible Issues

### Issue 1: Route Configuration

**Check:** Is `/explore` route actually using ExploreShell?

```bash
# Search route config
grep -r "explore" src/router/
```

**Expected:** Route should render ExploreShell which includes GardenTray

### Issue 2: ResearchSproutProvider Missing

**Check:** Is provider wrapping the route?

File to check: `src/router/RootLayout.tsx` or route config

**Expected:**
```typescript
<ResearchSproutProvider>
  <ExploreShell />
</ResearchSproutProvider>
```

### Issue 3: Build Hash Mismatch

**Check:** Is index.html referencing old bundle?

```bash
# Check what index.html loads
cat dist/index.html | grep -i "script"
```

**Expected:** Script tags should have fresh hashes matching dist/assets/

### Issue 4: Server Serving Wrong Build

**Check:** Is server actually serving from dist/?

```bash
# Check server.js
grep -n "express.static" server.js
```

**Expected:** `app.use(express.static('dist'))`

---

## Diagnostic Sequence

### Step 1: Verify Build Contents

```bash
# Check if new code in bundle
grep -r "open-finishing-room" dist/assets/*.js
```

**Expected:** Should find the CustomEvent dispatch code in a bundle

### Step 2: Verify Server Serving Fresh Files

```bash
# Check file timestamp
ls -la dist/index.html
```

**Expected:** Timestamp matches your build time (~28 seconds ago when you rebuilt)

### Step 3: Browser Hard Refresh

1. Close ALL browser tabs for localhost:8080
2. Reopen browser
3. Navigate fresh to http://localhost:8080/explore
4. **Before clicking anything:** Ctrl + Shift + R

### Step 4: Incognito Test

1. Open incognito window
2. Go to http://localhost:8080/explore
3. Test if GardenTray appears

**If works in incognito → Cache issue confirmed**

### Step 5: DevTools Network Inspection

1. DevTools (F12) → Network tab
2. Reload page
3. Look for JavaScript files
4. Check if any loaded from "(disk cache)" or "(memory cache)"
5. Should see "(200 OK)" for fresh loads

### Step 6: Check Actual Modal Component

**In browser console:**
```javascript
// Check if SproutFinishingRoom is registered
window.dispatchEvent(new CustomEvent('open-finishing-room', {
  detail: { sproutId: 'test' }
}));
```

**Expected:** New modal should appear (or error if no sprout exists)

---

## Success Indicators

### You'll Know Cache is Cleared When:

1. Network tab shows JavaScript loaded from server, not cache
2. Index.html has fresh timestamp
3. Incognito window shows same behavior as regular window
4. GardenTray appears on right edge at /explore

### You'll Know Route is Wrong When:

1. Cache cleared but still no GardenTray
2. Incognito window also shows old modal
3. DevTools Elements tab shows ExploreShell not rendering

---

## If Still Failing After Cache Clear

### Check Console Errors

1. DevTools (F12) → Console tab
2. Look for red errors
3. Common issues:
   - Provider not found
   - Component import failed
   - Event listener not registered

### Check React DevTools

1. Install React DevTools extension
2. Components tab
3. Search for "GardenTray"
4. Check if it's in the component tree

### Check Network Requests

1. Network tab → Filter: JS
2. Find the ExplorePage bundle
3. Check size matches build output (271 kB)
4. Click to view → Search for "open-finishing-room"

---

## Most Likely Solution

**90% probability:** Browser cache serving old JavaScript bundle.

**Fix:**
1. Ctrl + Shift + R (hard refresh)
2. Or use incognito window
3. Or clear cache via DevTools

**If that doesn't work:**
- Route configuration issue
- Provider not wrapping route
- Server serving wrong directory

---

*Randy - Chief of Staff v1.2*  
*"Playwright proves the code works. Your browser needs amnesia."*
