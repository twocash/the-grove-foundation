# Bug Report: GardenTray Auto-Refresh

**Date:** 2026-01-15  
**Reporter:** User (via console observation)  
**Severity:** MEDIUM - Annoying UX, not blocking  

---

## Issue

ResearchSproutContext triggers excessive refresh cycles during user interaction.

**Observed in console:**
```
[ResearchSproutContext] Refreshed 15 sprouts
```

This fires when:
- User interacts with console
- User clicks in browser
- Unknown other triggers (needs investigation)

---

## Expected Behavior

Sprout refresh should only occur when:
- New sprout created
- Sprout status changes (external update)
- User explicitly requests refresh
- Page first loads

**Not on:**
- Every user interaction
- Every state change
- Timer/polling (unless explicitly needed)

---

## Likely Cause

File: `src/explore/context/ResearchSproutContext.tsx`

**Suspects:**

### 1. useEffect dependency array too broad
```typescript
useEffect(() => {
  refresh();
}, [groveId, /* potentially too many deps */]);
```

If dependencies include objects/arrays that get recreated on every render, this will cause infinite refresh loops.

### 2. Polling interval too aggressive
```typescript
// If there's a setInterval somewhere
setInterval(() => refresh(), 1000); // Too fast!
```

### 3. Event listener triggering refresh
```typescript
window.addEventListener('some-event', refresh);
// If 'some-event' fires too often
```

---

## Investigation Tasks

### Task 1: Find the refresh trigger

```bash
# Search for refresh calls
grep -n "Refreshed.*sprouts" src/explore/context/ResearchSproutContext.tsx

# Find all useEffect hooks
grep -n "useEffect" src/explore/context/ResearchSproutContext.tsx

# Find polling intervals
grep -n "setInterval\|setTimeout" src/explore/context/ResearchSproutContext.tsx
```

### Task 2: Add debug logging

Temporarily add to `ResearchSproutContext.tsx`:
```typescript
useEffect(() => {
  console.trace('[ResearchSproutContext] Refresh triggered by:', {
    groveId,
    // ... other dependencies
  });
  refresh();
}, [dependencies]);
```

This will show the call stack when refresh happens.

### Task 3: Check for reactive dependencies

Look for:
```typescript
// Bad - object recreated every render
const config = { groveId, other: 'stuff' };
useEffect(() => refresh(), [config]); // Infinite loop!

// Good - primitive dependency
useEffect(() => refresh(), [groveId]);

// Or memoized object
const config = useMemo(() => ({ groveId }), [groveId]);
useEffect(() => refresh(), [config]);
```

---

## Fix Strategy

### Option 1: Debounce refresh calls

```typescript
import { debounce } from 'lodash';

const debouncedRefresh = useMemo(
  () => debounce(() => {
    console.log('[ResearchSproutContext] Refreshing sprouts...');
    // actual refresh logic
  }, 500), // Wait 500ms after last call
  []
);

useEffect(() => {
  debouncedRefresh();
}, [dependencies, debouncedRefresh]);
```

### Option 2: Remove unnecessary dependencies

```typescript
// Before
useEffect(() => {
  refresh();
}, [groveId, sprouts, isLoading, error, ...manyDeps]);

// After (only refresh on groveId change)
useEffect(() => {
  refresh();
}, [groveId]);
```

### Option 3: Manual refresh only

```typescript
// Remove auto-refresh
// Add manual refresh button in UI
<button onClick={refresh}>Refresh Sprouts</button>
```

---

## User Impact

**Current:**
- Console spam (annoying for developers)
- Potential performance issue (15 sprouts × refresh rate)
- Possible race conditions if updates mid-refresh
- Network overhead if refresh hits API

**After Fix:**
- Clean console
- Refresh only when needed
- Better performance
- Predictable behavior

---

## Acceptance Criteria

- [ ] Refresh only fires when groveId changes
- [ ] Refresh fires on initial mount
- [ ] Refresh fires when explicitly requested by user
- [ ] No refresh during normal user interaction
- [ ] Console shows refresh reason (debug logging)
- [ ] No more spam in console

---

## Related Files

| File | Check For |
|------|-----------|
| `src/explore/context/ResearchSproutContext.tsx` | useEffect deps, intervals |
| `src/explore/hooks/useResearchSprouts.ts` | Hook implementation |
| `src/explore/components/GardenTray/GardenTray.tsx` | Any refresh triggers |

---

*Randy - Chief of Staff v1.2*  
*"Refresh should be surgical, not spammy."*
