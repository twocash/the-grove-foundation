# MIGRATION_MAP.md — Quantum Glass v1.1

## Sprint: Card System Unification
## Date: 2025-12-25

---

## Phase 1: CSS Foundation

### File: `styles/globals.css`

**Location:** After `.status-badge` definitions (around line 780)

**Add:**
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

**Lines Added:** ~80

---

## Phase 2: Inspector Context Fix

### File: `src/workspace/WorkspaceUIContext.tsx`

**Find (around line 108):**
```typescript
  // Navigation actions
  const navigateTo = useCallback((path: NavigationPath) => {
    setNavigation(s => ({
      ...s,
      activePath: path,
      selectedEntityId: null,
      selectedEntityType: null,
    }));
  }, []);
```

**Replace with:**
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

**Lines Changed:** ~15

---

## Phase 3: JourneyList Refactor

### File: `src/explore/JourneyList.tsx`

#### 3.1 Add Import

**Find (around line 8):**
```typescript
import { useEngagement, useJourneyState } from '@core/engagement';
```

**Add after:**
```typescript
import { StatusBadge } from '@shared/ui';
```

#### 3.2 Replace CompactJourneyCard (lines 20-60)

**Find:**
```typescript
function CompactJourneyCard({ journey, isActive, onStart }: {
  journey: Journey;
  isActive: boolean;
  onStart: () => void;
}) {
  return (
    <div
      onClick={onStart}
      className={`
        flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all
        ${isActive
          ? 'border-primary/50 bg-primary/10 dark:bg-primary/20'
          : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-primary/30'
        }
      `}
    >
      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 shrink-0">
        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
          {journey.icon || 'map'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium ${isActive ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
          {journey.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 italic truncate mb-1">
          "{journey.targetAha || journey.description}"
        </p>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span className="material-symbols-outlined text-sm">schedule</span>
          {journey.estimatedMinutes} min
        </div>
      </div>
      {isActive ? (
        <span className="px-2 py-1 text-xs font-medium rounded bg-primary/20 text-primary shrink-0">
          ACTIVE
        </span>
      ) : null}
    </div>
  );
}
```

**Replace with:**
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

#### 3.3 Replace JourneyCard (lines 70-130)

**Find the entire JourneyCard function and replace with:**
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

---

## Phase 4: LensPicker Refactor

### File: `src/explore/LensPicker.tsx`

#### 4.1 Add Import

**Find imports section, add:**
```typescript
import { StatusBadge } from '@shared/ui';
```

#### 4.2 Delete lensAccents Object

**Delete entire block (lines ~60-130):**
```typescript
// Accent colors for each lens persona
interface LensAccent {
  icon: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  borderHover: string;
  selectedBg: string;
  selectedBgDark: string;
}

const lensAccents: Record<string, LensAccent> = {
  'concerned-citizen': { ... },
  'academic': { ... },
  'engineer': { ... },
  // ... all persona entries
};

const defaultAccent: LensAccent = { ... };
```

**Lines Deleted:** ~80

#### 4.3 Replace CompactLensCard

**Find CompactLensCard function and replace with:**
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

#### 4.4 Replace LensCard

**Find LensCard function and replace with:**
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
      <p className="text-sm text-[var(--glass-text-muted)] italic mb-4">
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

---

## Phase 5: NodeGrid Refactor

### File: `src/explore/NodeGrid.tsx`

#### 5.1 Update Imports

**Find:**
```typescript
import { GitBranch, ArrowRight, Tag } from 'lucide-react';
```

**Delete this line** (no longer needed).

#### 5.2 Replace NodeCard

**Find NodeCard function and replace with:**
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

#### 5.3 Update Page Header and Section Headers

**Find (around line 118):**
```typescript
<h1 className="text-2xl font-semibold text-[var(--grove-text)] mb-1">
  Knowledge Nodes
</h1>
<p className="text-[var(--grove-text-muted)]">
```

**Replace with:**
```typescript
<h1 className="text-2xl font-semibold text-[var(--glass-text-primary)] mb-1">
  Knowledge Nodes
</h1>
<p className="text-[var(--glass-text-muted)]">
```

**Find section header (around line 130):**
```typescript
<h2 className="text-sm font-medium text-[var(--grove-text-dim)] uppercase tracking-wider mb-3">
```

**Replace with:**
```typescript
<h2 className="glass-section-header mb-3">
```

---

## Phase 6: Shared Components

### File: `src/shared/CollectionHeader.tsx`

**Find (around line 53):**
```typescript
<h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
  {title}
</h1>
<p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-2xl">
  {description}
</p>
```

**Replace with:**
```typescript
<h1 className="text-3xl font-bold text-[var(--glass-text-primary)] mb-3">
  {title}
</h1>
<p className="text-[var(--glass-text-muted)] mb-8 leading-relaxed max-w-2xl">
  {description}
</p>
```

---

### File: `src/shared/SearchInput.tsx`

**Find (around line 28):**
```typescript
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
  search
</span>
<input
  ref={inputRef}
  type="text"
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder={placeholder}
  className="w-full pl-10 pr-10 py-2.5 bg-surface-light dark:bg-slate-900 border border-border-light dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
/>
```

**Replace with:**
```typescript
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-subtle)]">
  search
</span>
<input
  ref={inputRef}
  type="text"
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder={placeholder}
  className="w-full pl-10 pr-10 py-2.5 bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--glass-text-secondary)] placeholder:text-[var(--glass-text-subtle)] focus:outline-none focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)]/30 transition-colors"
/>
```

**Find clear button (around line 38):**
```typescript
className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
```

**Replace with:**
```typescript
className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-secondary)] transition-colors"
```

---

### File: `src/shared/ActiveIndicator.tsx`

**Find entire component (lines 11-25):**
```typescript
export function ActiveIndicator({ label, value, icon, className = '' }: ActiveIndicatorProps) {
  return (
    <div className={`border border-border-light dark:border-slate-700 bg-stone-50 dark:bg-slate-900 rounded-lg p-4 flex items-center gap-3 shadow-sm ${className}`}>
      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {label}:
      </span>
      {icon && (
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
      )}
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}
```

**Replace with:**
```typescript
export function ActiveIndicator({ label, value, icon, className = '' }: ActiveIndicatorProps) {
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
}
```

---

## Verification Checkpoints

### After Phase 1
- [ ] New CSS utilities present in globals.css
- [ ] `npm run build` passes

### After Phase 2
- [ ] Navigate Journeys → Lenses with inspector open → inspector closes
- [ ] Navigate within Journeys → inspector stays open

### After Phase 3
- [ ] Journeys tab: Full cards show glass styling
- [ ] Journeys tab: Compact cards (chat nav) show glass styling
- [ ] No amber colors visible

### After Phase 4
- [ ] Lenses tab: Full cards show glass styling
- [ ] Lenses tab: Compact cards (chat nav) show glass styling
- [ ] No colored icon backgrounds
- [ ] All lenses use same icon

### After Phase 5
- [ ] Nodes tab: Cards show glass styling
- [ ] Section headers use glass-section-header

### After Phase 6
- [ ] Collection headers use glass text tokens
- [ ] Search inputs have cyan focus ring
- [ ] Active indicator has green pulse

### Final
- [ ] `npm run build` passes
- [ ] `npm test` all pass
- [ ] Visual sweep of all collection views
