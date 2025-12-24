# Sprint 3: Workspace Inspectors v1 — Migration Map

**Sprint:** workspace-inspectors-v1
**Date:** 2024-12-24

---

## Summary

| Category | Files | Lines Changed (Est.) |
|----------|-------|---------------------|
| New files | 3 | +150 |
| Modified | 5 | +80 / -120 |
| Audit only | 4 | ~0 |

**Net:** ~+110 lines (adding stubs, removing duplicates)

---

## New Files

### 1. DiaryInspector.tsx

**Path:** `src/explore/DiaryInspector.tsx`
**Purpose:** Placeholder inspector for diary entries
**Lines:** ~50

```tsx
// Stub implementation - see SPEC.md section 3.2
interface DiaryInspectorProps {
  entryId?: string;
}

export function DiaryInspector({ entryId }: DiaryInspectorProps) {
  // Placeholder UI with icon, title, coming soon message
}
```

### 2. DiaryList.tsx

**Path:** `src/explore/DiaryList.tsx`
**Purpose:** Content view for diary entries (stub)
**Lines:** ~40

```tsx
export function DiaryList() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      {/* Coming soon placeholder */}
    </div>
  );
}
```

### 3. NodeInspector.tsx (Optional)

**Path:** `src/explore/NodeInspector.tsx`
**Purpose:** Extracted from inline Inspector.tsx case
**Lines:** ~60

**Note:** Can defer - inline stub is functional. Lower priority.

---

## Modified Files

### 1. NavigationSidebar.tsx

**Path:** `src/workspace/NavigationSidebar.tsx`
**Changes:** Update navigationTree for IA v0.15

#### Icon Mapping Addition
```typescript
// Line ~15 - Add to iconNameToSymbol
const iconNameToSymbol: Record<string, string> = {
  // ... existing
  book: 'menu_book',  // ADD - for Diary
};
```

#### Navigation Tree Update
```typescript
// Lines ~27-50 - Replace groveProject children
groveProject: {
  id: 'groveProject',
  label: 'Grove Project',
  icon: 'forest',
  view: 'terminal',
  children: {
    terminal: { id: 'terminal', label: 'Terminal', icon: 'message', view: 'terminal' },
    lenses: { id: 'lenses', label: 'Lenses', icon: 'glasses', view: 'lens-picker' },
    journeys: { id: 'journeys', label: 'Journeys', icon: 'map', view: 'journey-list' },
    nodes: { id: 'nodes', label: 'Nodes', icon: 'branch', view: 'node-grid' },
    diary: { id: 'diary', label: 'Diary', icon: 'book', view: 'diary-list' },
    sprouts: { id: 'sprouts', label: 'Sprouts', icon: 'sprout', view: 'sprout-grid' },
  },
},
```

#### Cultivate Section Update (Optional)
```typescript
// Option A: Remove mySprouts from Cultivate
cultivate: {
  id: 'cultivate',
  label: 'Cultivate',
  icon: 'sprout',
  children: {
    commons: { id: 'commons', label: 'Commons', view: 'commons-feed' },
  },
},

// Option B: Hide Cultivate entirely (if only Commons remains)
// Move to future sprint
```

**Decision:** Option A for this sprint.

---

### 2. ContentRouter.tsx

**Path:** `src/workspace/ContentRouter.tsx`
**Changes:** Add view routes and imports

#### Imports
```typescript
// Line ~10 - Add import
import { DiaryList } from '../explore/DiaryList';
```

#### View Map
```typescript
// Lines ~105-120 - Add to viewMap
const viewMap: Record<string, string> = {
  // ... existing explore paths
  'explore.groveProject.terminal': 'terminal',
  'explore.groveProject.diary': 'diary-list',
  'explore.groveProject.sprouts': 'sprout-grid',
  // ... rest unchanged
};
```

#### Render
```typescript
// Line ~155 - Add case
{viewId === 'diary-list' && <DiaryList />}
```

---

### 3. Inspector.tsx

**Path:** `src/workspace/Inspector.tsx`
**Changes:** Add diary case, import DiaryInspector

#### Imports
```typescript
// Line ~7 - Add import
import { DiaryInspector } from '../explore/DiaryInspector';
```

