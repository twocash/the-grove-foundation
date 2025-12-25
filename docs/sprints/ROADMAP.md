# Grove UI/UX Unification Roadmap

**Created:** 2024-12-24
**Last Updated:** 2024-12-25
**Owner:** Jim Calhoun

---

## Executive Summary

This roadmap documents the complete path from current state (fragmented styling, technical debt) to unified UI across Terminal and Foundation surfaces. It captures extensive analysis and planning performed during the 2024-12-24 strategic session.

**Total Scope:** ~12 sprints over ~4-6 weeks
**Current Status:** Quantum Glass v1.1 COMPLETE, design system unified

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

| Sprint | Name | Focus | Est. Time | Status |
|--------|------|-------|-----------|--------|
| **1** | Chat Column Unification v1 | Terminal tokens, responsive | 4-5 days | ✅ Complete (PR #34) |
| **2** | ~~Terminal Polish~~ | ~~Overlay mode, transitions~~ | — | ⏭️ Skipped (not in user flow) |
| **3** | Workspace Inspectors v1 | IA v0.15, inspector refactor | 2.5h | ✅ Complete (PR #35) |
| **4** | Foundation Theme Cleanup | Remove orphaned theme code | 45 min | ✅ Complete (PR #36) |
| **5** | Grove Object Model v1 | GroveObject pattern, CardShell | 2h | ✅ Complete |
| **5.1** | Hub Normalization | TopicHub as GroveObject | 30 min | ✅ Complete |
| **6** | Terminal Polish v1 | ObjectInspector, card tokens | 1h | ✅ Complete |
| **7** | Quantum Glass v1 | CSS-first design system | 2h | ✅ Complete |
| **7.1** | Quantum Glass v1 Hotfix | Collection view cards | 30 min | ✅ Complete |
| **7.2** | Quantum Glass v1.1 | Card System Unification | 1.5h | ✅ Complete |
| **8** | Declarative UI Config v1 | Extend lens-reactive touchpoints | 2h | 📋 Ready |
| **9** | Responsive Excellence | All breakpoints, mobile | 3-4 days | 📋 Planned |
| **10** | Animation & Micro-interactions | Polish, delight | 2-3 days | 📋 Planned |
| **11** | Documentation & Handoff | Design system docs | 2 days | 📋 Planned |

**Total:** ~20-26 days (~4-5 weeks)

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

## Sprint 4: Foundation Theme Cleanup ✅ COMPLETE

### Objective
Remove orphaned theme system infrastructure that was never completed.

### Results (PR #36)
- Deleted `src/foundation/layout/` (5 files, 310 lines)
- Cleaned tailwind.config.ts (-37 lines of broken theme-* tokens)
- Cleaned styles/globals.css (-39 lines of unused CSS variables)
- Sprint documentation in `docs/sprints/foundation-theme-integration-v1/`
- Build verification passed (`npm run build` succeeds)

### Discovery (2024-12-24)
Audit revealed the codebase has TWO parallel Foundation layout systems:

| System | Location | Status | Tokens |
|--------|----------|--------|--------|
| **Active** | `FoundationWorkspace.tsx`, `FoundationHeader.tsx` | ✅ Works | workspace (`surface-*`, `slate-*`) |
| **Orphaned** | `src/foundation/layout/*` | ❌ Never imported | broken `theme-*` |

**Root Cause:** `tailwind.config.ts` has theme-* tokens at wrong nesting level (siblings of `colors`, not children). Classes like `bg-theme-bg-secondary` were never generated.

### Scope (Cleanup Only)

| Task | Description | Est. |
|------|-------------|------|
| Delete orphaned files | Remove `src/foundation/layout/` (310 lines) | 5 min |
| Clean Tailwind config | Remove broken theme-* objects | 10 min |
| Clean globals.css | Remove unused theme fallbacks | 10 min |
| Verify Foundation works | Test all /foundation routes | 10 min |
| Update docs | Document cleanup | 10 min |

### Files to Delete
```
src/foundation/layout/
├── FoundationLayout.tsx    (65 lines)
├── HUDHeader.tsx           (77 lines)
├── NavSidebar.tsx          (129 lines)
├── GridViewport.tsx        (29 lines)
└── index.ts                (~10 lines)
```

### Config Changes
- `tailwind.config.ts`: Remove theme-bg, theme-text, theme-border, theme, theme-accent objects (~35 lines)
- `styles/globals.css`: Remove THEME SYSTEM section (~40 lines)

### NOT in Scope (→ Sprint 5)
- ThemeProvider implementation
- JSON theme loading
- Dynamic theme switching
- Converting components to theme tokens

### Success Criteria
- [x] `src/foundation/layout/` deleted
- [x] tailwind.config.ts has no theme-* objects
- [x] globals.css has no THEME SYSTEM section
- [x] `npm run build` succeeds
- [ ] All `/foundation/*` routes work (visual verification pending)
- [x] No console errors

### Foundation Loop Artifacts
- `docs/sprints/foundation-theme-integration-v1/REPO_AUDIT.md`
- `docs/sprints/foundation-theme-integration-v1/SPEC.md`
- `docs/sprints/foundation-theme-integration-v1/ARCHITECTURE.md`
- `docs/sprints/foundation-theme-integration-v1/MIGRATION_MAP.md`
- `docs/sprints/foundation-theme-integration-v1/STORIES.md`
- `docs/sprints/foundation-theme-integration-v1/EXECUTION_PROMPT.md`

### Metrics Actual
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Lines in /layout | 310 | 0 | -310 |
| tailwind.config.ts | 169 | ~132 | -37 |
| globals.css | 761 | ~722 | -39 |
| **Total** | — | — | **-386 lines** |

---

## Sprint 5: Grove Object Model v1 ✅ COMPLETE

### Summary
Completed 2024-12-25. Established Pattern 7 (Grove Object Model) for unified object representation.

### Delivered
- **GroveObject/GroveObjectMeta types** — Unified interface for all domain objects
- **CardShell component** — Reusable card with visual state matrix
- **Normalizer functions** — Journey, Lens, Hub converters
- **ObjectInspector** — Collapsible JSON viewer for META/PAYLOAD

### Key Files
- `src/core/schema/grove-object.ts` — Type definitions
- `src/surface/components/GroveObjectCard/CardShell.tsx` — Unified card component
- `src/shared/inspector/ObjectInspector.tsx` — JSON inspector

---

## Sprint 5.1: Hub Normalization ✅ COMPLETE

### Summary
Extended Pattern 7 to include TopicHub as first-class GroveObject.

### Delivered
- **HubContent.tsx** — Hub-specific card renderer
- **normalizeHub()** — Hub → GroveObject converter with legacy fallback
- **Schema updates** — Added icon, createdBy, color to TopicHub

---

## Sprint 6: Terminal Polish v1 ✅ COMPLETE

### Summary
Completed 2024-12-25. Card token unification and ObjectInspector creation.

### Delivered
- **Card tokens** — `--card-*` CSS variables for visual states
- **ObjectInspector** — Collapsible META/PAYLOAD sections
- **LensInspector/JourneyInspector** — Refactored to use ObjectInspector

---

## Sprint 7: Quantum Glass v1 ✅ COMPLETE

### Summary
Completed 2024-12-25. CSS-first design system transformation.

### Delivered
- **~220 lines CSS tokens** — `--glass-*`, `--neon-*`, `--glow-*`
- **Glass morphism** — Backdrop blur, translucent panels
- **StatusBadge component** — Monospace status indicators with pulse
- **Data-attribute states** — `data-selected`, `data-active` for CSS-driven styling

### Key Files
- `styles/globals.css` — Quantum Glass design system tokens
- `src/shared/ui/StatusBadge.tsx` — Status badge component
- `src/workspace/` — Updated NavigationSidebar, GroveWorkspace

---

## Sprint 7.1: Quantum Glass v1 Hotfix ✅ COMPLETE

### Summary
Completed 2024-12-25. Applied glass styling to collection view cards.

### Delivered
- **JourneyList** — glass-card, --neon-amber callouts
- **LensPicker** — glass-card, status-badge
- **NodeGrid** — glass-card, glass-section-header

---

## Sprint 7.2: Quantum Glass v1.1 — Card System Unification ✅ COMPLETE

### Summary
Completed 2024-12-25. Unified all collection view cards and fixed inspector context bug.

### Delivered
- **CSS utilities** — `.glass-card-icon`, `.glass-callout`, `.glass-card-footer`, `.glass-card-meta`, `.glass-btn-primary`, `.glass-btn-secondary`
- **Inspector context fix** — Closes when navigating between collection views
- **JourneyList refactor** — Full + compact cards to glass pattern
- **LensPicker refactor** — Removed ~80 lines of lensAccents, unified to monochrome icons
- **NodeGrid refactor** — Removed Lucide icons, glass pattern
- **Shared components** — CollectionHeader, SearchInput, ActiveIndicator to glass tokens

### Metrics
| Metric | Change |
|--------|--------|
| lensAccents deleted | -80 lines |
| Lucide imports removed | NodeGrid |
| CSS utilities added | 6 classes |

---

## Sprint 8: Declarative UI Config v1 📋 READY

### Objective
Extend the existing Quantum Interface to make more UI touchpoints lens-reactive.

### User Story
**As a** Grove operator configuring experiences for different audiences
**I want** more UI elements to respond to lens/persona selection
**So that** CTA labels, placeholders, and nav labels adapt automatically

### Approach
**Extend, don't replace.** The persona/lens system already works via `useQuantumInterface`, `LensReality`, and `SUPERPOSITION_MAP`. We're adding fields and wiring more components.

### Scope

| Task | Location | Est. |
|------|----------|------|
| Extend LensReality type | `src/core/schema/narrative.ts` | 15 min |
| Update SUPERPOSITION_MAP | `src/data/quantum-content.ts` | 30 min |
| Wire HeroHook CTA | `src/surface/components/genesis/HeroHook.tsx` | 15 min |
| Wire Terminal placeholder | `components/Terminal/CommandInput/*` | 15 min |
| Wire Foundation nav (optional) | sidebar component | 20 min |
| Test & commit | — | 15 min |
| **Total** | | **~2 hours** |

### Schema Extension

```typescript
// Add to existing LensReality (all optional)
interface LensReality {
  // existing fields preserved
  navigation?: {
    ctaLabel?: string;      // "Begin" | "Start Exploring" | "Access Research"
    skipLabel?: string;
  };
  foundation?: {
    sectionLabels?: {
      explore?: string;     // "Explore" | "Research" | "Discover"
      cultivate?: string;
      grove?: string;
    };
  };
}
```

### Success Criteria
- [ ] LensReality type extended (backward compatible)
- [ ] 3+ personas updated with new fields
- [ ] CTA label changes when lens changes
- [ ] `npm run build` succeeds

### Foundation Loop Artifacts
- `docs/sprints/declarative-ui-config-v1/SPEC.md`
- `docs/sprints/declarative-ui-config-v1/STORIES.md`
- `docs/sprints/declarative-ui-config-v1/EXECUTION_PROMPT.md`

---

## Sprint 9: Responsive Excellence

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
- Sprint 1-8 complete

---

## Sprint 10: Animation & Micro-interactions

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
- Sprint 1-9 complete

---

## Sprint 11: Documentation & Handoff

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
- Sprint 1-10 complete

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
| 2024-12-24 | Sprint 3 executed via Claude Code CLI |
| | PR #35 created: IA v0.15, DiaryList, DiaryInspector |
| 2024-12-24 | Sprint 4 executed via Claude Code CLI |
| | PR #36 created: -386 lines dead code removal |
| | Theme cleanup complete, Foundation routes verified |
| 2024-12-25 | Sprint 5: Grove Object Model v1 complete |
| | Pattern 7 established, CardShell, GroveObject types |
| 2024-12-25 | Sprint 5.1: Hub Normalization complete |
| | TopicHub as GroveObject, HubContent renderer |
| 2024-12-25 | Sprint 6: Terminal Polish v1 complete |
| | ObjectInspector, card tokens |
| 2024-12-25 | Sprint 7: Quantum Glass v1 complete |
| | ~220 lines CSS tokens, glass morphism design system |
| 2024-12-25 | Sprint 7.1: Collection view hotfix complete |
| | JourneyList, LensPicker, NodeGrid glass styling |
| 2024-12-25 | Sprint 7.2: Quantum Glass v1.1 complete |
| | Card system unification, lensAccents deleted (-80 lines) |
| | Inspector context fix, shared component updates |
