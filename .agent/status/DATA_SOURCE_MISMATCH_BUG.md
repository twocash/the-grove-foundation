# Bug Report: FinishingRoomGlobal Data Source Mismatch

**Date:** 2026-01-15  
**Severity:** HIGH - Feature complete but broken integration  
**Reporter:** Randy (Chief of Staff)  

---

## Issue

GardenTray displays 15 research sprouts. User clicks sprout. Event fires correctly. **Modal does not open** because FinishingRoomGlobal can't find the sprout.

**Console Evidence:**
```
[ResearchSproutContext] Opening Sprout Finishing Room for: 307271d5-deea-451f-b721-4385658fe0ba
[FinishingRoomGlobal] Event received, sproutId: 307271d5-deea-451f-b721-4385658fe0ba
[FinishingRoomGlobal] Found sprout: false undefined  ← BUG
[FinishingRoomGlobal] Sprout not found: 307271d5-deea-451f-b721-4385658fe0ba
```

---

## Root Cause

**FinishingRoomGlobal** (RootLayout.tsx:36-62) looks for sprouts in:
```typescript
localStorage.getItem('grove-sprouts')  // ❌ Empty (legacy system)
```

**ResearchSproutContext** stores sprouts in:
```typescript
Supabase database  // ✅ 15 sprouts exist
```

**The integration used different data sources.**

---

## Component Architecture Mismatch

```
GardenTray
    ↓ (uses)
ResearchSproutContext
    ↓ (reads from)
Supabase Database ✅
    ↓ (clicks sprout)
Dispatches: open-finishing-room event
    ↓ (received by)
FinishingRoomGlobal
    ↓ (looks in)
localStorage['grove-sprouts'] ❌
    ↓
NOT FOUND → Modal doesn't open
```

---

## The Fix

**File:** `src/router/RootLayout.tsx`

**Problem code (lines 36-62):**
```typescript
function FinishingRoomGlobal() {
  const [isOpen, setIsOpen] = useState(false);
  const [sprout, setSprout] = useState<Sprout | null>(null);

  const handleOpen = useCallback((event: CustomEvent<{ sproutId: string }>) => {
    const { sproutId } = event.detail;
    
    // ❌ WRONG: Looking in localStorage
    const sproutsJson = localStorage.getItem('grove-sprouts');
    const testSproutJson = localStorage.getItem('grove-test-sprout');
    
    let foundSprout: Sprout | null = null;
    // ... localStorage parsing logic ...
    
    if (foundSprout) {
      setSprout(foundSprout);
      setIsOpen(true);
    } else {
      console.warn('[FinishingRoomGlobal] Sprout not found:', sproutId);
    }
  }, []);
  // ...
}
```

**Solution:**

### Option 1: Use ResearchSproutContext (Recommended)

```typescript
import { useResearchSprouts } from '@explore/context/ResearchSproutContext';

function FinishingRoomGlobal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSproutId, setActiveSproutId] = useState<string | null>(null);
  
  // ✅ Use the same data source as GardenTray
  const { getById } = useResearchSprouts();
  
  // Get sprout from context (reactive)
  const sprout = activeSproutId ? getById(activeSproutId) : null;

  const handleOpen = useCallback((event: CustomEvent<{ sproutId: string }>) => {
    const { sproutId } = event.detail;
    console.log('[FinishingRoomGlobal] Event received, sproutId:', sproutId);
    
    // ✅ Use context to get sprout
    setActiveSproutId(sproutId);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setActiveSproutId(null);
  }, []);

  // ... rest of component
  
  return (
    <>
      {listenerReady && <div data-testid="finishing-room-listener-ready" style={{ display: 'none' }} />}
      {isOpen && sprout && (
        <ToastProvider>
          <SproutFinishingRoom
            sprout={sprout}
            isOpen={isOpen}
            onClose={handleClose}
            onSproutUpdate={(updated) => {
              // Updates handled by ResearchSproutContext.update()
              console.log('[FinishingRoomGlobal] Sprout updated:', updated.id);
            }}
          />
        </ToastProvider>
      )}
    </>
  );
}
```

**Required changes:**
1. Import `useResearchSprouts` hook
2. Call `getById(sproutId)` instead of localStorage lookup
3. Remove localStorage parsing code (lines 36-62)
4. Remove localStorage update code in `handleSproutUpdate`

