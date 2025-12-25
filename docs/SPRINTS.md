# SPRINT PLAN - Grove Foundation

> **Status:** 🟢 SPRINTS 1-5 COMPLETE | 🟡 SPRINT 6A + GLASS v1.2 READY
> **Last Updated:** 2025-12-25

## Sprint History

### Sprints 1-3: V2.1 Migration ✅ COMPLETE
See `docs/V21_MIGRATION_OPEN_ITEMS.md` for details.

### Sprint 4: The Entropy Engine (Logic) ✅ COMPLETE
Entropy detection, scoring, classification, cluster routing.

### Sprint 5: The Cognitive Bridge (UI) ✅ COMPLETE
Bridge component, Terminal integration, action handlers.

### Quantum Glass v1.0 ✅ COMPLETE
Design system foundation: tokens, glass-panel, glass-card, glass-viewport.

### Quantum Glass v1.1 ✅ COMPLETE (commit f635568)
Card system unification across Journeys, Lenses, Nodes collections.

### Navigation Hotfix ✅ COMPLETE (commit d637447)
Separated chevron/label click handlers for expand vs navigate.

---

## Current Sprint

### Sprint 6A + Quantum Glass v1.2 🟡 READY

**Goal:** Complete analytics wiring + visual unification of remaining views.

**Documentation:** `docs/sprints/sprint-6a-glass-v1.2/`
- REPO_AUDIT.md — Current state assessment
- SPEC.md — Requirements and acceptance criteria
- ARCHITECTURE.md — System diagrams and token mapping
- DECISIONS.md — Architectural choices
- SPRINTS.md — Story breakdown with estimates
- EXECUTION_PROMPT.md — Step-by-step implementation guide
- DEVLOG.md — Progress tracking template

**Workstreams:**

| ID | Story | Estimate | Priority |
|----|-------|----------|----------|
| 6A.1 | Verify Cognitive Bridge Events | 45 min | P1 |
| 6A.2 | Consolidate ENTROPY_CONFIG | 30 min | P1 |
| 6A.3 | Document Baseline Metrics | 30 min | P2 |
| v1.2.1 | Chat Container + Welcome Card | 45 min | P1 |
| v1.2.2 | Message Bubbles | 60 min | P1 |
| v1.2.3 | Input Field + Send Button | 30 min | P1 |
| v1.2.4 | Inspector Content Panels | 45 min | P1 |
| v1.2.5 | Diary View Glass Styling | 45 min | P2 |
| v1.2.6 | Sprout View Glass Styling | 45 min | P2 |

**Total Estimate:** 6-8 hours

**Execute:**
```bash
claude "Execute the sprint defined in C:\GitHub\the-grove-foundation\docs\sprints\sprint-6a-glass-v1.2\EXECUTION_PROMPT.md"
```

---

## Queued Sprint

### Engagement Reveal Bug Fix 📋 QUEUED

**Goal:** Fix bugs preventing engagement reveals from displaying.

**Documentation:** `docs/sprints/engagement-reveal-bugfix/PLAN.md`

**Prerequisites:**
- Sprint 6A complete (analytics for verification)
- Quantum Glass v1.2 complete (visual layer stable)

**Bugs:**
| ID | Issue | Root Cause Hypothesis |
|----|-------|----------------------|
| BUG-001 | Custom Lens Offer never appears | Queue-to-flag computation issue |
| BUG-003 | revealsShown[] always empty | State subscription not triggering render |

**Estimate:** 4 hours (investigation + fix)

---

## Pending Hotfixes

### Navigation Hotfixes 📋 DOCUMENTED

**Documentation:** `docs/sprints/hotfixes/`
- `inspector-not-clearing.md` — Inspector shows stale data on collection switch
- `first-project-expanded.md` — Grove Project should start expanded
- `EXECUTION_PROMPT_nav-fixes.md` — Combined fix (~6 lines, 2 files)

**Execute when ready:**
```bash
claude "Execute the hotfixes defined in C:\GitHub\the-grove-foundation\docs\sprints\hotfixes\EXECUTION_PROMPT_nav-fixes.md"
```

---

## Files Changed Summary (Recent Sprints)

| File | Sprint | Change |
|------|--------|--------|
| `styles/globals.css` | Glass v1.0-1.1 | Design system tokens, card utilities |
| `src/shared/ObjectGrid.tsx` | Glass v1.1 | Unified card component |
| `src/workspace/WorkspaceUIContext.tsx` | Nav Hotfix | Chevron/label separation |
| `utils/funnelAnalytics.ts` | 6A | Bridge tracking events (pending) |
| `constants.ts` | 6A | Config consolidation (pending) |
| `components/Terminal.tsx` | Glass v1.2 | Chat styling (pending) |

---

## Architectural Principles

From the Trellis Architecture and Grove directives:

1. **Soil before seeds:** Visual infrastructure must stabilize before behavioral features
2. **Measure before optimize:** Analytics enable data-driven tuning
3. **Consistency over cleverness:** Same card pattern across all views
4. **Declarative sovereignty:** Non-developers can configure experiences

---

## Success Metrics

### Sprint 6A (Analytics)
- [ ] Bridge events in localStorage with correct properties
- [ ] Single ENTROPY_CONFIG source
- [ ] Baseline metrics documented

### Quantum Glass v1.2 (Visual)
- [ ] Terminal chat uses glass tokens
- [ ] Message bubbles differentiated
- [ ] Inspector content matches frame
- [ ] Diary and Sprout views unified

### Engagement Bug Fix (Post-Sprint)
- [ ] Simulation Reveal appears when thresholds met
- [ ] Custom Lens Offer appears after acknowledgment
- [ ] revealsShown[] populated correctly
- [ ] Full funnel verified with analytics

---

*Last Updated: 2025-12-25*
