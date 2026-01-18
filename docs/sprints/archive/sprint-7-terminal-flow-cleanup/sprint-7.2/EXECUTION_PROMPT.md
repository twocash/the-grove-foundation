# Sprint 7.2: Execution Prompt

Copy this into Claude Code.

---

## CONTEXT

Sprint 7.2 has TWO focused tasks:
1. Fix LensCard interaction pattern (click card → inspector, click "Select" → activate)
2. Update sidebar IA (Grove Project nesting, + Fields)

The inspector (`LensInspector.tsx`) and wiring (`Inspector.tsx`) already exist and work.

**Read first:**
- `docs/sprints/sprint-7-terminal-flow-cleanup/sprint-7.2/SPEC.md`
- `src/explore/JourneyList.tsx` lines 16-88 - JourneyCard pattern to match
- `src/explore/LensPicker.tsx` - Current implementation to update

---

## EXECUTION PROMPT

```
Implement Sprint 7.2: LensPicker Card Pattern + Sidebar IA

## Task 1: Update LensCard in src/explore/LensPicker.tsx

Current LensCard is a <button> that selects AND opens inspector on click.
Change to match JourneyCard pattern: click card → inspector, click button → action.

### 1a. Update LensCardProps interface (around line 109):

FROM:
```tsx
interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  onSelect: () => void;
}
```

TO:
```tsx
interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  onSelect: () => void;  // Select button click
  onView: () => void;    // Card body click → opens inspector
}
```

### 1b. Rewrite LensCard component (around line 113-149):

Replace the entire LensCard function with:

```tsx
function LensCard({ persona, isActive, onSelect, onView }: LensCardProps) {
  const accent = lensAccents[persona.id] || defaultAccent;

  return (
    <div
      onClick={onView}
      className={`
        group cursor-pointer flex flex-col p-5 rounded-xl border transition-all text-left relative
        ${isActive
          ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20'
          : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
        }
      `}
    >
      {/* Header: Icon + Active Badge */}
      <div className="flex items-start justify-between mb-3">
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

      {/* Title */}
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
        {persona.publicLabel}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-4">
        "{persona.description}"
      </p>

      {/* Footer: Select button (only if not active) */}
      <div className="flex items-center justify-end mt-auto">
        {!isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
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

### 1c. Update handleSelect and add handleView in LensPicker (around line 160-170):

Find the existing handleSelect function and update:

```tsx
const handleSelect = (personaId: string) => {
  selectLens(personaId);
  openInspector({ type: 'lens', lensId: personaId });
};

const handleView = (personaId: string) => {
  openInspector({ type: 'lens', lensId: personaId });
};
```

### 1d. Update LensCard usage in the grid (around line 195):

FROM:
```tsx
<LensCard
  key={persona.id}
  persona={persona}
  isActive={activeLensId === persona.id}
  onSelect={() => handleSelect(persona.id)}
/>
```

TO:
```tsx
<LensCard
  key={persona.id}
  persona={persona}
  isActive={activeLensId === persona.id}
  onSelect={() => handleSelect(persona.id)}
  onView={() => handleView(persona.id)}
/>
```

---

## Task 2: Update Sidebar IA in src/workspace/NavigationSidebar.tsx

### 2a. Add icon mappings (around line 11-21):

Add these to the iconNameToSymbol object:
```typescript
forest: 'forest',
add_circle: 'add_circle_outline',
```

### 2b. Replace explore entry in navigationTree (around line 23-32):

Replace the entire `explore:` block with:

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

## Testing

After changes:
1. `npm run build` - verify no TypeScript errors
2. `npm test` - verify tests pass
3. Open /explore in browser:

**Test LensPicker:**
- [ ] Navigate to Explore → Grove Project → Lenses
- [ ] See lens cards with "Select" buttons
- [ ] Click anywhere on card body → Inspector opens
- [ ] Active lens is NOT changed by clicking card
- [ ] Click "Select" button on inactive lens → That lens activates
- [ ] Active lens shows "Active" badge, no Select button

**Test Sidebar:**
- [ ] Expand Explore → see "Grove Project" and "+ Fields"
- [ ] "Grove Project" has forest icon
- [ ] "+ Fields" has add icon and "Soon" badge
- [ ] Click Grove Project → Terminal shows
- [ ] Expand Grove Project → see Nodes/Journeys/Lenses
- [ ] Clicking Explore just expands (no navigation)
```
