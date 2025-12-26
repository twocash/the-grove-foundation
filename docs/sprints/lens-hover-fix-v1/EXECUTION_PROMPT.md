# Execution Prompt: lens-hover-fix-v1

## Context

You are implementing a bug fix for lens card hover states in The Grove Foundation.

**Problem:** Lens cards lack hover affordance—users can't tell they're interactive until clicking.

**Solution:** Add ghost "Select" button on hover, align styling with glass token system.

## Project Location

```
C:\GitHub\the-grove-foundation
```

## Pre-Execution Checklist

```bash
cd C:\GitHub\the-grove-foundation
git status  # Should be clean
npm run build  # Should pass
```

## Files to Modify

1. `styles/globals.css` — Add button classes
2. `components/Terminal/LensGrid.tsx` — Add hover state

## Step 1: Add Button Classes to globals.css

**Location:** After existing `.glass-card` rules (around line 660)

**Add this block:**

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

**Verify:**
```bash
npm run build
```

## Step 2: Update LensGrid.tsx

### 2.1 Add Hover State

**Location:** After line ~149 (existing previewLens state)

**Find:**
```typescript
const [previewLens, setPreviewLens] = React.useState<string | null>(null);
```

**Replace with:**
```typescript
const [previewLens, setPreviewLens] = React.useState<string | null>(null);
const [hoveredLens, setHoveredLens] = React.useState<string | null>(null);
```

### 2.2 Update Standard Lens Card (personas.map section)

**Location:** Around line 275-290

**Find the opening div in personas.map:**
```typescript
<div
  key={persona.id}
  onClick={() => setPreviewLens(persona.id)}
  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group relative cursor-pointer
```

**Replace with:**
```typescript
<div
  key={persona.id}
  onMouseEnter={() => setHoveredLens(persona.id)}
  onMouseLeave={() => setHoveredLens(null)}
  onClick={() => setPreviewLens(persona.id)}
  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group relative cursor-pointer
```

**Update the className logic. Find:**
```typescript
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
```

**Replace with:**
```typescript
${isSelected
  ? `${colors.bgLight} ${colors.border} border-2`
  : isPreviewed
    ? 'bg-[var(--glass-elevated)] border-[var(--neon-green)] border-2'
    : isExternalHighlighted
      ? 'bg-grove-clay/5 border-grove-clay/40 border-2 ring-2 ring-grove-clay/20 ring-offset-1'
      : 'bg-[var(--glass-panel)] border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-elevated)]'
}`}
```

### 2.3 Update Button Rendering (Standard Lenses)

**Location:** Around line 345-360

**Find:**
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

**Replace with:**
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

### 2.4 Update Custom Lenses Section (if exists)

Apply the same changes to the custom lenses map (around lines 180-240):
- Add `onMouseEnter` and `onMouseLeave` handlers
- Update className to use glass tokens
- Update button rendering with ghost state

**Verify:**
```bash
npm run build
```

## Step 3: Manual Verification

1. Start dev server: `npm run dev`
2. Open http://localhost:3000/terminal
3. Verify states:
   - [ ] Default: No button, glass styling
   - [ ] Hover: Ghost "Select" button appears
   - [ ] Click card: Solid green "Select" button
   - [ ] Click Select: Lens activates
   - [ ] Active: Persona-colored "Active" badge

## Step 4: Commit

```bash
git add styles/globals.css components/Terminal/LensGrid.tsx
git commit -m "fix(lens-grid): add hover affordance and glass token styling

- Add hoveredLens state for hover tracking
- Show ghost Select button on hover
- Convert to solid button on preview (click)
- Use glass tokens for non-selected states
- Preserve persona colors for Active badge
- Create reusable .glass-select-button classes

Sprint: lens-hover-fix-v1"
```

## Troubleshooting

### Build fails after globals.css edit
- Check for syntax errors in CSS
- Ensure block is after `.glass-card` section
- Verify all variables exist (`--glass-*`, `--neon-*`, `--duration-fast`)

### Button not showing on hover
- Verify `hoveredLens` state is being set
- Check `onMouseEnter`/`onMouseLeave` handlers added
- Verify conditional `hoveredLens === persona.id`

### Styling looks wrong
- Clear browser cache
- Verify glass tokens are defined in :root
- Check no conflicting inline styles

## Success Criteria

- [ ] Ghost button appears on hover
- [ ] Solid button appears on preview
- [ ] Active badge retains persona color
- [ ] Build passes
- [ ] Clean commit
