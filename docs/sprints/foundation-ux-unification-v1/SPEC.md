# Specification: Grove Widget & Foundation UX Unification

**Sprint:** foundation-ux-unification-v1
**Version:** 1.0
**Date:** December 21, 2025

---

## Goals

### Primary Goals

1. **Unify the user experience** into a single Grove Widget with mode-fluid navigation
2. **Elevate the Garden** from modal to first-class mode alongside Explore
3. **Establish component grammar** for consistent Foundation console development
4. **Preserve existing functionality** while reorganizing architecture

### Secondary Goals

1. Enable slash command power-user interaction across all modes
2. Provide ambient awareness (session timer, sprout count, mode indicator)
3. Communicate Chat mode vision without faking the feature
4. Create reusable patterns for future widget extensions

---

## Non-Goals

### Explicitly Out of Scope

1. **Chat mode implementation** — Placeholder only, not functional
2. **Backend changes** — No new API endpoints required
3. **Sprout lifecycle progression** — Still MVP-only `status: 'sprout'`
4. **Knowledge Commons integration** — Preview only, no network sync
5. **Grove ID / authentication** — Session-only, anonymous
6. **Mobile optimization** — Desktop-first for this sprint

### Deferred

1. Text selection with inline "Plant this" tooltip (Week 3)
2. Foundation console migration beyond Narrative Architect (Week 4+)
3. Sprout cultivation agents (future sprint)

---

## Component Inventory

### Exists (Reuse)

| Component | Location | Reuse Strategy |
|-----------|----------|----------------|
| `useSproutStorage` | `hooks/useSproutStorage.ts` | Direct use |
| `useSproutCapture` | `hooks/useSproutCapture.ts` | Direct use |
| `useSproutStats` | `hooks/useSproutStats.ts` | Direct use |
| `useEngagementBus` | `hooks/useEngagementBus.ts` | Direct use |
| `useNarrativeEngine` | `hooks/useNarrativeEngine.ts` | Direct use |
| `CommandRegistry` | `Terminal/CommandInput/CommandRegistry.ts` | Extend |
| `CommandInput` | `Terminal/CommandInput/CommandInput.tsx` | Adapt |
| `CommandAutocomplete` | `Terminal/CommandInput/CommandAutocomplete.tsx` | Adapt |
| `GardenModal` | `Terminal/Modals/GardenModal.tsx` | Extract content |
| `DataPanel` | `foundation/components/DataPanel.tsx` | Direct use |
| `GlowButton` | `foundation/components/GlowButton.tsx` | Direct use |

### Create (Week 1)

| Component | Priority | Description |
|-----------|----------|-------------|
| `GroveWidget.tsx` | P0 | Unified container component |
| `WidgetUIContext.tsx` | P0 | Mode/inspector/session state |
| `WidgetHeader.tsx` | P0 | Ambient status bar |
| `ModeToggle.tsx` | P0 | Footer mode switcher |
| `CommandPalette.tsx` | P0 | Full-screen command picker |
| `WidgetInput.tsx` | P0 | Adapted command input |

### Create (Week 2)

| Component | Priority | Description |
|-----------|----------|-------------|
| `GardenView.tsx` | P1 | Garden mode content area |
| `SproutCard.tsx` | P1 | Individual sprout display |
| `GrowthStageGroup.tsx` | P1 | Sprouts grouped by stage |
| `KnowledgeCommonsPreview.tsx` | P2 | Network activity preview |
| `GardenEmptyState.tsx` | P1 | Guide to Explore when empty |

### Create (Week 3)

| Component | Priority | Description |
|-----------|----------|-------------|
| `ExploreView.tsx` | P1 | Explore mode wrapper |
| `PlantSelectionTooltip.tsx` | P2 | Inline plant action |
| `JourneyProgress.tsx` | P2 | Visual journey indicator |

### Create (Week 4)

| Component | Priority | Description |
|-----------|----------|-------------|
| `ChatPlaceholder.tsx` | P2 | Coming soon view |
| `ConsoleUIContext.tsx` | P1 | Foundation inspector state |
| `ModuleLayout.tsx` | P1 | Console module structure |
| `CollectionGrid.tsx` | P1 | Generic collection display |
| `Inspector.tsx` | P1 | Contextual right panel |

---

## Acceptance Criteria

### Week 1: Grove Widget Shell

- [ ] `GroveWidget.tsx` renders without errors
- [ ] Mode switching works between Explore/Garden/Chat tabs
- [ ] Command palette opens on `/` keystroke
- [ ] Session timer counts up from first interaction
- [ ] Sprout count displays correctly
- [ ] Mode indicator updates when switching
- [ ] Existing Terminal still works on main branch
- [ ] All existing E2E tests pass

### Week 2: Garden Mode

- [ ] Garden view displays sprouts grouped by growth stage
- [ ] SproutCard shows content, source journey, timestamp
- [ ] Empty state guides user to Explore mode
- [ ] `/garden` command switches to Garden mode
- [ ] Sprouts persist across page refresh
- [ ] Knowledge Commons preview renders (static mock)

### Week 3: Explore Mode Refinement

- [ ] Existing Terminal features work inside ExploreView
- [ ] Text selection shows "Plant this" tooltip
- [ ] `/plant` command captures with full context
- [ ] Journey navigation preserved
- [ ] All existing reveal triggers still fire

### Week 4: Foundation Console Pattern

- [ ] Narrative Architect uses new ModuleLayout
- [ ] Inspector opens/closes on entity click
- [ ] Component grammar documented
- [ ] Pattern replicable for other consoles

---

## Technical Constraints

### Must Use

1. React 19.2.3 (existing)
2. React Router 7.1.5 (existing)
3. Tailwind CSS 4.x (existing)
4. TypeScript 5.8.2 (existing)
5. Existing localStorage keys for sprouts

### Must Preserve

1. Current Terminal functionality
2. All Sprout System hooks and data model
3. Command registry pattern
4. Engagement bus integration
5. Feature flag system

### Must Avoid

1. Breaking changes to existing routes
2. New backend dependencies
3. Changes to localStorage schema
4. Modifying `src/core/` types (extend only)

---

## Success Metrics

### Functional

- Mode switching works in < 200ms
- Session timer accuracy within 1 second
- Zero data loss in sprout storage
- All 7 existing commands still work

### Quality

- TypeScript strict mode compliance
- No console errors in production build
- Lighthouse accessibility score > 90
- Bundle size increase < 50KB

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Terminal extraction complexity | Wrap before extracting—preserve working code |
| Mode switching UX confusion | User test with 3-step flow before polish |
| localStorage conflicts | Prefix new keys with `grove-widget-` |
| Performance regression | Profile before/after each phase |

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-21 | Claude | Initial specification |
