# Architectural Decisions: lens-hover-fix-v1

## ADR-001: Hover State via React State vs CSS-only

### Context
Need to show Select button on hover. Two approaches:
1. Track `hoveredLens` in React state, conditionally render button
2. Use CSS `:hover` with `opacity-0 group-hover:opacity-100`

### Decision
**Use React state (`hoveredLens`).**

### Rationale
- Button needs different behavior on click (ghost → immediate select vs solid → confirm)
- State-based approach allows button to receive direct click without card click interference
- Consistent with existing `previewLens` pattern
- More testable

### Rejected Alternative
CSS-only approach would require nested event handlers and `pointer-events` gymnastics.

---

## ADR-002: Preserve Persona Colors for Active State Only

### Context
Current implementation uses persona colors (`PERSONA_COLORS`) for all card states. Should we:
1. Keep persona colors for all states
2. Use glass tokens for all states
3. Hybrid: glass for interaction, persona for identity

### Decision
**Hybrid approach: Glass tokens for Default/Hover/Preview, persona colors for Active only.**

### Rationale
- Active state represents "identity"—persona color is brand expression
- Interaction states (hover, preview) are system affordances—should use system tokens
- Reduces visual noise; persona color stands out when it matters
- Aligns with Pattern 4 (Token Namespaces)

### Rejected Alternative
All persona colors: Too much color noise, obscures interaction feedback.
All glass tokens: Loses persona brand identity for active lens.

---

## ADR-003: Ghost Button on Hover, Solid on Preview

### Context
How should the Select button appear in different states?

### Decision
**Ghost (outline) on hover, Solid (filled) on preview.**

### Rationale
- Ghost communicates "available action" without commanding attention
- Solid communicates "ready to commit"
- Progressive disclosure: hover = awareness, preview = intent
- Follows common UI pattern (hover → soft, focus → strong)

### Rejected Alternative
Same button style for both: Loses progressive feedback, feels less responsive.

---

## ADR-004: Click Ghost Button = Immediate Select

### Context
When user hovers and sees ghost button, what happens on click?

Options:
1. Ghost button click → immediate select (skip preview)
2. Ghost button click → enter preview state
3. Card click = preview, button click = select (different behaviors)

### Decision
**Ghost button click = immediate select.**

### Rationale
- User who clicks button has clear intent
- Faster for decisive users
- Card click still enters preview for exploratory users
- Button should always "do the thing"

### Rejected Alternative
Ghost click → preview: Extra step for clear intent, feels unresponsive.

---

## ADR-005: Create New Button Classes vs Extend .glass-card

### Context
Where should button styles live?

### Decision
**Create new `.glass-select-button` classes in globals.css.**

### Rationale
- Button is semantically different from card
- Reusable for other select actions (journeys, etc.)
- Clear naming convention
- Follows Pattern 4 (extend namespace, don't duplicate)

### Rejected Alternative
Inline styles on button: Not reusable, violates Pattern 4.
Add to .glass-card: Button isn't a card; wrong semantic grouping.

---

## ADR-006: Remove embedded Mode Styling Divergence

### Context
LensGrid has `embedded` prop that switches between `--chat-*` tokens and inline light/dark mode styles. Should we:
1. Keep divergent styling
2. Unify to glass tokens
3. Keep embedded for chat, glass for standalone

### Decision
**Unify to glass tokens for non-selected states, ignore `embedded` for card styling.**

### Rationale
- Glass tokens work in both Terminal context and standalone
- Reduces branching complexity
- Visual consistency across surfaces
- `embedded` prop can be deprecated or used only for specific overrides

### Rejected Alternative
Keep full divergence: Maintenance burden, inconsistent visuals.

---

## Summary

| Decision | Choice |
|----------|--------|
| Hover tracking | React state |
| Persona colors | Active state only |
| Button styles | Ghost → Solid progression |
| Ghost click | Immediate select |
| Style location | New `.glass-select-button` classes |
| Embedded mode | Unify to glass tokens |
