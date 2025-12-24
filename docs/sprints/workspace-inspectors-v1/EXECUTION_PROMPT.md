# Sprint 3: Workspace Inspectors v1 — Execution Prompt

## Context

You are implementing Sprint 3 for the Grove project. PR #34 has been merged, establishing `--chat-*` token patterns. This sprint updates the Information Architecture to v0.15 and refactors inspector components.

## Repository

- **Path:** `C:\GitHub\the-grove-foundation`
- **Branch:** Create `feature/workspace-inspectors-v1` from main
- **Documentation:** `docs/sprints/workspace-inspectors-v1/`

## Pre-Read Required

Before coding, read these files:
1. `docs/sprints/workspace-inspectors-v1/SPEC.md` — Full requirements
2. `docs/sprints/workspace-inspectors-v1/ARCHITECTURE.md` — Design decisions
3. `docs/sprints/workspace-inspectors-v1/MIGRATION_MAP.md` — File-by-file changes
4. `src/workspace/NavigationSidebar.tsx` — Current IA structure
5. `src/workspace/ContentRouter.tsx` — View routing
6. `src/workspace/Inspector.tsx` — Inspector router
7. `src/explore/LensInspector.tsx` — Refactor target
8. `src/shared/forms/index.ts` — Shared form exports

## Execution Order

### Step 1: Create Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/workspace-inspectors-v1
```

### Step 2: Create DiaryList.tsx

Create `src/explore/DiaryList.tsx`:

```tsx
// src/explore/DiaryList.tsx
// Placeholder content view for diary entries

export function DiaryList() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <span className="material-symbols-outlined text-6xl text-[var(--grove-text-dim)] mb-4">
        auto_stories
      </span>
      <h2 className="text-xl font-semibold text-[var(--grove-text)] mb-2">
        Agent Diary
      </h2>
      <p className="text-[var(--grove-text-muted)] max-w-md mb-6">
        Daily reflections and discoveries from Grove agents exploring your knowledge field.
      </p>
      <div className="px-4 py-2 border border-[var(--grove-border)] rounded text-[var(--grove-text-dim)] text-sm">
        Coming in Grove 1.0
      </div>
    </div>
  );
}
```

### Step 3: Create DiaryInspector.tsx

Create `src/explore/DiaryInspector.tsx`:

```tsx
// src/explore/DiaryInspector.tsx
// Placeholder inspector for diary entries

interface DiaryInspectorProps {
  entryId?: string;
}

export function DiaryInspector({ entryId }: DiaryInspectorProps) {
  return (
    <div className="p-5 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 
                        border border-border-light dark:border-slate-700 
                        flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">
            menu_book
          </span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Agent Diary
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily reflections from Grove agents
          </p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="p-6 bg-stone-50 dark:bg-slate-900/50 rounded-xl 
                      border border-dashed border-slate-300 dark:border-slate-700
                      text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 block mb-3">
          auto_stories
        </span>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Diary entries coming soon
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Agents will share their daily discoveries here
        </p>
      </div>

      {/* Info */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-lg mt-0.5">
            info
          </span>
          <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
            The diary system will capture agent reflections, insights, and discoveries 
            as they explore your knowledge field.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Update NavigationSidebar.tsx

In `src/workspace/NavigationSidebar.tsx`:

1. Add to `iconNameToSymbol` (~line 15):
```tsx
book: 'menu_book',
```

2. Replace `groveProject` children (~lines 30-40):
```tsx
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

3. Update `cultivate` to remove mySprouts:
```tsx
cultivate: {
  id: 'cultivate',
  label: 'Cultivate',
  icon: 'sprout',
  children: {
    commons: { id: 'commons', label: 'Commons', view: 'commons-feed' },
  },
},
```

### Step 5: Update ContentRouter.tsx

In `src/workspace/ContentRouter.tsx`:

1. Add import (~line 10):
```tsx
import { DiaryList } from '../explore/DiaryList';
```

2. Add to `viewMap` (~line 110):
```tsx
'explore.groveProject.terminal': 'terminal',
'explore.groveProject.diary': 'diary-list',
'explore.groveProject.sprouts': 'sprout-grid',
```

3. Add render case (~line 160):
```tsx
{viewId === 'diary-list' && <DiaryList />}
```

### Step 6: Update Inspector.tsx

In `src/workspace/Inspector.tsx`:

1. Add import (~line 7):
```tsx
import { DiaryInspector } from '../explore/DiaryInspector';
```

2. Add case in `getTitle()` (~line 23):
```tsx
case 'diary': return 'Diary Inspector';
```

3. Add case in `renderContent()` (~line 70):
```tsx
case 'diary':
  return <DiaryInspector entryId={inspector.mode.entryId} />;
```

### Step 7: Refactor LensInspector.tsx

In `src/explore/LensInspector.tsx`:

1. Add imports at top (after existing imports):
```tsx
import { Toggle, Slider, Select, Checkbox } from '../../shared/forms';
import { InfoCallout } from '../../shared/feedback';
```

2. Delete these inline component definitions:
   - `function Toggle(...)` — lines ~11-47
   - `function Slider(...)` — lines ~49-72
   - `function Select(...)` — lines ~74-100
   - `function Checkbox(...)` — lines ~102-118
   - `function InfoCallout(...)` — lines ~120-135

3. Keep everything else (lensIcons, LensInspector component, etc.)

### Step 8: Test

Run dev server and verify:
```bash
npm run dev
```

1. Navigate to `/terminal`
2. Expand Explore → Grove Project
3. Verify 6 items: Terminal, Lenses, Journeys, Nodes, Diary, Sprouts
4. Click each - verify correct view loads
5. Open LensInspector - verify toggle/slider work
6. Check Cultivate only shows Commons

### Step 9: Commit

```bash
git add .
git commit -m "feat(workspace): IA v0.15 with diary stubs and LensInspector refactor

- Add Terminal, Diary, Sprouts to Grove Project nav
- Create DiaryList and DiaryInspector stubs
- Refactor LensInspector to use shared form components
- Move Sprouts from Cultivate to Project scope
- Update ContentRouter with new view routes"
```

### Step 10: Push and PR

```bash
git push -u origin feature/workspace-inspectors-v1
```

Create PR with title: `feat(workspace): IA v0.15 with diary stubs and inspector refactor`

## Success Criteria

- [ ] Nav shows 6 items under Grove Project
- [ ] Diary view shows placeholder
- [ ] LensInspector works (toggle, slider functional)
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Cultivate → Commons only

## Rollback

If issues arise:
```bash
git checkout main
git branch -D feature/workspace-inspectors-v1
```
