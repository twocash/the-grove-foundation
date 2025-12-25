# SPEC: Quantum Glass v1

**Sprint:** quantum-glass-v1  
**Status:** Planning  
**Author:** Claude (Foundation Loop)  
**Date:** 2025-12-25

---

## Phase 0: Pattern Check ✅

### Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Glass visual treatment | Pattern 4: Token Namespaces | Add `--glass-*` token namespace |
| Card visual states | Pattern 7: Object Model | Extend CardShell with glass classes |
| Shared UI components | Pattern 6: Component Composition | Add to `src/shared/ui/` |
| Dark theme | Foundation tokens | Leverage `--color-obsidian-*` + extend |

### New Patterns Proposed

**None.** All requirements met by extending existing patterns.

### Warning Signs Checked

- [ ] Creating new React Context/Provider → **Not needed**
- [ ] Creating new JSON config file → **Not needed**
- [ ] Writing `if (type === 'foo')` conditionals → **Not doing**
- [ ] Creating parallel infrastructure → **Extending existing**

**Pattern Check: PASSED** ✅

---

## Problem Statement

The /terminal interface (workspace with lenses, journeys, nodes) is **functional but visually flat**. DESIGN_SYSTEM.md describes a "Quantum Glass" aesthetic that was documented but never implemented. Users see:

- Flat dark gray backgrounds (should be deep void with grid)
- Cards with thin borders (should be glass panels with blur)
- No hover animations (should lift and glow)
- Indistinguishable states (should have clear visual hierarchy)
- Plain JSON dump in inspector (should feel like mission control)

**Goal:** Transform the visual experience from "prototype" to "product" without changing functionality.

---

## Requirements

### REQ-1: Quantum Glass Token Foundation
**Priority:** P0 (Blocking)

Add complete token set to `globals.css`:

```css
/* Backgrounds */
--glass-void: #030712;
--glass-panel: rgba(17, 24, 39, 0.6);
--glass-solid: #111827;
--glass-elevated: rgba(30, 41, 59, 0.4);

/* Borders */
--glass-border: #1e293b;
--glass-border-hover: #334155;
--glass-border-active: rgba(16, 185, 129, 0.5);
--glass-border-selected: rgba(6, 182, 212, 0.5);

/* Neon accents */
--neon-green: #10b981;
--neon-cyan: #06b6d4;
--neon-amber: #f59e0b;
--neon-violet: #8b5cf6;

/* Text */
--glass-text-primary: #ffffff;
--glass-text-secondary: #e2e8f0;
--glass-text-body: #cbd5e1;
--glass-text-muted: #94a3b8;
--glass-text-subtle: #64748b;

/* Glows */
--glow-green: 0 0 20px -5px rgba(16, 185, 129, 0.4);
--glow-cyan: 0 0 20px -5px rgba(6, 182, 212, 0.4);
--glow-ambient: 0 8px 32px rgba(0, 0, 0, 0.4);

/* Motion */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--duration-fast: 150ms;
--duration-normal: 300ms;
```

**Acceptance:** Build passes, tokens available in CSS.

---

### REQ-2: Glass Utility Classes
**Priority:** P0 (Blocking)

Add utility classes for composition:

```css
.glass-panel { ... }           /* backdrop-filter blur panel */
.glass-panel-solid { ... }     /* solid dark panel (no blur) */
.glass-card { ... }            /* interactive card base */
.glass-card:hover { ... }      /* hover lift + glow */
.glass-card[data-selected] { ... }
.glass-card[data-active] { ... }
.hover-lift { ... }            /* reusable hover animation */
```

**Acceptance:** Classes work when applied to any element.

---

### REQ-3: Void Background with Grid
**Priority:** P1

Transform workspace background:

