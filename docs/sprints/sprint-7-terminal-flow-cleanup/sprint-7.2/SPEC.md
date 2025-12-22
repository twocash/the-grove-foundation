# Sprint 7.2: LensPicker Card Pattern + Sidebar IA

**Status:** Ready for Execution  
**Depends On:** Sprint 7.1 (c325036) - COMPLETE
**Priority:** HIGH

## Current State Analysis

**What Already Exists (and is GOOD):**
- `src/explore/LensPicker.tsx` - Has CollectionHeader, search, grid layout ✅
- `src/explore/LensInspector.tsx` - Full inspector with config UI, toggle, CTAs ✅
- `src/workspace/Inspector.tsx` - Already wired to show LensInspector ✅

**What Needs Fixing:**

| Issue | Current | Target |
|-------|---------|--------|
| LensCard interaction | Click card → immediate selection + opens inspector | Click card → ONLY opens inspector; "Select" button → selection |
| Sidebar IA | Flat: Nodes/Journeys/Lenses | Nested: Grove Project → Nodes/Journeys/Lenses; + Fields |

---

## Part A: Fix LensCard Interaction Pattern

The JourneyCard pattern separates viewing from action:
- **Click card** → View details (open inspector)
- **Click "Start" button** → Take action (start journey)

LensCard should follow the same pattern:
- **Click card** → View details (open inspector)
- **Click "Select" button** → Activate lens

### Task A1: Update LensCard Props

```tsx
interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  onSelect: () => void;  // Click "Select" button
  onView: () => void;    // Click card body
}
```

### Task A2: Update LensCard Component

Change from `<button>` to `<div>` and add footer with "Select" button:

```tsx
function LensCard({ persona, isActive, onSelect, onView }: LensCardProps) {
  const accent = lensAccents[persona.id] || defaultAccent;

  return (
    <div
      onClick={onView}  // Card click opens inspector
      className={`
        group cursor-pointer flex flex-col items-start p-5 rounded-xl border transition-all text-left relative
        ${isActive
          ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20'
          : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
        }
      `}
    >
      {/* Header row with icon and active badge */}
      <div className="flex items-start justify-between w-full mb-3">
        <div className={`${accent.bgLight} ${accent.bgDark} p-2.5 rounded-lg`}>
          <span className={`material-symbols-outlined ${accent.textLight} ${accent.textDark} text-xl`}>
            {accent.icon}
          </span>
        </div>
        {isActive && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-medium">
            Active
          </span>
        )}
      </div>

      {/* Label */}
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
        {persona.publicLabel}
      </h3>

      {/* Description as italic quote */}
      <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-4">
        "{persona.description}"
      </p>

      {/* Footer with Select button */}
      <div className="flex items-center justify-end w-full mt-auto">
        {!isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();  // Don't trigger card click
              onSelect();
            }}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Select
          </button>
        )}
      </div>
    </div>
  );
}
```

### Task A3: Update LensPicker to Wire Both Handlers

```tsx
const handleSelect = (personaId: string) => {
  selectLens(personaId);
  // Also open inspector to confirm selection
  openInspector({ type: 'lens', lensId: personaId });
};

const handleView = (personaId: string) => {
  // Only open inspector, don't change selection
  openInspector({ type: 'lens', lensId: personaId });
};

// In grid:
<LensCard
  key={persona.id}
  persona={persona}
  isActive={activeLensId === persona.id}
  onSelect={() => handleSelect(persona.id)}
  onView={() => handleView(persona.id)}
/>
```

---

## Part B: Sidebar IA Update

### Current Structure
```
Explore (view: terminal)
  ├─ Nodes
  ├─ Journeys
  └─ Lenses
```

### Target Structure
```
Explore
  └─ Grove Project (view: terminal)
      ├─ Nodes
      ├─ Journeys
      └─ Lenses
  └─ + Fields (comingSoon)
```

### Task B1: Add Icon Mappings

File: `src/workspace/NavigationSidebar.tsx` (around line 11)

```typescript
const iconNameToSymbol: Record<string, string> = {
  // ... existing
  forest: 'forest',
  add_circle: 'add_circle_outline',
};
```

### Task B2: Update Navigation Tree

Replace `explore` entry (around line 22):

```typescript
explore: {
  id: 'explore',
  label: 'Explore',
  icon: 'compass',
  // NO view here - just a container now
  children: {
    groveProject: {
      id: 'groveProject',
      label: 'Grove Project',
      icon: 'forest',
      view: 'terminal',  // Click Grove Project → Terminal
      children: {
        nodes: { id: 'nodes', label: 'Nodes', icon: 'branch', view: 'node-grid' },
        journeys: { id: 'journeys', label: 'Journeys', icon: 'map', view: 'journey-list' },
        lenses: { id: 'lenses', label: 'Lenses', icon: 'glasses', view: 'lens-picker' },
      },
    },
    addField: {
      id: 'addField',
      label: '+ Fields',
      icon: 'add_circle',
      comingSoon: true,
    },
  },
},
```

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `src/explore/LensPicker.tsx` | Update LensCard props and component, wire onView | HIGH |
| `src/workspace/NavigationSidebar.tsx` | Add icons, restructure explore tree | HIGH |

---

## Acceptance Criteria

### Part A (LensCard Pattern)
- [ ] Click lens card → Inspector opens (does NOT change active lens)
- [ ] Click "Select" button → Lens activates + inspector opens
- [ ] Active lens shows "Active" badge instead of "Select" button
- [ ] Card styling matches mockup (icon top-left, description italic)

### Part B (Sidebar IA)
- [ ] "Grove Project" appears under Explore with forest icon
- [ ] Nodes/Journeys/Lenses nested under Grove Project
- [ ] Clicking "Grove Project" shows Terminal
- [ ] "+ Fields" appears with "Soon" styling
- [ ] Clicking Explore expands to show Grove Project (doesn't navigate)

---

## Testing Checklist

1. **LensPicker interaction:**
   - [ ] Navigate to Lenses view
   - [ ] Click a lens card → Inspector opens with lens details
   - [ ] Active lens is NOT changed
   - [ ] Click "Select" button on a different lens → That lens becomes active
   - [ ] Inspector updates to show selected lens config

2. **Sidebar navigation:**
   - [ ] Expand Explore → see "Grove Project" and "+ Fields"
   - [ ] Click Grove Project → Terminal shows
   - [ ] Expand Grove Project → see Nodes/Journeys/Lenses
   - [ ] Click Lenses → Lens picker shows
   - [ ] "+ Fields" is grayed/disabled
