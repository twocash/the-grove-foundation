# HOTFIX: Inspector Not Clearing on Collection Switch

## Status: 🔴 OPEN
**Priority:** High
**Date:** 2025-12-25

---

## Issue

Switching between Lenses and Journeys collections does NOT clear the inspector panel. User sees stale inspector content from the previous collection.

**Note:** This was supposed to be fixed in Quantum Glass v1.1 (commit f635568) but the fix is either incomplete or regressed.

## Expected Behavior
- User views Journey → clicks Journey card → Journey Inspector opens
- User navigates to Lenses tab → Inspector closes automatically
- User clicks Lens card → Lens Inspector opens

## Current Behavior
- User views Journey → clicks Journey card → Journey Inspector opens
- User navigates to Lenses tab → Inspector STAYS OPEN with stale Journey data
- Confusing UX: "Journey Inspector" visible while viewing Lenses

## Root Cause Investigation

Check `src/workspace/WorkspaceUIContext.tsx` — the `navigateTo` function should have inspector close logic added in v1.1:

```typescript
const navigateTo = useCallback((path: NavigationPath) => {
  // This logic may not be triggering correctly
  const currentCollection = navigation.activePath[1];
  const newCollection = path[1];
  const collectionViews = ['terminal', 'lenses', 'journeys', 'nodes', 'diary', 'sprouts'];
  
  if (
    inspector.isOpen &&
    currentCollection !== newCollection &&
    collectionViews.includes(newCollection)
  ) {
    setInspector({ mode: { type: 'none' }, isOpen: false });
  }
  // ...
}, [navigation.activePath, inspector.isOpen]);
```

**Possible causes:**
1. Dependency array missing `inspector.isOpen` or `navigation.activePath`
2. `path[1]` index is wrong for the navigation structure
3. The logic was added but never deployed
4. Collection names in array don't match actual path segments

## Fix Location
- `src/workspace/WorkspaceUIContext.tsx` — `navigateTo` callback

## Debug Steps
1. Add console.log in `navigateTo`:
   ```typescript
   console.log('navigateTo:', { currentCollection, newCollection, inspectorOpen: inspector.isOpen });
   ```
2. Navigate between Lenses/Journeys
3. Check if logic is even being evaluated
4. Verify path structure matches expected `['explore', 'groveProject', 'lenses']`

## Verification
1. Open Journeys → click card → inspector opens
2. Navigate to Lenses → inspector should close
3. Click Lens card → Lens inspector opens
4. Navigate to Nodes → inspector should close
