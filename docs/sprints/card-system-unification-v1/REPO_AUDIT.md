# Repository Audit: Card System Unification

**Sprint:** card-system-unification-v1  
**Audit Date:** December 2024  
**Scope:** Card component implementations across Genesis and Foundation surfaces

---

## Executive Summary

Three separate card implementations exist for lens/journey presentation. None fully implements the Visual State Matrix documented in Sprint 3 planning. The `isInspected` prop and corresponding `ring-2 ring-primary` styling were specified but never added. Button styles deviate from the documented `bg-primary text-white` standard.

---

## Card Implementations Inventory

### 1. LensGrid (Genesis Surface)

**Location:** `components/Terminal/LensGrid.tsx` (364 lines)

**Current Behavior:**
- Full-width rows (single column)
- Click card body → **directly selects lens** (no inspector)
- No "Select" button visible
- No `isInspected` state (Genesis has no inspector)

**Styling:**
- Uses `embedded` prop for `--chat-*` token usage
- Border states: selected uses `${colors.bgLight} ${colors.border} border-2`
- No ring styling for any state

**Props:**
```typescript
interface LensGridProps {
  personas: Persona[];
  customLenses?: CustomLens[];
  currentLens?: string | null;
  highlightedLens?: string | null;  // URL share feature
  onSelect: (personaId: string | null) => void;
  // ... others
  embedded?: boolean;
}
```

**Issues:**
- ❌ No `isInspected` prop (N/A for Genesis, but inconsistent with Foundation)
- ❌ Different interaction model (click = select vs click = inspect)
- ❌ Different layout (rows vs grid)
- ❌ No explicit Select button

---

### 2. LensPicker (Foundation Surface)

**Location:** `src/explore/LensPicker.tsx` (515 lines)

**Current Behavior:**
- 2-column grid
- Click card body → opens inspector (`onView`)
- Click "Select" button → activates lens (`onSelect`)
- Two modes: `full` (grid) and `compact` (single column list)

**Styling (LensCard sub-component, ~line 188):**
```typescript
// Current - MISSING isInspected
className={`
  group cursor-pointer flex flex-col p-5 rounded-xl border transition-all text-left relative
  ${isActive
    ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20'
    : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
  }
`}
```

**Button Styling (line ~230):**
```typescript
// Current - WRONG
className="px-4 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"

// Documented Spec - CORRECT
className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
```

**Props (LensCard):**
```typescript
interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  onSelect: () => void;
  onView: () => void;
  // MISSING: isInspected: boolean;
}
```

**Issues:**
- ❌ `isInspected` prop not implemented
- ❌ `ring-2 ring-primary` styling not implemented
- ❌ Button uses wrong colors (slate instead of primary)
- ❌ CustomLensCard has same issues (violet variant)

---

### 3. JourneyList (Foundation Surface)

**Location:** `src/explore/JourneyList.tsx` (300 lines)

**Current Behavior:**
- 2-column grid (same as LensPicker)
- Click card body → opens inspector (`onView`)
- Click "Start" button → starts journey (`onStart`)
- Button has correct `bg-primary text-white` styling ✅

**Styling (JourneyCard, ~line 73):**
```typescript
// Current - MISSING isInspected
className={`
  p-5 rounded-xl border transition-all cursor-pointer
  ${isActive
    ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20'
    : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
  }
`}
```

**Button Styling (correct):**
```typescript
className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
```

**Props (JourneyCard):**
```typescript
interface JourneyCardProps {
  journey: Journey;
  isActive: boolean;
  onStart: () => void;
  onView: () => void;
  // MISSING: isInspected: boolean;
}
```

**Issues:**
- ❌ `isInspected` prop not implemented
- ❌ `ring-2 ring-primary` styling not implemented
- ✅ Button styling is correct (good reference)

---

## Documented Visual State Matrix (Sprint 3)

This was specified but never implemented:

| State | Condition | Visual Treatment |
|-------|-----------|------------------|
| Default | Not active, not inspected | `border-border-light hover:border-primary/30` |
| **Inspected** | Inspector showing this card | `ring-2 ring-primary border-primary` |
| Active | Currently applied lens/journey | `border-primary/30 bg-primary/5 ring-1 ring-primary/20` + badge |
| Both | Active AND inspected | Inspected takes precedence + badge |

**Gap:** The "Inspected" state exists only in documentation, not in code.

---

## Files Requiring Changes

| File | Changes Needed | Lines |
|------|----------------|-------|
| `src/explore/LensPicker.tsx` | Add isInspected, fix button | ~40 |
| `src/explore/JourneyList.tsx` | Add isInspected | ~30 |
| `src/app/globals.css` | Add `--card-*` tokens | ~20 |
| `components/Terminal/LensGrid.tsx` | None (different context) | 0 |

**Note:** LensGrid (Genesis) intentionally has a different interaction model. Genesis has no inspector, so the click-to-select behavior is correct there. However, we should ensure visual language (colors, spacing) aligns where possible.

---

## State Derivation Pattern (from Sprint 3 planning)

```typescript
// In LensPicker.tsx
const inspectedLensId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode.type === 'lens'
) ? workspaceUI.inspector.mode.lensId : null;

// Pass to card
<LensCard
  isInspected={inspectedLensId === persona.id}
  // ...
/>
```

This pattern exists in the Sprint 3 EXECUTION_PROMPT but was never added to the actual components.

---

## Existing Patterns to Extend

### Pattern 4: Token Namespaces

Current tokens:
- `--chat-*` → Terminal/chat column
- `--grove-*` → Workspace shell

**Proposal:** Add `--card-*` namespace for card-specific styling:
```css
:root {
  /* Card tokens */
  --card-border-default: var(--grove-border);
  --card-border-inspected: var(--grove-primary);
  --card-ring-inspected: 2px;
  --card-bg-active: rgba(var(--grove-primary-rgb), 0.05);
  --card-border-active: rgba(var(--grove-primary-rgb), 0.3);
}
```

This enables declarative styling changes without touching component code.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing lens selection | Low | High | Visual regression tests |
| Genesis/Foundation divergence grows | Medium | Medium | Document intentional differences |
| Token proliferation | Low | Low | Limit to `--card-*` namespace |

---

## Audit Conclusion

**Root Cause:** Sprint 3 planned the Visual State Matrix but execution stopped before implementation. The spec was correct; the code didn't follow it.

**Path Forward:** Implement what was already specified. Add the `isInspected` prop, wire the state derivation, apply the ring styling, and fix button colors. This is completion work, not new design.

---

*Audited by: Claude (Desktop)*  
*Sprint: card-system-unification-v1*
