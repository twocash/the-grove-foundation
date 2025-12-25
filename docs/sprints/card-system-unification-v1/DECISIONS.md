# Decisions: Card System Unification

**Sprint:** card-system-unification-v1  
**Format:** Architecture Decision Records (ADRs)

---

## ADR-001: Token-Based Styling Over Component Extraction

**Status:** Accepted

### Context

Card components (LensCard, JourneyCard) have inconsistent styling. Two approaches could address this:

1. **Extract shared GroveCard component** — New component with card state logic
2. **Add token namespace** — CSS custom properties consumed by existing components

### Decision

Use token namespace approach.

### Rationale

1. **Less risk** — Existing components work; we're adding props, not rewriting
2. **DEX compliant** — Tokens are editable by non-engineers
3. **Faster** — 4 hours vs. potential refactor spiral
4. **Precedent** — Pattern 4 (Token Namespaces) already established

### Consequences

- Card components remain separate (LensCard, JourneyCard)
- Future unification to GroveCard possible but not required
- Styling changes require only globals.css edits

### Alternatives Considered

**GroveCard extraction:**
- Pro: Single component, shared logic
- Con: Migration risk, testing burden, time
- Con: Violates "surgical fix" principle

---

## ADR-002: isInspected Derived from WorkspaceUI

**Status:** Accepted

### Context

Cards need to know if they're being "inspected" (shown in inspector panel). Two sources:

1. **Derive from WorkspaceUI.inspector** — Existing state
2. **Add to Engagement Machine** — New inspectedId state

### Decision

Derive from WorkspaceUI context.

### Rationale

1. **WorkspaceUI already has this state** — `inspector.mode.lensId` exists
2. **No machine changes needed** — Reduces scope
3. **UI concern** — "Which card is highlighted" is rendering logic, not engagement state

### Consequences

- No Engagement Machine changes
- Derivation logic in LensPicker and JourneyList
- Inspector state remains the source of truth

### Code Pattern

```typescript
const inspectedLensId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode?.type === 'lens'
) ? workspaceUI.inspector.mode.lensId : null;
```

---

## ADR-003: Genesis LensGrid Unchanged

**Status:** Accepted

### Context

Genesis surface (LensGrid) has different interaction model:
- Click card → **selects lens immediately** (no inspector)
- No inspector panel exists in Genesis

Should we unify Genesis with Foundation's click-to-inspect model?

### Decision

Leave Genesis unchanged.

### Rationale

1. **Intentional UX difference** — Genesis is first-time onboarding; fewer steps is better
2. **No inspector in Genesis** — Would require adding inspector infrastructure
3. **Scope creep** — Unifying interaction models is a separate initiative
4. **Working correctly** — Genesis lens selection isn't broken

### Consequences

- LensGrid (Genesis) and LensPicker (Foundation) remain different
- This is documented as intentional, not technical debt
- Future sprint could unify if UX research supports it

---

## ADR-004: Button Style Standardization

**Status:** Accepted

### Context

Sprint 3 documented button styles but implementation diverged:

| Component | Documented | Actual |
|-----------|------------|--------|
| LensCard Select | `bg-primary text-white` | `bg-slate-100 text-slate-600` |
| CustomLensCard Select | `bg-violet-500 text-white` | `bg-violet-100 text-violet-600` |
| JourneyCard Start | `bg-primary text-white` | `bg-primary text-white` ✓ |

### Decision

Enforce documented styles.

### Rationale

1. **Consistency** — One button style language across Foundation
2. **Visibility** — Primary color is more prominent for CTAs
3. **Precedent** — JourneyCard already uses correct style
4. **Spec exists** — We're implementing the spec, not inventing

### Consequences

- LensCard and CustomLensCard buttons become more prominent
- Visual consistency with JourneyCard

---

## ADR-005: Foundation Nav Labels via LensReality

**Status:** Accepted

### Context

Foundation sidebar shows section labels ("Lenses", "Journeys", "Nodes"). Per Quantum Interface pattern, these should be lens-reactive.

Options:
1. **Hardcode defaults** — `"Lenses"` everywhere
2. **Add to LensReality** — `reality.foundation.sectionLabels`
3. **New config file** — `foundation-config.json`

### Decision

Extend LensReality with `foundation.sectionLabels` field.

### Rationale

1. **Pattern compliance** — Quantum Interface (Pattern 1) handles persona-reactive content
2. **No new files** — Extend existing SUPERPOSITION_MAP
3. **Optional with defaults** — Works without config; improves with it

### Consequences

- LensReality type gains `foundation?: { sectionLabels?: {...} }`
- Personas can optionally customize nav labels
- Default labels used when field is undefined

### Example

```typescript
// In SUPERPOSITION_MAP
'concerned-citizen': {
  foundation: {
    sectionLabels: {
      lenses: 'Perspectives',  // Instead of "Lenses"
      journeys: 'Learning Paths'
    }
  }
}
```

---

## ADR-006: Dark Mode Token Overrides

**Status:** Accepted

### Context

Card tokens need dark mode variants. Options:

1. **Single tokens with fallbacks** — `var(--card-border, theme('colors.slate.200'))`
2. **Explicit dark mode overrides** — `:root` + `.dark` selectors
3. **Tailwind dark: variants** — Keep inline `dark:border-slate-700`

### Decision

Use explicit dark mode overrides in globals.css.

### Rationale

1. **Centralized** — All card styling in one place
2. **Consistent with existing pattern** — Other token namespaces use this approach
3. **Predictable** — Designer can see all variants in one file

### Implementation

```css
:root {
  --card-border-default: theme('colors.slate.200');
}

.dark {
  --card-border-default: theme('colors.slate.700');
}
```

### Consequences

- Components don't need `dark:` prefixes for token-based styles
- globals.css grows slightly
- Theme switching works automatically

---

## Decision Summary

| ADR | Decision | Key Rationale |
|-----|----------|---------------|
| 001 | Tokens over extraction | Lower risk, DEX compliant |
| 002 | Derive from WorkspaceUI | State already exists |
| 003 | Genesis unchanged | Intentional UX difference |
| 004 | Button standardization | Implement the documented spec |
| 005 | LensReality nav labels | Quantum Interface pattern |
| 006 | Dark mode overrides | Centralized in globals.css |

---

*All decisions align with DEX principles and existing patterns.*
