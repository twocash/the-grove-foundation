# EXECUTION_PROMPT.md — Navigation Hotfixes

## Date: 2025-12-25
## Fixes: Inspector clearing + First project expanded

---

## CONTEXT

Two related bugs in the workspace navigation:

1. **Inspector not clearing:** When switching between Lenses/Journeys/Nodes, the inspector stays open with stale data. Root cause: The code checks `path[1]` (which is always 'groveProject') instead of `path[2]` (the actual collection type).

2. **First project collapsed:** Grove Project should start expanded so users see Terminal, Lenses, etc. immediately. Also, default nav path should land on Grove Project level, not just 'explore'.

**Repository:** `C:\GitHub\the-grove-foundation`

---

## FIX 1: Inspector Close Logic

### File
`src/workspace/WorkspaceUIContext.tsx`

### Problem
Lines 109-110 check the wrong path index:
```typescript
const currentCollection = navigation.activePath[1];  // Returns 'groveProject'
const newCollection = path[1];                        // Returns 'groveProject'
```

For path `['explore', 'groveProject', 'lenses']`:
- `path[0]` = 'explore'
- `path[1]` = 'groveProject' ← Code checks this (WRONG)
- `path[2]` = 'lenses' ← Should check this (CORRECT)

### Action
Find the `navigateTo` callback (around line 108):

```typescript
  // Navigation actions
  const navigateTo = useCallback((path: NavigationPath) => {
    // Close inspector when changing collection types
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

    setNavigation(s => ({
      ...s,
      activePath: path,
      selectedEntityId: null,
      selectedEntityType: null,
    }));
  }, [navigation.activePath, inspector.isOpen]);
```

REPLACE with:

```typescript
  // Navigation actions
  const navigateTo = useCallback((path: NavigationPath) => {
    // Close inspector when changing collection types
    // Path structure: ['explore', 'groveProject', 'lenses'] — collection is at index 2
    const currentCollection = navigation.activePath[2];
    const newCollection = path[2];
    const collectionViews = ['terminal', 'lenses', 'journeys', 'nodes', 'diary', 'sprouts'];

    if (
      inspector.isOpen &&
      currentCollection !== newCollection &&
      collectionViews.includes(newCollection)
    ) {
      setInspector({ mode: { type: 'none' }, isOpen: false });
    }

    setNavigation(s => ({
      ...s,
      activePath: path,
      selectedEntityId: null,
      selectedEntityType: null,
    }));
  }, [navigation.activePath, inspector.isOpen]);
```

**Key change:** `activePath[1]` → `activePath[2]` and `path[1]` → `path[2]`

---

## FIX 2: First Project Expanded + Default Path

### File 1: `src/workspace/WorkspaceUIContext.tsx`

### Action 2.1: Update default expanded groups

Find (around line 33):
```typescript
    // Top-level sections expanded, projects collapsed by default
    let expandedGroups = new Set<string>(['explore']);
```

REPLACE with:
```typescript
    // Top-level sections expanded, first project expanded, subsequent projects collapsed
    let expandedGroups = new Set<string>(['explore', 'explore.groveProject']);
```

### File 2: `src/core/schema/workspace.ts`

### Action 2.2: Update default navigation path

Find (around line 148):
```typescript
/**
 * Default navigation path - Explore shows Terminal directly
 */
export const DEFAULT_NAV_PATH: NavigationPath = ['explore'];
```

REPLACE with:
```typescript
/**
 * Default navigation path - Land on first project (Grove Project)
 */
export const DEFAULT_NAV_PATH: NavigationPath = ['explore', 'groveProject'];
```

---

## VERIFICATION

### Build
```bash
cd C:\GitHub\the-grove-foundation
npm run build
```

### Manual Testing

**Test 1: Inspector Clearing**
1. Navigate to Journeys tab
2. Click a Journey card → Inspector opens
3. Navigate to Lenses tab → Inspector should CLOSE
4. Click a Lens card → Lens Inspector opens
5. Navigate to Nodes tab → Inspector should CLOSE

**Test 2: First Project Expanded**
1. Clear localStorage: `localStorage.clear()` in browser console
2. Refresh page
3. Verify:
   - Explore section expanded ✓
   - Grove Project expanded ✓
   - Terminal, Lenses, Journeys, Nodes, Diary, Sprouts visible ✓
   - Main content shows Grove Project placeholder (not Terminal) ✓

**Test 3: Navigation State Persistence**
1. Collapse Grove Project via chevron
2. Refresh page
3. Grove Project should stay collapsed (localStorage persists user preference)

---

## COMMIT

```bash
git add -A
git commit -m "fix(nav): inspector clearing + first project expanded

- Fix inspector not closing on collection switch (path[1] → path[2])
- First project (Grove Project) starts expanded by default
- Default nav path lands on Grove Project level
- Subsequent projects still start collapsed

Fixes inspector stale data bug and improves first-run UX."

git push origin main
```

---

## SUMMARY

| Change | File | Line | Before | After |
|--------|------|------|--------|-------|
| Collection index | WorkspaceUIContext.tsx | 109-110 | `path[1]` | `path[2]` |
| Default expanded | WorkspaceUIContext.tsx | 33 | `['explore']` | `['explore', 'explore.groveProject']` |
| Default nav path | workspace.ts | 148 | `['explore']` | `['explore', 'groveProject']` |

**Total:** ~6 lines changed across 2 files
