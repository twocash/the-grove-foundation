# Sprint 7.1: Execution Prompt

Copy this into Claude Code to execute.

---

## EXECUTION PROMPT

```
I need to implement Sprint 7.1 for The Grove Foundation - two parts:
A) LensPicker width constraint (~768px)
B) Sidebar IA update (add Fields structure)

## Read First
- `docs/sprints/sprint-7-terminal-flow-cleanup/sprint-7.1/SPEC.md`

---

## PART A: LensPicker Width Constraint

### Problem
Terminal's LensPicker and WelcomeInterstitial render full-width but should be constrained to ~768px (max-w-3xl) centered.

### A1: Fix WelcomeInterstitial.tsx

File: `components/Terminal/WelcomeInterstitial.tsx`

Changes:
1. Remove lines 36-42 (the legacy "THE GROVE TERMINAL [v2.5.0]" header)
2. Wrap all content in: `<div className="max-w-3xl mx-auto w-full">`
3. Update text classes for dark mode:
   - `text-ink` → `text-slate-900 dark:text-slate-100`
   - `text-ink-muted` → `text-slate-500 dark:text-slate-400`
   - `border-ink/5` → `border-slate-200 dark:border-slate-700`
4. Remove or update the footer `bg-paper/50` to dark mode compatible

### A2: Fix LensPicker.tsx

File: `components/Terminal/LensPicker.tsx`

Changes:
1. Change outer container from `bg-white dark:bg-slate-900` to `bg-transparent`
2. Wrap content in: `<div className="max-w-3xl mx-auto w-full h-full flex flex-col">`
3. Keep the "Back to Chat" header inside the constrained width

### A3: Check LensGrid.tsx

File: `components/Terminal/LensGrid.tsx`

Review and update any light-mode-only classes:
- `bg-white` → `bg-white dark:bg-slate-800`
- `text-ink` → `text-slate-900 dark:text-slate-100`
- `border-ink/10` → `border-slate-200 dark:border-slate-700`

---

## PART B: Sidebar IA Update

### Problem
Need to add "Fields" concept with "Grove Project" as nested knowledge base.

### Current:
```
Explore
  ├─ Nodes
  ├─ Journeys
  └─ Lenses
```

### Target:
```
Explore
  └─ Grove Project     ← Click shows Terminal
      ├─ Nodes
      ├─ Journeys
      └─ Lenses
  └─ + Fields          ← Placeholder, doesn't work
```

### B1: Update NavigationSidebar.tsx

File: `src/workspace/NavigationSidebar.tsx`

1. Add to iconNameToSymbol (around line 11):
```typescript
forest: 'forest',
add_circle: 'add_circle_outline',
```

2. Replace the `explore` entry in navigationTree (around line 22):
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
      comingSoon: true,  // Reuse existing disabled styling
    },
  },
},
```

3. The existing `comingSoon` styling should handle making "+ Fields" look disabled/placeholder.

---

## Testing

After changes:
1. `npm run build` - verify no errors
2. Open /explore in browser
3. Check:
   - [ ] Welcome content is centered (~768px wide)
   - [ ] Lens picker is centered when opened
   - [ ] Sidebar shows "Grove Project" under Explore
   - [ ] Clicking "Grove Project" shows Terminal
   - [ ] Nodes/Journeys/Lenses are nested under Grove Project
   - [ ] "+ Fields" appears grayed out
   - [ ] Dark mode looks correct
```
