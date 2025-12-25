# DECISIONS: Quantum Glass v1

**Sprint:** quantum-glass-v1  
**Date:** 2025-12-25

---

## ADR-001: CSS-First vs. Component-First Approach

### Context
We need to implement the Quantum Glass aesthetic. Options:
1. Create React component wrappers (GlassPanel, GlassCard) that encapsulate styling
2. Use CSS utility classes applied directly to existing components

### Decision
**CSS-First approach with utility classes.**

### Rationale
- **Smaller change surface:** Modifying className strings vs. refactoring component trees
- **Immediate feedback:** Can see changes instantly with DevTools
- **Composition friendly:** Classes compose; components require prop threading
- **Pattern 6 compliant:** We're extending styling, not creating new components

### Consequences
- Developers must know to use `.glass-card` etc.
- Slightly more verbose JSX (multiple classes)
- Easy to accidentally not apply classes

### Status
**Accepted**

---

## ADR-002: Data Attributes for State vs. Conditional Classes

### Context
CardShell needs to show four visual states. Options:
1. Conditional class names: `${isActive ? 'glass-card-active' : ''}`
2. Data attributes: `data-active={isActive}` with CSS `[data-active="true"]`

### Decision
**Data attributes with CSS attribute selectors.**

### Rationale
- **Cleaner JSX:** Single `glass-card` class, state via attributes
- **CSS-driven styling:** All visual logic in one place (globals.css)
- **Composition:** `[data-active="true"][data-selected="true"]` handles compound states naturally
- **DevTools friendly:** Can toggle attributes to test states

### Consequences
- CSS file has more complex selectors
- Attribute selectors slightly slower than class selectors (negligible)
- Requires `data-*` naming discipline

### Status
**Accepted**

---

## ADR-003: Corner Accents Implementation

### Context
Design calls for decorative corner accents on cards. Options:
1. SVG corner elements as React components
2. CSS pseudo-elements (::before, ::after)
3. Border-image CSS property
4. Skip corner accents (simplify)

### Decision
**CSS pseudo-elements (::before, ::after).**

### Rationale
- **No new components:** Pure CSS, no React overhead
- **Transition-friendly:** Can animate border-color on hover
- **Two corners sufficient:** Top-left and bottom-right create visual balance
- **Consistent with glass-card:** Applied via same class

### Consequences
- Limited to two corners (pseudo-element limit)
- Cannot have background inside corner accent
- Position: relative required on parent

### Status
**Accepted**

---

## ADR-004: Token Namespace (`--glass-*` vs. extending `--card-*`)

### Context
Existing `--card-*` tokens are light-mode defaults. Options:
1. Modify existing `--card-*` tokens to be dark-mode
2. Add new `--glass-*` namespace, deprecate `--card-*`
3. Keep both namespaces, use `--glass-*` for new components

### Decision
**Add new `--glass-*` namespace, migrate gradually.**

### Rationale
- **Non-breaking:** Existing light-mode code continues to work
- **Clear intent:** `--glass-*` means Quantum Glass system
- **Gradual migration:** Can deprecate `--card-*` in future sprint
- **Pattern 4 compliant:** New namespace extends token system

### Consequences
- Two sets of tokens temporarily
- Need to document which namespace to use
- Future cleanup sprint needed

### Status
**Accepted**

---

## ADR-005: backdrop-filter Fallback Strategy

### Context
`backdrop-filter: blur()` not supported in older browsers. Options:
1. Require modern browsers, no fallback
2. Feature detection with solid color fallback
3. Use JavaScript blur (heavy)
4. Skip blur entirely, use solid colors

### Decision
**Feature detection with `@supports`, fallback to solid color.**

### Rationale
- **Progressive enhancement:** Modern browsers get blur, others get solid
- **No JS required:** Pure CSS feature detection
- **Still looks good:** Solid dark color is acceptable fallback
- **Performance safe:** No runtime feature detection

### Implementation
```css
.glass-panel {
  background: var(--glass-solid); /* Fallback */
}

@supports (backdrop-filter: blur(12px)) {
  .glass-panel {
    background: var(--glass-panel);
    backdrop-filter: blur(12px);
  }
}
```

### Status
**Accepted**

---

## ADR-006: Animation Timing Tokens

### Context
Animations need consistent timing. Options:
1. Hardcode values in each animation
2. CSS custom properties for timing
3. Tailwind animation utilities

### Decision
**CSS custom properties for timing.**

### Rationale
- **Single source of truth:** Change timing globally
- **Semantic names:** `--duration-fast` vs `150ms`
- **Composition:** Can combine duration + easing tokens
- **Pattern 4 compliant:** Tokens for everything

### Tokens
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--duration-fast: 150ms;
--duration-normal: 300ms;
```

### Status
**Accepted**

---

## ADR-007: StatusBadge as Component vs. CSS-Only

### Context
Need status indicators with pulse animation. Options:
1. Pure CSS using ::before pseudo-element for dot
2. React component with explicit elements
3. Web component (overkill)

### Decision
**Minimal React component wrapping CSS classes.**

### Rationale
- **Best of both:** React handles variants, CSS handles styling
- **Type safety:** TypeScript variant prop
- **Reusable:** Import and use anywhere
- **Pulse via CSS:** Animation stays in globals.css

### Implementation
```tsx
<StatusBadge variant="active" />
// Renders: <span class="status-badge status-badge-active">Active</span>
```

### Status
**Accepted**

---

## ADR-008: Grid Overlay Implementation

### Context
Design calls for subtle grid on void background. Options:
1. SVG pattern as background-image
2. CSS linear-gradient grid
3. Canvas-rendered grid
4. Skip grid (simpler)

### Decision
**CSS linear-gradient with mask-image fade.**

### Rationale
- **Pure CSS:** No external assets or JS
- **Performance:** GPU-composited gradients
- **Controllable:** Easy to adjust size, opacity, color
- **Mask fade:** Creates organic edge falloff

### Implementation
```css
.glass-viewport::before {
  background-image: 
    linear-gradient(rgba(30, 41, 59, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 41, 59, 0.3) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
}
```

### Status
**Accepted**

---

## ADR-009: Scope Boundary — What's NOT Changing

### Context
Risk of scope creep into adjacent systems. Need explicit boundaries.

### Decision
**Strict scope enforcement:**

**IN SCOPE:**
- Visual styling (colors, borders, shadows, blur)
- Hover/transition animations
- State visual indicators
- Background treatment

**OUT OF SCOPE:**
- Left nav IA/structure
- New object types
- Chat/terminal interface
- Marketing site
- Mobile responsive
- Accessibility audit
- Performance optimization

### Rationale
- **Ship quality:** Better to do one thing well
- **Time box:** Prevents infinite polishing
- **Clear deliverable:** Can verify completion

### Status
**Accepted**

---

## ADR-010: Verification Strategy

### Context
How do we know when we're done?

### Decision
**Visual checkpoint per phase + final screenshot comparison.**

### Checkpoints
| Phase | Verification |
|-------|-------------|
| 1 | Tokens visible in DevTools |
| 2 | Void background renders |
| 3 | Nav active state green |
| 4 | Card hover lifts |
| 5 | Badge pulses |
| 6 | Inspector glass styled |
| 7 | Button hover glows |
| 8 | All views consistent |

### Final Test
Side-by-side screenshot: before vs. after. Should elicit "holy shit" response.

### Status
**Accepted**

---

*Decisions documented. Ready for SPRINTS.md.*
