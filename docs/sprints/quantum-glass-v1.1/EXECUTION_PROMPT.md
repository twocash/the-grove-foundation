# EXECUTION_PROMPT.md — Quantum Glass v1.1

## Sprint: Card System Unification
## Date: 2025-12-25

---

## CONTEXT

You are executing Phase 8.5 of the Quantum Glass design system sprint. The goal is to unify all collection view cards (Journeys, Lenses, Nodes) under consistent glass styling, fix an inspector context bug, and update shared components.

**Repository:** `C:\GitHub\the-grove-foundation`
**Branch:** Work on current branch (main)

---

## PHASE 1: CSS FOUNDATION

### Task
Add card utility classes to globals.css.

### File
`styles/globals.css`

### Action
Find the `.status-badge` section (around line 780) and ADD the following block AFTER it:

```css
/* ============================================
   CARD UTILITIES - Quantum Glass v1.1
   ============================================ */

/* Card icon - monochrome, subtle */
.glass-card-icon {
  color: var(--glass-text-muted);
  font-size: 20px;
  transition: color var(--duration-fast);
}

.glass-card:hover .glass-card-icon {
  color: var(--glass-text-secondary);
}

/* Callout block - cyan left border */
.glass-callout {
  padding: 10px 14px;
  margin: 12px 0;
  border-left: 2px solid var(--neon-cyan);
  background: transparent;
  color: var(--glass-text-muted);
  font-style: italic;
  font-size: 13px;
  line-height: 1.5;
}

/* Card footer - metadata + action row */
.glass-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--glass-border);
}

/* Card metadata */
.glass-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--glass-text-subtle);
}

.glass-card-meta .material-symbols-outlined {
  font-size: 14px;
}

/* Primary action button - green */
.glass-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  background: var(--neon-green);
  color: white;
  border: none;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.glass-btn-primary:hover {
  background: rgba(16, 185, 129, 0.85);
  box-shadow: var(--glow-green);
}

/* Secondary action button - subtle */
.glass-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  background: var(--glass-elevated);
  color: var(--glass-text-secondary);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.glass-btn-secondary:hover {
  border-color: var(--neon-cyan);
  color: var(--glass-text-primary);
}
```

### Verify
```bash
npm run build
```

---

## PHASE 2: INSPECTOR CONTEXT FIX

### Task
Close inspector when navigating to a different collection type.

### File
`src/workspace/WorkspaceUIContext.tsx`

### Action
Find the `navigateTo` callback (around line 108):

```typescript
const navigateTo = useCallback((path: NavigationPath) => {
  setNavigation(s => ({
    ...s,
    activePath: path,
    selectedEntityId: null,
    selectedEntityType: null,
  }));
}, []);
```

REPLACE with:

```typescript
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

### Verify
Build should still pass. Manual test: open inspector on Journeys, navigate to Lenses, inspector should close.

---

## PHASE 3: JOURNEYLIST REFACTOR

### Task
Update both CompactJourneyCard and JourneyCard to glass pattern.

### File
`src/explore/JourneyList.tsx`

### Action 3.1: Add Import
Find imports section and ADD:
```typescript
import { StatusBadge } from '@shared/ui';
```

### Action 3.2: Replace CompactJourneyCard
Find the `CompactJourneyCard` function and REPLACE entirely with:

```typescript
function CompactJourneyCard({ journey, isActive, onStart }: {
  journey: Journey;
  isActive: boolean;
  onStart: () => void;
}) {
  return (
    <div
      data-active={isActive || undefined}
      onClick={onStart}
      className="glass-card p-4 cursor-pointer flex items-center gap-4"
    >
      <span className="material-symbols-outlined glass-card-icon text-xl">map</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
          {journey.title}
        </h3>
        <p className="text-sm text-[var(--glass-text-muted)] italic truncate">
          {journey.targetAha || journey.description}
        </p>
        <div className="flex items-center gap-1 text-xs text-[var(--glass-text-subtle)] mt-1">
          <span className="material-symbols-outlined text-sm">schedule</span>
          {journey.estimatedMinutes} min
        </div>
      </div>
      {isActive && <StatusBadge variant="active" />}
    </div>
  );
}
```

### Action 3.3: Replace JourneyCard
Find the `JourneyCard` function and REPLACE entirely with:

```typescript
function JourneyCard({ journey, isActive, isInspected, onStart, onView }: JourneyCardProps) {
  return (
    <article
      data-selected={isInspected || undefined}
      data-active={isActive || undefined}
      className="glass-card p-5 cursor-pointer"
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined glass-card-icon">map</span>
          <h3 className="font-medium text-[var(--glass-text-primary)]">
            {journey.title}
          </h3>
        </div>
        {isActive && <StatusBadge variant="active" />}
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--glass-text-muted)] mb-3 line-clamp-2">
        {journey.description}
      </p>

      {/* Target Aha Callout */}
      {journey.targetAha && (
        <div className="glass-callout line-clamp-2">
          {journey.targetAha}
        </div>
      )}

      {/* Footer */}
      <div className="glass-card-footer">
        <div className="glass-card-meta">
          <span className="material-symbols-outlined">schedule</span>
          <span>{journey.estimatedMinutes} min</span>
        </div>
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onStart(); }}
            className="glass-btn-primary"
          >
            <span className="material-symbols-outlined text-sm">play_arrow</span>
            Start
          </button>
        )}
      </div>
    </article>
  );
}
```

### Verify
```bash
npm run build
```
Visual check: Journeys tab should show glass-styled cards with cyan callouts (no amber).

---

## PHASE 4: LENSPICKER REFACTOR

### Task
Remove lensAccents, update both CompactLensCard and LensCard to glass pattern.

### File
`src/explore/LensPicker.tsx`

### Action 4.1: Add Import
Find imports section and ADD:
```typescript
import { StatusBadge } from '@shared/ui';
```

### Action 4.2: Delete lensAccents
Find and DELETE the entire `lensAccents` block. This includes:
- The `LensAccent` interface
- The `lensAccents` Record object with all persona entries
- The `defaultAccent` constant

This is approximately 80 lines starting around line 60. Delete from `// Accent colors for each lens persona` through the closing of `defaultAccent`.

