# Grove UI/UX Unification Roadmap

**Created:** 2024-12-24
**Last Updated:** 2024-12-24
**Owner:** Jim Calhoun

---

## Executive Summary

This roadmap documents the complete path from current state (fragmented styling, technical debt) to unified UI across Terminal and Foundation surfaces. It captures extensive analysis and planning performed during the 2024-12-24 strategic session.

**Total Scope:** ~8 sprints over ~4-6 weeks
**Current Status:** Sprint 1 COMPLETE (PR #34), Sprint 2 planning

---

## Strategic Context

### The Problem

The Grove has three distinct UI surfaces with inconsistent styling approaches:

| Surface | Current State | Issues |
|---------|---------------|--------|
| **Terminal (Genesis)** | Hardcoded hex colors | Not tokenized, can't theme |
| **Terminal (Workspace)** | 100+ line CSS hack | Unmaintainable, !important hell |
| **Foundation Consoles** | `--theme-*` tokens (Sprint 1-6 complete) | Isolated from Terminal |
| **Workspace Shell** | `--grove-*` tokens | Partially complete |

### The Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UNIFIED TOKEN ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Surface          Token Namespace    Aesthetic                              │
│   ─────────────────────────────────────────────────                          │
│   Workspace Shell  --grove-*          Cool slate, professional               │
│   Chat Column      --chat-*           Warm forest, organic                   │
│   Foundation       --theme-*          Dark holodeck, technical               │
│                                                                              │
│   Each surface has clear ownership and can evolve independently              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sprint Overview

| Sprint | Name | Focus | Est. Days | Status |
|--------|------|-------|-----------|--------|
| **1** | Chat Column Unification v1 | Terminal tokens, responsive | 4-5 | ✅ Complete (PR #34) |
| **2** | ~~Terminal Polish~~ | ~~Overlay mode, transitions~~ | — | ⏭️ Skipped (not in user flow) |
| **3** | Workspace Inspectors v1 | IA v0.15, inspector refactor | 2.5h | ✅ Complete (PR #35) |
| **4** | Foundation Theme Integration | Connect --theme-* properly | 2-3 | 📋 Planned |
| **5** | Cross-Surface Consistency | Shared components, patterns | 2-3 | 📋 Planned |
| **6** | Responsive Excellence | All breakpoints, mobile | 3-4 | 📋 Planned |
| **7** | Animation & Micro-interactions | Polish, delight | 2-3 | 📋 Planned |
| **8** | Documentation & Handoff | Design system docs | 2 | 📋 Planned |

**Total:** ~24-30 days (~5-6 weeks)

---

## Sprint 1: Chat Column Unification v1 ✅ COMPLETE

### Objective
Create unified `--chat-*` token system for Terminal embedded mode, fix responsive behavior, delete ExploreChat CSS hack.

### Results (PR #34)
- 25 CSS tokens defined in globals.css
- Terminal.tsx embedded branch migrated to tokens
- TerminalHeader, CommandInput, Autocomplete migrated
- WelcomeInterstitial, LensGrid migrated
- ExploreChat.tsx reduced from 159 → 38 lines (-121 lines)
- Bundle size: GroveWorkspace 68KB → 64KB (-6%)
- Genesis baseline tests: 3/3 passing

### Key Deliverables
- 30+ CSS tokens defined (`--chat-bg`, `--chat-surface`, `--chat-accent`, etc.)
- Terminal.tsx embedded branch migrated to tokens
- All Terminal child components migrated
- Container query responsive system
- ExploreChat.tsx reduced from 159 lines to ~30 lines
- Genesis baseline tests passing

### Files
- `docs/sprints/chat-column-unification-v1/` — Full Foundation Loop

### Acceptance Criteria
- [x] Genesis split panel visually unchanged
- [x] Workspace chat matches Genesis aesthetic
- [x] Responsive behavior at 360/480/640px breakpoints
- [x] All header functionality preserved (lens, journey, streak)

### Technical Decisions (ADRs)
1. Separate `--chat-*` namespace (not extending `--grove-*`)
2. Container queries for responsive (not media queries)
3. Preserve overlay mode unchanged
4. Token values exactly match current hardcoded values

---

## Sprint 2: Terminal Polish ⏭️ SKIPPED

### Decision
Skipped 2024-12-24. Overlay mode, TerminalShell transitions, and pill/minimize behaviors are not in the active user flow. The primary user journey (Genesis → embedded Terminal → chat) is fully addressed by Sprint 1.

**Rationale:** Focus resources on inspector functionality (Sprint 3) rather than polish for unused code paths. Can revisit if overlay mode becomes relevant.

---

## Sprint 3: Workspace Inspectors v1 ✅ COMPLETE

### Summary
Completed 2024-12-24. IA v0.15 implemented with full navigation restructure.

**PR #35:** https://github.com/twocash/the-grove-foundation/pull/35

### Delivered
- **IA v0.15** — Terminal, Lenses, Journeys, Nodes, Diary, Sprouts under Grove Project
- **DiaryList.tsx** — Placeholder content view (20 lines)
- **DiaryInspector.tsx** — Placeholder inspector (56 lines)
- **LensInspector refactor** — 294 → 154 lines (-140 lines, uses shared components)
- **Type updates** — diary in InspectorMode, EntityType, ViewId
- **Cultivate simplified** — Commons only

### Metrics
| Metric | Value |
|--------|-------|
| Files changed | 7 |
| Lines added | ~130 |
| Lines removed | ~145 |
| Net | -15 lines |
| Time | ~2.5 hours |

---

---

## Sprint 4: Foundation Theme Integration

### Objective
Connect Foundation console `--theme-*` tokens with overall system.

### Context
Foundation work (Sprints 1-6 in separate initiative) added:
- DEX schema types
- DEXRegistry
- Console components with `--theme-*` tokens

This sprint ensures Foundation integrates cleanly.

### Scope
- **Verify isolation** — Foundation doesn't break Terminal
- **Shared patterns** — Ensure consistent naming conventions
- **Console loading** — Standardize loading states
- **Dark mode consistency** — All surfaces work together

### Key Files (Foundation)
- `src/foundation/consoles/*`
- `src/foundation/inspectors/*`
- `src/core/schema/*`

### Dependencies
- Sprint 1-3 complete
- Foundation Sprints 1-6 merged to main

---

## Sprint 5: Cross-Surface Consistency

### Objective
Ensure shared components work correctly across all surfaces.

### Scope
- **Buttons** — Unified button component with surface variants
- **Inputs** — Form controls that adapt to context
- **Cards** — Card patterns for all surfaces
- **Typography** — Consistent type scale
- **Icons** — Icon usage and sizing

### Deliverables
- Shared component library (or patterns)
- Usage documentation
- Storybook stories (if using)

### Dependencies
- Sprint 1-4 complete

---

## Sprint 6: Responsive Excellence

### Objective
All surfaces work beautifully at all breakpoints.

### Scope
- **Mobile Terminal** — Full mobile experience
- **Tablet layouts** — Optimal use of space
- **Large screens** — Comfortable reading, no awkward gaps
- **Touch interactions** — Tap targets, gestures
- **Keyboard navigation** — Accessibility

### Breakpoint Strategy
```
Mobile:     320-479px   (touch-first, stacked)
Tablet:     480-767px   (hybrid, flexible)
Desktop:    768-1279px  (standard three-column)
Wide:       1280px+     (comfortable, max-width containers)
```

### Dependencies
- Sprint 1-5 complete

---

## Sprint 7: Animation & Micro-interactions

### Objective
Add polish and delight through thoughtful motion.

### Scope
- **Page transitions** — Route change animations
- **Component transitions** — Appear/disappear, state changes
- **Loading indicators** — Engaging, not annoying
- **Hover/focus states** — Consistent feedback
- **Success/error feedback** — Clear outcomes

### Animation Principles
1. **Purposeful** — Animation serves function, not decoration
2. **Fast** — 150-300ms for most interactions
3. **Consistent** — Same easing curves throughout
4. **Reducible** — Respects `prefers-reduced-motion`

### Dependencies
- Sprint 1-6 complete

---

## Sprint 8: Documentation & Handoff

### Objective
Document the design system for ongoing maintenance.

### Deliverables
- **Token reference** — All tokens with usage examples
- **Component catalog** — Patterns and when to use them
- **Responsive guidelines** — Breakpoint behavior
- **Contribution guide** — How to add new tokens/components
- **Migration notes** — What changed and why

### Format
- Markdown documentation in `/docs/design-system/`
- Inline code comments
- README updates

### Dependencies
- Sprint 1-7 complete

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Genesis visual regression | Low | High | Baseline tests after each phase |
| Foundation breaks Terminal | Low | High | Verified isolation (see analysis) |
| Scope creep | Medium | Medium | Strict sprint boundaries |
| Responsive bugs | Medium | Medium | Test at all breakpoints |
| Token name conflicts | Low | Low | Isolated namespaces |
| Animation performance | Low | Medium | Measure FPS, test on low-end |

---

## Architecture Decisions (Cross-Sprint)

### Token Namespacing

```css
/* Three isolated namespaces */
--grove-*    /* Workspace shell */
--chat-*     /* Chat column / Terminal embedded */
--theme-*    /* Foundation consoles */
```

**Rationale:** Each surface has distinct aesthetic needs. Forcing shared tokens would either compromise design or create complex conditionals.

### Responsive Strategy

**Container queries** for component-level responsiveness (chat, cards)
**Media queries** for layout-level changes (column visibility, stacking)

**Rationale:** Components should respond to their container, not viewport. This allows the same component to work in different contexts (Genesis split, Workspace panel, etc.).

### CSS Architecture

```
styles/
├── globals.css          # Token definitions, base styles
├── components/          # Component-specific CSS (if needed)
└── utilities/           # Tailwind extensions

components/
├── Terminal/            # Terminal-specific styles via className
├── workspace/           # Workspace-specific
└── foundation/          # Foundation-specific
```

**Rationale:** Tokens in globals.css, component styles via Tailwind classes in components. Minimal CSS files.

---

## Dependencies Map

```
Sprint 1 ─────┬─────────────────────────────────────────────┐
              │                                             │
Sprint 2 ─────┤                                             │
              │                                             │
Sprint 3 ─────┴─────────┬───────────────────────────────────┤
                        │                                   │
Sprint 4 ───────────────┤                                   │
                        │                                   │
Sprint 5 ───────────────┴───────────────┬───────────────────┤
                                        │                   │
Sprint 6 ───────────────────────────────┤                   │
                                        │                   │
Sprint 7 ───────────────────────────────┴───────────────────┤
                                                            │
Sprint 8 ───────────────────────────────────────────────────┘
```

---

## Prior Analysis Preserved

### Terminal/Foundation Isolation Verification

**Date:** 2024-12-24
**Finding:** Routes are architecturally isolated

```
src/core/ (shared)
├── schema/ - DEX types (Foundation only)
├── engagement/ - XState machine (both use, Terminal primary)
├── registry/ - DEXRegistry (Foundation only)
└── engine/ - RAG, entropy, routing (both use)

/terminal (GroveWorkspace)          /foundation (FoundationWorkspace)
├── src/workspace/                  ├── src/foundation/consoles/
├── src/explore/                    ├── src/foundation/inspectors/
├── components/Terminal/            └── src/foundation/hooks/
└── NO CROSS-IMPORTS ───────────────────────────────────────────┘
```

**Risk:** Direct imports = None, Shared schema = Low, Theme = None

### Genesis Page Integration

**Discovery:** Terminal has `variant` prop controlling render mode:
- `variant="embedded"` — Dark mode, used by Genesis split and Workspace
- `variant="overlay"` — Paper/ink, used by mobile bottom sheet

**Two different dark palettes found:**

| Element | Genesis (embedded) | Workspace ExploreChat |
|---------|-------------------|----------------------|
| Background | `#1a2421` (forest) | `#0f172a` (slate) |
| Surface | `#243029` (warm) | `#1e293b` (cool) |
| Accent | `#00D4AA` (teal) | `#4d7c0f` (green) |

**Decision:** Unify on Genesis palette (Option C from analysis), creating `--chat-*` tokens.

### ExploreChat CSS Hack

**Location:** `src/explore/ExploreChat.tsx` lines 27-150
**Content:** 100+ lines of `!important` overrides forcing Terminal dark mode
**Solution:** Delete entirely after Token migration

### Color Audit Summary

**Background tokens needed:**
- `--chat-bg: #1a2421`
- `--chat-surface: #243029`
- `--chat-surface-hover: #2d3b32`

**Accent tokens needed:**
- `--chat-accent: #00D4AA`
- `--chat-accent-hover: #00E4BA`
- `--chat-accent-muted: rgba(0, 212, 170, 0.15)`

**Text tokens needed:**
- `--chat-text: rgba(255, 255, 255, 0.9)`
- `--chat-text-muted: rgba(255, 255, 255, 0.6)`
- `--chat-text-dim: rgba(255, 255, 255, 0.4)`

---

## References

### Sprint 1 Artifacts
- `docs/sprints/chat-column-unification-v1/REPO_AUDIT.md`
- `docs/sprints/chat-column-unification-v1/SPEC.md`
- `docs/sprints/chat-column-unification-v1/ARCHITECTURE.md`
- `docs/sprints/chat-column-unification-v1/MIGRATION_MAP.md`
- `docs/sprints/chat-column-unification-v1/DECISIONS.md`
- `docs/sprints/chat-column-unification-v1/STORIES.md`
- `docs/sprints/chat-column-unification-v1/EXECUTION_PROMPT.md`
- `docs/sprints/chat-column-unification-v1/DEV_LOG.md`

### Key Source Files
- `components/Terminal.tsx` (1,445 lines)
- `components/Terminal/TerminalHeader.tsx`
- `components/Terminal/CommandInput/*`
- `src/explore/ExploreChat.tsx` (159 lines, CSS hack)
- `src/surface/pages/GenesisPage.tsx` (416 lines)
- `styles/globals.css` (674 lines)

### Tests
- `tests/e2e/genesis-baseline.spec.ts` (visual regression)
- `tests/e2e/genesis-baseline.spec.ts-snapshots/` (baseline images)

---

## Changelog

| Date | Change |
|------|--------|
| 2024-12-24 | Initial roadmap created from strategic session |
| | Sprint 1 Foundation Loop completed |
| | Prior analysis documented |
| 2024-12-24 | Sprint 1 executed via Claude Code CLI |
| | PR #34 created: 7 commits, 25 tokens, -121 lines |
| | Genesis baseline tests passing |