- Deep void color (#030712)
- Subtle grid overlay (48px cells, 0.3 opacity)
- Radial mask (fades toward edges)
- Optional ambient glow in center

**Target:** `GroveWorkspace.tsx` container class.

**Acceptance:** Background feels deep and atmospheric.

---

### REQ-4: Navigation Rail Styling
**Priority:** P1

Update `NavigationSidebar.tsx`:

- Glass solid background
- Section titles: monospace, uppercase, subtle color
- Nav items: proper hover/active states
- Active item: green border-left, tinted background
- Footer: matches glass aesthetic

**Acceptance:** Nav rail looks like part of mission control.

---

### REQ-5: CardShell Glass Treatment
**Priority:** P0 (Core)

Transform `CardShell.tsx`:

- Glass panel background with blur
- Corner accents (::before, ::after pseudo-elements)
- Four visual states:
  - Default: glass border
  - Hover: border lightens, 2px lift, ambient shadow
  - Selected: cyan ring + glow
  - Active: green border + gradient background
- States compose (Active + Selected shows both)

**Acceptance:** Cards look premium, states are instantly distinguishable.

---

### REQ-6: StatusBadge Component
**Priority:** P1

Create `src/shared/ui/StatusBadge.tsx`:

- Monospace font (JetBrains Mono)
- 10px uppercase with letter-spacing
- Variants: active (green pulse), draft (gray), system (cyan)
- Pulsing indicator dot for active state

**Acceptance:** Badge component renders correctly in cards.

---

### REQ-7: Inspector Panel Glass Treatment
**Priority:** P1

Update `InspectorPanel.tsx` and `ObjectInspector.tsx`:

- Glass solid background
- Header with dark overlay
- Section headers: monospace, uppercase, subtle
- Collapsible sections with styled borders
- Action buttons with glow on hover
- JSON syntax highlighting enhanced

**Acceptance:** Inspector feels like mission control, not debug panel.

---

### REQ-8: Collection Views Updated
**Priority:** P1

Apply glass card styling to:

- `LensPicker.tsx` — lens cards use glass treatment
- `JourneyList.tsx` — journey cards use glass treatment  
- `NodeGrid.tsx` — node cards use glass treatment

Each must show:
- Active badge when applicable
- Proper hover/selected/active states
- Consistent spacing and grid layout

**Acceptance:** All three views use identical visual patterns.

---

### REQ-9: Animation Polish
**Priority:** P2

Add entrance and interaction animations:

- Cards fade-up on mount
- Inspector slides-in from right
- Hover transitions smooth (300ms ease-out-expo)
- State changes animate (150ms fast)

**Acceptance:** Interface feels alive without being distracting.

---

## Out of Scope

- Left nav restructuring (IA changes)
- New object types (Sprouts, Fields)
- Chat/terminal dark theme (separate sprint)
- Marketing site changes
- Mobile responsive adjustments
- Accessibility audit (follow-up sprint)

---

## Success Criteria

| Criterion | Measure |
|-----------|---------|
| Visual transformation | Before/after screenshot comparison |
| State clarity | Can identify Active/Selected/Default in <1s |
| Consistency | All three views (Lens/Journey/Node) identical pattern |
| Performance | No perceptible lag on hover/transition |
| Build health | All tests pass, no console errors |

---

## Estimated Effort

| Component | Lines | Complexity |
|-----------|-------|------------|
| globals.css tokens + utilities | ~200 | Low |
| StatusBadge.tsx | ~80 | Low |
| GlassPanel.tsx (optional) | ~40 | Low |
| CardShell.tsx | ~60 changes | Medium |
| NavigationSidebar.tsx | ~50 changes | Medium |
| InspectorPanel.tsx | ~40 changes | Low |
| ObjectInspector.tsx | ~30 changes | Low |
| LensPicker/JourneyList/NodeGrid | ~100 total | Medium |
| **Total** | **~600 lines** | **Medium** |

---

## Dependencies

- JetBrains Mono font (already loaded)
- Modern browser with `backdrop-filter` support
- Existing token infrastructure in globals.css

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Blur performance on older devices | Low | Medium | Provide fallback without blur |
| Breaking existing dark mode | Medium | High | Test each phase visually |
| Scope creep into new features | Medium | Medium | Strict scope enforcement |

---

*Spec complete. Ready for ARCHITECTURE.md.*