### Action 4.3: Replace CompactLensCard
Find the `CompactLensCard` function and REPLACE entirely with:

```typescript
function CompactLensCard({ lens, isActive, onSelect, onView }: {
  lens: DisplayLens;
  isActive: boolean;
  onSelect: () => void;
  onView: () => void;
}) {
  const isCustom = 'isCustom' in lens && lens.isCustom;

  return (
    <div
      data-active={isActive || undefined}
      onClick={onView}
      className="glass-card p-4 cursor-pointer flex items-center gap-4"
    >
      <span className="material-symbols-outlined glass-card-icon text-xl">
        {isCustom ? 'auto_fix_high' : 'psychology'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {lens.publicLabel}
          </h3>
          {isCustom && (
            <span className="text-[10px] uppercase font-bold text-[var(--neon-violet)]">Custom</span>
          )}
        </div>
        <p className="text-sm text-[var(--glass-text-muted)] italic truncate">
          "{lens.description}"
        </p>
      </div>
      {isActive ? (
        <StatusBadge variant="active" />
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="glass-btn-secondary"
        >
          Select
        </button>
      )}
    </div>
  );
}
```

### Action 4.4: Replace LensCard
Find the `LensCard` function and REPLACE entirely with:

```typescript
function LensCard({ persona, isActive, isInspected, onSelect, onView }: LensCardProps) {
  return (
    <article
      data-selected={isInspected || undefined}
      data-active={isActive || undefined}
      className="glass-card p-5 cursor-pointer flex flex-col"
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="material-symbols-outlined glass-card-icon text-2xl">psychology</span>
        {isActive && <StatusBadge variant="active" />}
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-[var(--glass-text-primary)] mb-1">
        {persona.publicLabel}
      </h3>

      {/* Description */}
      <p className="text-sm text-[var(--glass-text-muted)] italic mb-4 line-clamp-2">
        "{persona.description}"
      </p>

      {/* Footer */}
      <div className="glass-card-footer mt-auto">
        <div /> {/* Spacer */}
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="glass-btn-primary"
          >
            Select
          </button>
        )}
      </div>
    </article>
  );
}
```

### Verify
```bash
npm run build
```
Visual check: Lenses tab should show glass-styled cards with monochrome brain icons (no colored backgrounds).

---

## PHASE 5: NODEGRID REFACTOR

### Task
Update NodeCard to glass pattern, remove lucide imports.

### File
`src/explore/NodeGrid.tsx`

### Action 5.1: Remove Lucide Import
Find and DELETE:
```typescript
import { GitBranch, ArrowRight, Tag } from 'lucide-react';
```

### Action 5.2: Replace NodeCard
Find the `NodeCard` function and REPLACE entirely with:

```typescript
function NodeCard({ node, onSelect }: NodeCardProps) {
  const connectionsCount = 'next' in node && node.next ? node.next.length :
                          ('primaryNext' in node ? (node.primaryNext ? 1 : 0) + (node.alternateNext?.length || 0) : 0);
  const sectionId = 'sectionId' in node ? node.sectionId : null;

  return (
    <article
      onClick={() => onSelect(node.id)}
      className="glass-card p-4 cursor-pointer group"
    >
      {/* Title */}
      <h3 className="font-medium text-[var(--glass-text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--neon-cyan)] transition-colors">
        {node.label}
      </h3>

      {/* Query preview */}
      <p className="text-sm text-[var(--glass-text-muted)] line-clamp-2 mb-3">
        {node.query}
      </p>

      {/* Footer */}
      <div className="glass-card-footer">
        <div className="glass-card-meta">
          {sectionId && (
            <>
              <span className="material-symbols-outlined">sell</span>
              <span>{sectionId}</span>
            </>
          )}
        </div>
        {connectionsCount > 0 && (
          <span className="text-xs text-[var(--glass-text-subtle)]">
            → {connectionsCount} next
          </span>
        )}
      </div>
    </article>
  );
}
```

