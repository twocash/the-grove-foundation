# SPRINTS.md - extraction-grove-context-v1

> **Sprint**: extraction-grove-context-v1
> **Created**: 2026-01-06
> **Updated**: 2026-01-06 (unified context)
> **Type**: Prompt Engineering + Architecture Unification

---

## Sprint Overview

| Attribute | Value |
|-----------|-------|
| Duration | ~1.5 hours |
| Complexity | Medium |
| Risk | Low |
| Files Changed | 1 |
| Functions Modified | 4 |

---

## Story Breakdown

### Story 1: Grove Context Constant
**Estimate**: 20 min

| Task | Description |
|------|-------------|
| 1.1 | Write `GROVE_WORLDVIEW_CONTEXT` constant (~60 lines) |
| 1.2 | Include 8 vocabulary terms with definitions |
| 1.3 | Add 6 framing principles |
| 1.4 | Add 6 anti-patterns |
| 1.5 | Insert at ~line 3280 in server.js |

**Acceptance**: Constant defined, `npm run build` passes

---

### Story 2: Update polishExtractedConcepts (Pipeline)
**Estimate**: 15 min

| Task | Description |
|------|-------------|
| 2.1 | Replace opening section with constant reference |
| 2.2 | Add "THE GROVE WORLDVIEW" header |
| 2.3 | Add Task step 0: "Ground in Grove Context" |
| 2.4 | Verify template literal syntax |

**Acceptance**: Pipeline extraction uses constant

---

### Story 3: Update enrichPromptTitles (Ad Hoc)
**Estimate**: 10 min

| Task | Description |
|------|-------------|
| 3.1 | Remove `groveContext` parameter |
| 3.2 | Replace dynamic injection with constant |
| 3.3 | Add "THE GROVE WORLDVIEW" header |

**Acceptance**: `/make-compelling` uses constant

---

### Story 4: Update enrichPromptTargeting (Ad Hoc)
**Estimate**: 10 min

| Task | Description |
|------|-------------|
| 4.1 | Remove `groveContext` parameter |
| 4.2 | Replace dynamic injection with constant |
| 4.3 | Add "THE GROVE WORLDVIEW" header |

**Acceptance**: `/suggest-targeting` uses constant

---

### Story 5: Remove Dynamic Lookup
**Estimate**: 10 min

| Task | Description |
|------|-------------|
| 5.1 | Delete knowledge module lookup block in `/api/prompts/enrich` |
| 5.2 | Update function calls to remove `groveContext` argument |
| 5.3 | Verify no dangling references |

**Acceptance**: No runtime knowledge module dependency for enrichment

---

### Story 6: Validation
**Estimate**: 25 min

| Task | Description |
|------|-------------|
| 6.1 | `npm run build` passes |
| 6.2 | Extract prompts via pipeline, check Grove vocabulary |
| 6.3 | Test `/make-compelling`, check Grove vocabulary |
| 6.4 | Test `/suggest-targeting`, check Grove vocabulary |
| 6.5 | Run QA check on new extractions |
| 6.6 | Compare QA flag rates before/after |

**Acceptance**: 
- All paths use Grove vocabulary (2+ terms per prompt)
- Research concepts bridge to Grove architecture
- QA flags decrease (target: 50% reduction)
- Context consistency across all paths

---

## Execution Order

```
1. Story 1 (constant) - Define the source of truth
   ↓
2. Story 2 (pipeline) - Update bulk extraction
   ↓
3. Story 3 (ad hoc titles) - Update title enrichment
   ↓
4. Story 4 (ad hoc targeting) - Update targeting enrichment
   ↓
5. Story 5 (cleanup) - Remove old dynamic lookup
   ↓
6. Story 6 (validation) - Test all paths
```

---

## Rollback Plan

If issues arise:
1. Revert all changes to `server.js`
2. Constant addition is low-risk - removal is clean
3. If backward compatibility needed, re-add `groveContext` parameter with default

---

## Definition of Done

- [ ] `GROVE_WORLDVIEW_CONTEXT` constant defined (~60 lines)
- [ ] Constant includes 8 Grove vocabulary terms
- [ ] Constant includes 6 framing principles
- [ ] Constant includes 6 anti-patterns
- [ ] `polishExtractedConcepts` uses constant
- [ ] `enrichPromptTitles` uses constant (param removed)
- [ ] `enrichPromptTargeting` uses constant (param removed)
- [ ] Dynamic knowledge lookup removed
- [ ] `npm run build` passes
- [ ] Pipeline extraction uses Grove vocabulary
- [ ] Ad hoc title enrichment uses Grove vocabulary
- [ ] Ad hoc targeting enrichment uses Grove vocabulary
- [ ] QA flag rate decreases
- [ ] DEVLOG updated with results
