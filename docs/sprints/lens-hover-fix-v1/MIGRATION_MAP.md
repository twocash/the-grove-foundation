# Migration Map: lens-hover-fix-v1

## Overview

| Action | Count |
|--------|-------|
| Create | 0 |
| Modify | 2 |
| Delete | 0 |

## File Changes

### 1. styles/globals.css

**Action:** MODIFY (append)  
**Location:** After existing `.glass-card` rules (~line 660)  
**Lines Added:** ~25

**Changes:**
```css
/* ============================================
   GLASS SELECT BUTTON
   Sprint: lens-hover-fix-v1
   ============================================ */

.glass-select-button {
  font-size: 10px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all var(--duration-fast) var(--ease-out-expo);
  cursor: pointer;
}

.glass-select-button--ghost {
  background: transparent;
  border: 1px solid var(--glass-border-hover);
  color: var(--glass-text-muted);
}

.glass-select-button--ghost:hover {
  border-color: var(--neon-green);
  color: var(--neon-green);
}

.glass-select-button--solid {
  background: var(--neon-green);
  border: 1px solid var(--neon-green);
  color: var(--glass-void);
}

.glass-select-button--solid:hover {
  opacity: 0.9;
}
```

---

### 2. components/Terminal/LensGrid.tsx

**Action:** MODIFY  
**Lines Changed:** ~40

#### Change 2.1: Add hover state (after line 149)

**Before:**
```typescript
const [previewLens, setPreviewLens] = React.useState<string | null>(null);
```

**After:**
```typescript
const [previewLens, setPreviewLens] = React.useState<string | null>(null);
const [hoveredLens, setHoveredLens] = React.useState<string | null>(null);
```

#### Change 2.2: Update standard persona card (lines ~275-320)

**Before:**
```typescript
<div
  key={persona.id}
  onClick={() => setPreviewLens(persona.id)}
  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group relative cursor-pointer
    ${isSelected
      ? `${colors.bgLight} ${colors.border} border-2`
      : isPreviewed
        ? `${colors.bgLight} ${colors.border} border-2 ring-2 ring-offset-1`
        : isExternalHighlighted
          ? `bg-grove-clay/5 border-grove-clay/40 border-2 ring-2 ring-grove-clay/20 ring-offset-1`
          : embedded
            ? 'bg-[var(--chat-surface)] border-[var(--chat-border)] hover:border-[var(--chat-border-accent)]/50 hover:bg-[var(--chat-surface-hover)]'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm dark:hover:shadow-none'
    }`}
>
```

**After:**
```typescript
<div
  key={persona.id}
  onMouseEnter={() => setHoveredLens(persona.id)}
  onMouseLeave={() => setHoveredLens(null)}
  onClick={() => setPreviewLens(persona.id)}
  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group relative cursor-pointer
    ${isSelected
      ? `${colors.bgLight} ${colors.border} border-2`
      : isPreviewed
        ? 'bg-[var(--glass-elevated)] border-[var(--neon-green)] border-2'
        : isExternalHighlighted
          ? 'bg-grove-clay/5 border-grove-clay/40 border-2 ring-2 ring-grove-clay/20 ring-offset-1'
          : 'bg-[var(--glass-panel)] border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-elevated)]'
    }`}
>
```

#### Change 2.3: Update button rendering (lines ~345-360)

**Before:**
```typescript
{isSelected ? (
  <div className={`${colors.bg} text-white text-[9px] font-bold uppercase px-2 py-1 rounded`}>
    Active
  </div>
) : isPreviewed ? (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onSelect(persona.id);
      setPreviewLens(null);
    }}
    className={`${colors.bg} text-white text-[10px] font-medium px-3 py-1.5 rounded hover:opacity-90 transition-opacity`}
  >
    Select
  </button>
) : null}
```

**After:**
```typescript
{isSelected ? (
  <div className={`${colors.bg} text-white text-[9px] font-bold uppercase px-2 py-1 rounded`}>
    Active
  </div>
) : isPreviewed ? (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onSelect(persona.id);
      setPreviewLens(null);
    }}
    className="glass-select-button glass-select-button--solid"
  >
    Select
  </button>
) : hoveredLens === persona.id ? (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onSelect(persona.id);
    }}
    className="glass-select-button glass-select-button--ghost"
  >
    Select
  </button>
) : null}
```

#### Change 2.4: Apply same changes to Custom Lenses section (~lines 180-240)

Same pattern as 2.2 and 2.3, applied to the custom lenses map.

---

## Execution Order

1. **globals.css** — Add button classes first (no dependencies)
2. **LensGrid.tsx** — Update component (depends on new classes)

## Rollback Plan

1. Revert `LensGrid.tsx` to previous version
2. Remove `.glass-select-button` classes from `globals.css`
3. Build and verify

## Verification Commands

```bash
# After each file change
npm run build

# Final verification
npm run lint
npm run build
```
