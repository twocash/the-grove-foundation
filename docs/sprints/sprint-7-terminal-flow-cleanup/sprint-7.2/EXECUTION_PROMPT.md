# Sprint 7.2: Execution Prompt

Copy this into Claude Code to execute.

---

## EXECUTION PROMPT

```
I need to implement Sprint 7.2 for The Grove Foundation - two parts:
A) LensPicker/WelcomeInterstitial width constraint (~768px)
B) Sidebar IA update (add Fields structure)

## Read First
- `docs/sprints/sprint-7-terminal-flow-cleanup/sprint-7.2/SPEC.md`

## Context
Sprint 7.1 (c325036) added dark mode to LensPicker/LensGrid. Now we need to:
1. Constrain content width to ~768px (max-w-3xl)
2. Update sidebar IA with "Grove Project" and "+ Fields"

---

## PART A: Width Constraint

### A1: Fix WelcomeInterstitial.tsx

File: `components/Terminal/WelcomeInterstitial.tsx`

Current state has legacy "THE GROVE TERMINAL [v2.5.0]" header and renders full-width.

Changes:
1. Remove the legacy header block (the "THE GROVE TERMINAL [v2.5.0]" and "Connection established" lines)
2. Wrap ALL content in a max-width container:
   ```tsx
   <div className="flex flex-col h-full overflow-y-auto">
     <div className="max-w-3xl mx-auto w-full px-4 py-6">
       {/* All content here */}
     </div>
   </div>
   ```
3. Update any remaining `text-ink` → `text-slate-900 dark:text-slate-100`
4. Update `text-ink-muted` → `text-slate-500 dark:text-slate-400`
5. Update `border-ink/5` → `border-slate-200 dark:border-slate-700`
6. Remove footer `bg-paper/50` or update to `bg-transparent`

### A2: Fix LensPicker.tsx

File: `components/Terminal/LensPicker.tsx`

Current state (post 7.1) has dark mode but renders full-width.

Changes:
1. Change outer div from `bg-white dark:bg-slate-900` to `bg-transparent`
2. Add max-width wrapper inside:
   ```tsx
   <div className="flex flex-col h-full bg-transparent">
     <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
       {/* Header and content here */}
     </div>
   </div>
   ```

---

## PART B: Sidebar IA Update

File: `src/workspace/NavigationSidebar.tsx`

### B1: Add icon mappings

Around line 11-20, add to iconNameToSymbol:
```typescript
forest: 'forest',
add_circle: 'add_circle_outline',
```

### B2: Update navigationTree

Replace the `explore` entry (around line 22-31) with:
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

Note: Remove the `view: 'terminal'` from the explore parent since it now goes on groveProject.

---

## Testing

After changes:
1. `npm run build` - verify no errors
2. `npm test` - verify tests pass
3. Open /explore in browser:
   - [ ] Welcome content is centered (~768px), not full-width
   - [ ] No "THE GROVE TERMINAL" text visible
   - [ ] Sidebar shows Explore → Grove Project → Nodes/Journeys/Lenses
   - [ ] Sidebar shows Explore → + Fields (grayed out)
   - [ ] Click "Grove Project" shows Terminal
   - [ ] Click lens pill → picker is centered, not full-width
   - [ ] Inspector panel remains visible on right side
```
