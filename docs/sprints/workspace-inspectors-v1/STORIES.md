# Sprint 3: Workspace Inspectors v1 — Stories

**Sprint:** workspace-inspectors-v1
**Date:** 2024-12-24

---

## Story 1: IA v0.15 Navigation Update

**Priority:** P0
**Estimate:** 30 min

### Description
Update NavigationSidebar to show new IA structure with Terminal, Diary, and Sprouts under Grove Project.

### Tasks
- [ ] Add `book: 'menu_book'` to iconNameToSymbol
- [ ] Update groveProject.children with 6 items (Terminal, Lenses, Journeys, Nodes, Diary, Sprouts)
- [ ] Remove mySprouts from Cultivate section
- [ ] Test navigation expansion/collapse

### Acceptance Criteria
- [ ] Nav shows: Explore → Grove Project → Terminal, Lenses, Journeys, Nodes, Diary, Sprouts
- [ ] Each item has correct icon
- [ ] Clicking items highlights correctly

---

## Story 2: Content Router Updates

**Priority:** P0
**Estimate:** 20 min

### Description
Add view routing for new nav items (Terminal explicit, Diary, Sprouts under Project).

### Tasks
- [ ] Import DiaryList component
- [ ] Add viewMap entries for new paths
- [ ] Add render case for diary-list
- [ ] Test routing works

### Acceptance Criteria
- [ ] Clicking Terminal shows ExploreChat
- [ ] Clicking Diary shows DiaryList placeholder
- [ ] Clicking Sprouts shows SproutGrid

---

## Story 3: DiaryList Stub

**Priority:** P1
**Estimate:** 15 min

### Description
Create placeholder content view for Diary section.

### Tasks
- [ ] Create src/explore/DiaryList.tsx
- [ ] Add placeholder UI with icon and coming soon message
- [ ] Export from module

### Acceptance Criteria
- [ ] DiaryList renders without errors
- [ ] Shows appropriate placeholder content
- [ ] Uses --grove-* tokens

---

## Story 4: DiaryInspector Stub

**Priority:** P1
**Estimate:** 20 min

### Description
Create placeholder inspector for diary entries.

### Tasks
- [ ] Create src/explore/DiaryInspector.tsx
- [ ] Add placeholder UI matching inspector pattern
- [ ] Add type for diary inspector mode
- [ ] Add case in Inspector.tsx

### Acceptance Criteria
- [ ] DiaryInspector renders without errors
- [ ] Can be opened via openInspector({ type: 'diary' })
- [ ] Shows placeholder content

---

## Story 5: LensInspector Refactor

**Priority:** P1
**Estimate:** 30 min

### Description
Remove inline form components from LensInspector, import from shared library.

### Tasks
- [ ] Remove Toggle definition (lines 11-47)
- [ ] Remove Slider definition (lines 49-72)
- [ ] Remove Select definition (lines 74-100)
- [ ] Remove Checkbox definition (lines 102-118)
- [ ] Remove InfoCallout definition (lines 120-135)
- [ ] Add imports from @/shared/forms and @/shared/feedback
- [ ] Verify all functionality still works

### Acceptance Criteria
- [ ] No inline component definitions in LensInspector
- [ ] Toggle switch works
- [ ] Slider works with valueLabel
- [ ] Select dropdown works
- [ ] Checkbox works
- [ ] InfoCallout displays

---

## Story 6: Token Audit

**Priority:** P2
**Estimate:** 20 min

### Description
Verify all inspector files use semantic tokens appropriately.

### Tasks
- [ ] Audit LensInspector token usage
- [ ] Audit JourneyInspector token usage
- [ ] Audit SproutInspector token usage
- [ ] Audit DiaryInspector token usage
- [ ] Document any hardcoded colors found

### Acceptance Criteria
- [ ] No hardcoded hex colors in inspector files
- [ ] Consistent dark mode behavior
- [ ] Report of token usage patterns

---

## Story Summary

| # | Story | Priority | Est. |
|---|-------|----------|------|
| 1 | IA v0.15 Navigation | P0 | 30m |
| 2 | Content Router Updates | P0 | 20m |
| 3 | DiaryList Stub | P1 | 15m |
| 4 | DiaryInspector Stub | P1 | 20m |
| 5 | LensInspector Refactor | P1 | 30m |
| 6 | Token Audit | P2 | 20m |

**Total Estimate:** ~2.5 hours

---

## Execution Order

```
Story 3 → Story 4 → Story 1 → Story 2 → Story 5 → Story 6
```

Rationale: Create stubs first (3, 4) so nav update (1) and routing (2) have targets. Then refactor (5) and audit (6).