#### Title Case
```typescript
// Line ~20 - Add case in getTitle()
case 'diary': return 'Diary Inspector';
```

#### Render Case
```typescript
// Line ~70 - Add case in renderContent()
case 'diary':
  return <DiaryInspector entryId={inspector.mode.entryId} />;
```

#### Type Update (if needed)
```typescript
// In WorkspaceUIContext or types file
type InspectorMode = 
  | { type: 'none' }
  | { type: 'lens'; lensId: string }
  | { type: 'journey'; journeyId: string }
  | { type: 'sprout'; sproutId: string }
  | { type: 'node'; nodeId: string }
  | { type: 'diary'; entryId?: string }  // ADD
  | { type: 'diary-entry'; entryId: string }  // Existing
  | { type: 'chat-context'; context: ChatContext };
```

---

### 4. LensInspector.tsx

**Path:** `src/explore/LensInspector.tsx`
**Changes:** Remove inline components, add imports

#### Remove (Lines 11-135)
```typescript
// DELETE these inline definitions:
function Toggle({ ... }) { ... }      // ~35 lines
function Slider({ ... }) { ... }      // ~24 lines  
function Select({ ... }) { ... }      // ~27 lines
function Checkbox({ ... }) { ... }    // ~17 lines
function InfoCallout({ ... }) { ... } // ~16 lines
```

#### Add Imports
```typescript
// Line 5 - Add imports
import { Toggle, Slider, Select, Checkbox } from '@/shared/forms';
import { InfoCallout } from '@/shared/feedback';
```

#### Verify Usage
No changes to usage - shared components have matching signatures.

**Exception:** Slider `valueLabel` prop

```typescript
// In LensInspector, Slider is used as:
<Slider
  value={toneIntensity}
  onChange={setToneIntensity}
  label="Tone Intensity"
  valueLabel={getToneLabel(toneIntensity)}  // This prop
/>
```

Check if shared Slider supports `valueLabel`. If not, add it.

---

### 5. Slider.tsx (Shared)

**Path:** `src/shared/forms/Slider.tsx`
**Changes:** Add valueLabel prop if missing

```typescript
interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  valueLabel?: string;  // ADD if missing
  disabled?: boolean;
}

// In render, use valueLabel || value
<span className="...">
  {valueLabel || value}
</span>
```

---

## Audit Files (No Changes Expected)

### JourneyInspector.tsx
**Path:** `src/explore/JourneyInspector.tsx`
**Audit:** Token usage check
**Finding:** Uses semantic Tailwind tokens appropriately

### SproutInspector.tsx
**Path:** `src/cultivate/SproutInspector.tsx`  
**Audit:** Token usage check
**Finding:** Uses semantic Tailwind tokens appropriately

### Shared Forms
**Path:** `src/shared/forms/*.tsx`
**Audit:** Token usage, prop completeness
**Action:** Update Slider if valueLabel missing

### Shared Feedback
**Path:** `src/shared/feedback/*.tsx`
**Audit:** Token usage
**Finding:** Uses semantic Tailwind tokens appropriately

---

## Execution Order

```
1. Create DiaryInspector.tsx         (stub)
2. Create DiaryList.tsx              (stub)
3. Update NavigationSidebar.tsx      (IA v0.15)
4. Update ContentRouter.tsx          (routes)
5. Update Inspector.tsx              (diary case)
6. Update Slider.tsx                 (valueLabel prop)
7. Update LensInspector.tsx          (refactor to shared)
8. Test navigation flow
9. Test inspector opening
10. Visual regression check
```

---

## Rollback Plan

Each change is isolated. Rollback by reverting individual files:

```bash
# If IA breaks
git checkout HEAD -- src/workspace/NavigationSidebar.tsx

# If routing breaks
git checkout HEAD -- src/workspace/ContentRouter.tsx

# If inspectors break
git checkout HEAD -- src/workspace/Inspector.tsx
git checkout HEAD -- src/explore/LensInspector.tsx
```

---

## Test Checkpoints

| After Step | Test |
|------------|------|
| 3 | Nav shows new items |
| 4 | Clicking Diary shows DiaryList |
| 5 | Opening diary inspector works |
| 7 | LensInspector toggle/slider work |
