# Migration Map — Object Model Standardization

## Overview

This sprint modifies 3 files and verifies 1 file. No files are created or deleted.

## Change Summary

| File | Action | Changes |
|------|--------|---------|
| `src/explore/LensPicker.tsx` | Modify | 6 changes across 4 locations |
| `src/explore/LensInspector.tsx` | Modify | 2 changes in 1 location |
| `src/explore/JourneyList.tsx` | Modify | 4 changes across 3 locations |
| `src/explore/JourneyInspector.tsx` | Verify | No changes needed |

## Detailed File Changes

### 1. LensPicker.tsx (~420 lines)

#### 1.1 Add inspectedLensId derivation
**Location**: After line ~307 (after workspaceUI declaration)
```typescript
// ADD after workspaceUI declaration
const inspectedLensId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode.type === 'lens'
) ? workspaceUI.inspector.mode.lensId : null;
```

#### 1.2 Fix handleSelect to close inspector
**Location**: Lines ~318-326
```typescript
// REPLACE handleSelect implementation
const handleSelect = (personaId: string) => {
  selectLens(personaId);
  onAfterSelect?.(personaId);
  if (mode === 'compact' && onBack) {
    onBack();
  } else if (workspaceUI) {
    workspaceUI.closeInspector();      // CHANGED: was openInspector
    workspaceUI.navigateTo(['explore']); // Return to chat
  }
};
```

#### 1.3 Update LensCard interface
**Location**: Around line ~185 (LensCardProps interface)
```typescript
// ADD to interface
isInspected: boolean;
```

#### 1.4 Update LensCard className
**Location**: Around line ~200 (card className)
```typescript
// REPLACE border/ring logic
${isInspected
  ? 'ring-2 ring-primary border-primary'
  : isActive
    ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20'
    : 'border-border-light dark:border-border-dark hover:shadow-lg hover:border-primary/30'
}
```

#### 1.5 Update LensCard button style
**Location**: Around line ~230 (Select button)
```typescript
// REPLACE button className
className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
```

#### 1.6 Pass isInspected to LensCard and CustomLensCard
**Location**: Around lines ~365 and ~390 (grid render loops)
```typescript
// ADD prop to each card
isInspected={inspectedLensId === persona.id}
```

#### 1.7 Update CustomLensCard similarly
**Location**: CustomLensCard component (around line ~240)
- Add `isInspected` to props interface
- Update className with `ring-2 ring-violet-400` for inspected state
- Update button to `bg-violet-500 text-white hover:bg-violet-500/90`

---

### 2. LensInspector.tsx (~280 lines)

#### 2.1 Fix handleActivate function
**Location**: Around line ~180
```typescript
// REPLACE handleActivate implementation
const handleActivate = () => {
  selectLens(personaId);
  closeInspector();  // ADD this line
  navigateTo(['explore']);
};
```

#### 2.2 Fix button to use handleActivate
**Location**: Around line ~220 (primary button)
```typescript
// REPLACE inline onClick
onClick={handleActivate}  // Was: inline arrow function
```

---

### 3. JourneyList.tsx (~220 lines)

#### 3.1 Add inspectedJourneyId derivation
**Location**: After workspaceUI declaration
```typescript
// ADD after workspaceUI declaration
const inspectedJourneyId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode.type === 'journey'
) ? workspaceUI.inspector.mode.journeyId : null;
```

#### 3.2 Fix handleStart to close inspector
**Location**: Lines ~161-168
```typescript
// REPLACE handleStart implementation
const handleStart = (journeyId: string) => {
  startJourney(journeyId);
  if (mode === 'compact' && onBack) {
    onBack();
  } else if (workspaceUI) {
    workspaceUI.closeInspector();        // ADD this line
    workspaceUI.navigateTo(['explore']); // Keep navigation
  }
};
```

#### 3.3 Update JourneyCard interface and styles
**Location**: JourneyCard component
- Add `isInspected: boolean` to props
- Update className with same ring-2 pattern as LensCard
- Pass `isInspected={inspectedJourneyId === journey.id}` in render

---

### 4. JourneyInspector.tsx (~180 lines)

#### 4.1 Verify existing implementation
**Location**: Lines ~44-48
```typescript
// VERIFY this already exists (no changes needed)
const handleStart = () => {
  startJourney(journeyId);
  navigateTo(['explore']);
  closeInspector();  // Already present ✓
};
```

---

## Execution Order

1. **LensPicker.tsx** — Fix root cause first (handleSelect)
2. **LensInspector.tsx** — Fix inspector button 
3. **JourneyList.tsx** — Fix handleStart for parity
4. **JourneyInspector.tsx** — Verify (no changes)
5. **Test all scenarios** — Manual verification

## Build Verification

After each file change:
```bash
npm run build  # TypeScript compiles
```

After all changes:
```bash
npm run build   # Full build
npm test        # Existing tests pass
npm run dev     # Manual testing
```

## Rollback

Git revert the commit(s) touching:
- `src/explore/LensPicker.tsx`
- `src/explore/LensInspector.tsx`
- `src/explore/JourneyList.tsx`

No database, schema, or configuration changes to undo.
