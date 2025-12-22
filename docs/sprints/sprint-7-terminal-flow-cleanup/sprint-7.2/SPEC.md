# Sprint 7.2: Width Constraint & Sidebar IA

**Status:** Ready for Execution  
**Depends On:** Sprint 7.1 (c325036) - COMPLETE
**Priority:** HIGH

## Problem Statement

Screenshots reveal two remaining issues after Sprint 7.1:

1. **Width Violation:** LensPicker and WelcomeInterstitial render full-width, should be ~768px centered in middle column
2. **Sidebar IA:** Need "Fields" concept with "Grove Project" as knowledge base selector

## Part A: Width Constraint

### Current State (Post 7.1)

The LensPicker now has correct dark mode styling and minimal header, but still renders full-width, violating the three-column layout. Content should be constrained to `max-w-3xl` (~768px).

| Component | Issue |
|-----------|-------|
| WelcomeInterstitial | Full-width, legacy "THE GROVE TERMINAL" header still present |
| LensPicker | Full-width (dark mode fixed, width not) |

### Target Layout

```
┌──────────────┬─────────────────────────────────────┬──────────────────┐
│ Sidebar      │      max-w-3xl centered content     │   Inspector      │
│              │  ┌─────────────────────────────┐    │                  │
│              │  │ Welcome / Lens picker       │    │                  │
│              │  │ content here                │    │                  │
│              │  └─────────────────────────────┘    │                  │
└──────────────┴─────────────────────────────────────┴──────────────────┘
```

### Tasks

**Task A1: Fix WelcomeInterstitial.tsx**

File: `components/Terminal/WelcomeInterstitial.tsx`

1. Remove legacy header (lines 36-42): "THE GROVE TERMINAL [v2.5.0]" and "Connection established"
2. Wrap content in `max-w-3xl mx-auto` container
3. Update remaining `text-ink` classes to dark mode compatible
4. Remove or update footer `bg-paper/50`

**Task A2: Fix LensPicker.tsx**

File: `components/Terminal/LensPicker.tsx`

1. Change outer container to `bg-transparent` (parent provides background)
2. Wrap content in `max-w-3xl mx-auto w-full h-full flex flex-col`

---

## Part B: Sidebar IA Update

### Current Structure
```
Explore           ← Click shows Terminal
  ├─ Nodes
  ├─ Journeys
  └─ Lenses
```

### Target Structure
```
Explore
  └─ Grove Project     ← Click shows Terminal
      ├─ Nodes
      ├─ Journeys
      └─ Lenses
  └─ + Fields          ← Placeholder (doesn't work)
```

### Task B1: Update NavigationSidebar.tsx

File: `src/workspace/NavigationSidebar.tsx`

1. Add icon mappings:
```typescript
forest: 'forest',
add_circle: 'add_circle_outline',
```

2. Restructure `explore` in navigationTree:
```typescript
explore: {
  id: 'explore',
  label: 'Explore',
  icon: 'compass',
  children: {
    groveProject: {
      id: 'groveProject',
      label: 'Grove Project',
      icon: 'forest',
      view: 'terminal',
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
| `components/Terminal/WelcomeInterstitial.tsx` | Width constraint, remove legacy header | HIGH |
| `components/Terminal/LensPicker.tsx` | Width constraint, transparent bg | HIGH |
| `src/workspace/NavigationSidebar.tsx` | Add Fields IA structure | MEDIUM |

---

## Acceptance Criteria

### Part A
- [ ] WelcomeInterstitial content ≤768px centered
- [ ] LensPicker content ≤768px centered
- [ ] No "THE GROVE TERMINAL [v2.5.0]" text anywhere
- [ ] Inspector panel remains visible on right

### Part B
- [ ] "Grove Project" appears under Explore
- [ ] Nodes/Journeys/Lenses nested under Grove Project
- [ ] Clicking "Grove Project" shows Terminal
- [ ] "+ Fields" appears grayed out (comingSoon style)

---

## Testing Checklist

1. **Width constraint:**
   - [ ] Fresh visit: welcome content centered, not full-width
   - [ ] Click lens pill: picker centered, not full-width
   - [ ] Inspector panel visible throughout

2. **Sidebar IA:**
   - [ ] Expand Explore → see "Grove Project" and "+ Fields"
   - [ ] Click "Grove Project" → Terminal shows
   - [ ] Expand "Grove Project" → see Nodes/Journeys/Lenses
   - [ ] "+ Fields" shows "Soon" badge, non-functional
