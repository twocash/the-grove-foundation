# Architectural Decisions — v0.12d Welcome Experience

## Quick Reference

| ADR | Decision | Rationale |
|-----|----------|-----------|
| 001 | Two components (Welcome + Switcher) | Different jobs, different UIs |
| 002 | Shared LensGrid subcomponent | DRY, consistent rendering |
| 003 | Enable Create Your Own by default | Killer feature shouldn't be hidden |
| 004 | Keep same localStorage key | Minimize migration complexity |

---

## ADR-001: Two Separate Components vs. Mode Prop

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
Currently LensPicker serves both the first-open welcome experience and lens switching from the pill button. These are fundamentally different user moments with different jobs:

| Moment | Job to Be Done | Emotional State |
|--------|----------------|-----------------|
| First open | "What is this? Why should I care?" | Curious but skeptical |
| Switching | "I want a different perspective" | Already engaged |

**Options Considered:**

### Option A: Mode Prop on LensPicker
- **Description:** Add `mode: 'welcome' | 'switch'` prop to LensPicker
- **Pros:** Single component, less code duplication
- **Cons:** Component becomes complex with conditional rendering; harder to maintain; violates single responsibility

### Option B: Two Separate Components
- **Description:** Create WelcomeInterstitial for first open, refactor LensPicker for switching
- **Pros:** Each component has single purpose; easier to maintain; can evolve independently
- **Cons:** Some code duplication for lens rendering

### Option C: Wrapper Component
- **Description:** Create WelcomeExperience that wraps LensPicker with additional content
- **Pros:** Reuses LensPicker entirely
- **Cons:** Awkward composition; LensPicker still has welcome copy that needs hiding

**Decision:**
Option B — Two separate components with shared subcomponent for lens rendering.

**Consequences:**
- Create `WelcomeInterstitial.tsx` for first-open experience
- Refactor `LensPicker.tsx` to remove welcome copy
- Extract `LensGrid.tsx` for shared lens rendering (optional, can defer)
- Terminal.tsx manages which component to show based on state

---

## ADR-002: Shared LensGrid Subcomponent

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
Both WelcomeInterstitial and LensPicker need to render the same list of lenses with the same styling and behavior. Duplicating this code violates DRY and creates maintenance burden.

**Options Considered:**

### Option A: Full Duplication
- **Description:** Copy lens rendering code to both components
- **Pros:** Simple, fast to implement
- **Cons:** Maintenance nightmare; divergence over time

### Option B: Extract LensGrid Component
- **Description:** Create shared component that renders lens list
- **Pros:** DRY; single source of truth for lens UI
- **Cons:** Additional abstraction layer; needs careful prop design

### Option C: Render Props / Children Pattern
- **Description:** LensPicker accepts children for header/footer customization
- **Pros:** Flexible
- **Cons:** Overcomplicated for this use case

**Decision:**
Option B — Extract LensGrid component that both WelcomeInterstitial and LensPicker use.

**Consequences:**
- Create `components/Terminal/LensGrid.tsx`
- Props: `personas`, `customLenses`, `currentLens`, `onSelect`, `onCreateCustomLens`, `onDeleteCustomLens`, `showCreateOption`
- Both parent components provide their own header/footer
- Consistent lens rendering guaranteed

---

## ADR-003: Enable Create Your Own by Default

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
The `custom-lens-in-picker` feature flag is currently `false` by default, hiding the Create Your Own lens feature from all users. This is a differentiating feature that showcases Grove's personalization capabilities.

**Options Considered:**

### Option A: Keep Disabled
- **Description:** Leave flag as `false`, require manual enablement
- **Pros:** Conservative; controlled rollout
- **Cons:** Most users never see killer feature; reduces product differentiation

### Option B: Enable by Default
- **Description:** Change flag default to `true`
- **Pros:** All users see differentiation; feature gets real usage
- **Cons:** Slightly more complex first-open experience

### Option C: Show Only in Switcher
- **Description:** Show Create Your Own only when switching, not on welcome
- **Pros:** Simpler welcome experience
- **Cons:** Inconsistent; arbitrary distinction

**Decision:**
Option B — Enable by default in both WelcomeInterstitial and LensPicker.

**Consequences:**
- Change `src/core/config/defaults.ts:119` from `enabled: false` to `enabled: true`
- Create Your Own appears in both welcome and switching contexts
- Users immediately see personalization capability
- May want to consider visual hierarchy (standard lenses first, Create Your Own at end)

---

## ADR-004: localStorage Key Strategy

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
Need to track whether user has seen the welcome experience. Current implementation uses `grove-terminal-welcomed` key.

**Options Considered:**

### Option A: Keep Existing Key
- **Description:** Continue using `grove-terminal-welcomed`
- **Pros:** No migration needed; existing users maintain state
- **Cons:** Existing users who saw old welcome won't see new one

### Option B: New Key for v0.12d
- **Description:** Use `grove-terminal-welcomed-v2` or similar
- **Pros:** All users see new welcome experience
- **Cons:** Existing users get "re-welcomed"; may feel redundant

### Option C: Version-Aware Key
- **Description:** Store `{ version: '0.12d', welcomed: true }` as JSON
- **Pros:** Can selectively re-show for major updates
- **Cons:** Overengineered for current needs

**Decision:**
Option A — Keep existing `grove-terminal-welcomed` key.

**Consequences:**
- Existing users who completed old welcome flow won't see new one
- This is acceptable — they're already engaged users
- New users get full new welcome experience
- Simpler implementation, no migration logic needed