### Action 5.3: Update Page Header
Find:
```typescript
text-[var(--grove-text)]
```
REPLACE ALL occurrences with:
```typescript
text-[var(--glass-text-primary)]
```

Find:
```typescript
text-[var(--grove-text-muted)]
```
REPLACE ALL occurrences with:
```typescript
text-[var(--glass-text-muted)]
```

Find:
```typescript
text-[var(--grove-text-dim)]
```
REPLACE ALL occurrences with:
```typescript
text-[var(--glass-text-subtle)]
```

### Verify
```bash
npm run build
```
Visual check: Nodes tab should show glass-styled cards.

---

## PHASE 6: SHARED COMPONENTS

### Task
Update CollectionHeader, SearchInput, ActiveIndicator to glass tokens.

### File 6.1: `src/shared/CollectionHeader.tsx`

Find:
```typescript
<h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
```
REPLACE with:
```typescript
<h1 className="text-3xl font-bold text-[var(--glass-text-primary)] mb-3">
```

Find:
```typescript
<p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-2xl">
```
REPLACE with:
```typescript
<p className="text-[var(--glass-text-muted)] mb-8 leading-relaxed max-w-2xl">
```

### File 6.2: `src/shared/SearchInput.tsx`

Find the search icon span:
```typescript
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
```
REPLACE with:
```typescript
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-subtle)]">
```

Find the input className:
```typescript
className="w-full pl-10 pr-10 py-2.5 bg-surface-light dark:bg-slate-900 border border-border-light dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
```
REPLACE with:
```typescript
className="w-full pl-10 pr-10 py-2.5 bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--glass-text-secondary)] placeholder:text-[var(--glass-text-subtle)] focus:outline-none focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)]/30 transition-colors"
```

Find the clear button className:
```typescript
className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
```
REPLACE with:
```typescript
className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-secondary)] transition-colors"
```

### File 6.3: `src/shared/ActiveIndicator.tsx`

REPLACE the entire return statement with:

```typescript
return (
  <div className={`border border-[var(--glass-border)] bg-[var(--glass-solid)] rounded-lg p-4 flex items-center gap-3 ${className}`}>
    <div className="h-2 w-2 rounded-full bg-[var(--neon-green)] animate-pulse" />
    <span className="text-sm font-medium text-[var(--glass-text-subtle)] uppercase tracking-wide">
      {label}:
    </span>
    {icon && (
      <span className="material-symbols-outlined text-[var(--neon-green)] text-lg">{icon}</span>
    )}
    <span className="text-sm font-semibold text-[var(--glass-text-primary)]">
      {value}
    </span>
  </div>
);
```

### Verify
```bash
npm run build
```

---

## PHASE 7: FINAL VERIFICATION

### Commands
```bash
cd C:\GitHub\the-grove-foundation
npm test
npm run build
```

### Visual Checklist
- [ ] Journeys tab: Glass cards, cyan callouts, no amber
- [ ] Lenses tab: Glass cards, monochrome icons, no colored backgrounds
- [ ] Nodes tab: Glass cards, footer with metadata
- [ ] Chat nav picker: Glass compact cards
- [ ] Search inputs: Cyan focus ring
- [ ] Active indicator: Green pulse
- [ ] Inspector: Closes when switching collections

### Commit
```bash
git add -A
git commit -m "feat(ui): Quantum Glass v1.1 - Card System Unification

- Add card CSS utilities (icon, callout, footer, meta, buttons)
- Fix inspector context persistence bug
- Refactor JourneyCard (full + compact) to glass pattern
- Refactor LensCard (full + compact) to glass pattern
- Remove lensAccents color system (~80 lines deleted)
- Refactor NodeCard to glass pattern
- Update CollectionHeader, SearchInput, ActiveIndicator to glass tokens
- Standardize to single icon per object type

Closes visual inconsistency between collection views."

git push origin main
```

---

## TROUBLESHOOTING

### Build Fails After Phase X
1. Check for syntax errors in the modified file
2. Ensure all imports are present
3. Verify bracket/parenthesis matching

### TypeScript Errors
- If `StatusBadge` import fails: Check path is `@shared/ui`
- If data attributes show type errors: Use `|| undefined` pattern

### Visual Issues
- Cards not styling: Verify `glass-card` class is present
- Hover not working: Check CSS utilities were added correctly
- Colors wrong: Verify `--glass-*` token names are exact

---

## COMPLETION CHECKLIST

- [ ] Phase 1: CSS utilities added
- [ ] Phase 2: Inspector context fix applied
- [ ] Phase 3: JourneyList refactored
- [ ] Phase 4: LensPicker refactored (lensAccents deleted)
- [ ] Phase 5: NodeGrid refactored
- [ ] Phase 6: Shared components updated
- [ ] Phase 7: All tests pass, build succeeds
- [ ] Committed and pushed