---

### Option 2: Bridge localStorage to Supabase (Not Recommended)

Keep localStorage for backward compatibility but sync from Supabase:

```typescript
const handleOpen = useCallback(async (event: CustomEvent<{ sproutId: string }>) => {
  const { sproutId } = event.detail;
  
  // Try localStorage first (for E2E tests)
  let foundSprout = tryLocalStorage(sproutId);
  
  // If not found, fetch from Supabase
  if (!foundSprout) {
    foundSprout = await fetchFromSupabase(sproutId);
  }
  
  if (foundSprout) {
    setSprout(foundSprout);
    setIsOpen(true);
  }
}, []);
```

**Downsides:**
- Dual data sources (complexity)
- Race conditions
- Sync issues
- Not DRY

---

## Why This Bug Existed

**Historical context:**
1. **Original sprout system** used localStorage (`grove-sprouts`)
2. **Research sprout system** introduced Supabase (Sprint: sprout-research-v1)
3. **GardenTray** built with new system (Supabase)
4. **FinishingRoomGlobal** still using old system (localStorage)
5. **Integration assumed** both used same data source

**Developer note:**
US-E001 commit message said "documented for implementation" - event wiring was documented but **data source integration was not verified**.

---

## Type Mismatch Warning

**Additional issue:** Type incompatibility between systems.

Old localStorage system uses:
```typescript
// src/core/schema/sprout.ts
interface Sprout {
  id: string;
  capturedAt: string;
  response: string;
  query: string;
  provenance: SproutProvenance;
  status: 'sprout';
  stage: SproutStage;
  // ... legacy fields
}
```

New Supabase system uses:
```typescript
// src/core/schema/research-sprout.ts
interface ResearchSprout {
  id: string;
  spark: string;
  title: string;
  groveId: string;
  status: ResearchSproutStatus;  // Different!
  strategy: ResearchStrategy;
  branches: ResearchBranch[];
  // ... new fields
}
```

**If FinishingRoomGlobal expects old `Sprout` type:**
- Need to convert ResearchSprout → Sprout
- Or update modal to accept ResearchSprout
- Or create adapter layer

---

## Testing After Fix

### Manual Test:
1. Navigate to http://localhost:8080/explore
2. Hover over GardenTray (right edge)
3. Click any completed sprout (🌻)
4. **Expected:** 3-column modal opens with sprout data
5. **Expected console:**
   ```
   [FinishingRoomGlobal] Event received, sproutId: <id>
   [FinishingRoomGlobal] Found sprout: true <id>
   [FinishingRoomGlobal] Modal opening
   ```

### E2E Test Update:
If E2E tests rely on `grove-test-sprout` in localStorage:
- Keep that fallback for tests
- But add ResearchSproutContext as primary lookup

```typescript
// Priority order:
1. ResearchSproutContext.getById() (production)
2. localStorage['grove-test-sprout'] (E2E tests)
3. localStorage['grove-sprouts'] (legacy fallback)
```

---

## Success Criteria

- [x] GardenTray visible (confirmed: DOM check passed)
- [x] Event fires on sprout click (confirmed: console logs)
- [ ] FinishingRoomGlobal finds sprout via ResearchSproutContext
- [ ] Modal opens with correct sprout data
- [ ] Action panel works (revise, promote, etc.)
- [ ] E2E tests still pass
- [ ] No console warnings about "Sprout not found"

---

## Files to Modify

| File | Change Required |
|------|-----------------|
| `src/router/RootLayout.tsx` | Use `useResearchSprouts()` instead of localStorage |
| `src/router/RootLayout.tsx` | Import ResearchSproutContext hook |
| `src/router/RootLayout.tsx` | Remove localStorage parsing (lines 36-62) |
| `src/surface/components/modals/SproutFinishingRoom/SproutFinishingRoom.tsx` | Verify type compatibility with ResearchSprout |

---

## Related Issues

- Auto-refresh bug (documented in AUTO_REFRESH_BUG.md)
- Type mismatch between Sprout vs ResearchSprout

---

*Randy - Chief of Staff v1.2*  
*"Same building, different floors. FinishingRoom needs to ride the Supabase elevator."*
