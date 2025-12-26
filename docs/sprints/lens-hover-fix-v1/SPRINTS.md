# Sprint Breakdown: lens-hover-fix-v1

## Overview

| Epic | Stories | Estimated |
|------|---------|-----------|
| Epic 1: Button Token Classes | 1 | 15 min |
| Epic 2: LensGrid Hover State | 3 | 45 min |
| Epic 3: Verification | 2 | 15 min |
| **Total** | **6** | **~75 min** |

---

## Epic 1: Button Token Classes

Add glass select button styles to design system.

### Story 1.1: Add .glass-select-button Classes

**Task:** Append button classes to globals.css after existing .glass-card rules.

**File:** `styles/globals.css`

**Implementation:**
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

**Build Gate:**
```bash
npm run build
```

---

## Epic 2: LensGrid Hover State

Implement hover tracking and button state logic.

### Story 2.1: Add Hover State

**Task:** Add `hoveredLens` state to LensGrid component.

**File:** `components/Terminal/LensGrid.tsx`

**Location:** After existing `previewLens` state (line ~149)

**Implementation:**
```typescript
const [previewLens, setPreviewLens] = React.useState<string | null>(null);
const [hoveredLens, setHoveredLens] = React.useState<string | null>(null);
```

**Build Gate:**
```bash
npm run build
```

---

### Story 2.2: Update Standard Lens Card Styling

**Task:** Add mouse handlers and update className logic for standard personas.

**File:** `components/Terminal/LensGrid.tsx`

**Location:** Standard personas map (~lines 275-320)

**Changes:**
1. Add `onMouseEnter={() => setHoveredLens(persona.id)}`
2. Add `onMouseLeave={() => setHoveredLens(null)}`
3. Update className to use glass tokens for non-selected states

**Implementation:**
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

**Build Gate:**
```bash
npm run build
```

---

### Story 2.3: Update Button Rendering Logic

**Task:** Add ghost button for hover state, update button classes.

**File:** `components/Terminal/LensGrid.tsx`

**Location:** Button rendering section (~lines 345-360)

**Implementation:**
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

**Build Gate:**
```bash
npm run build
```

---

### Story 2.4: Update Custom Lenses Section

**Task:** Apply same changes to custom lenses map.

**File:** `components/Terminal/LensGrid.tsx`

**Location:** Custom lenses section (~lines 180-240)

**Changes:** Mirror Story 2.2 and 2.3 for custom lens cards.

**Build Gate:**
```bash
npm run build
```

---

## Epic 3: Verification

### Story 3.1: Manual Testing

**Task:** Verify all states render correctly.

**Checklist:**
- [ ] Default: No button visible, glass border
- [ ] Hover: Ghost Select button appears
- [ ] Ghost button hover: Border turns green
- [ ] Click ghost button: Lens activates immediately
- [ ] Click card: Preview state with solid button
- [ ] Click solid Select: Lens activates
- [ ] Active: Persona-colored Active badge
- [ ] Custom lenses: Same behavior as standard

**Verification:**
1. Open http://localhost:3000/terminal
2. Test each lens card through all states
3. Test at least one custom lens if available

---

### Story 3.2: Build & Lint Verification

**Task:** Ensure no regressions.

**Commands:**
```bash
npm run lint
npm run build
```

**Expected:** Both pass with no errors.

---

## Commit Strategy

Single commit after all stories complete:

```bash
git add styles/globals.css components/Terminal/LensGrid.tsx
git commit -m "fix(lens-grid): add hover affordance and glass token styling"
```

## Definition of Done

- [ ] All build gates pass
- [ ] Manual testing checklist complete
- [ ] Single clean commit
- [ ] DEVLOG.md updated with completion notes
