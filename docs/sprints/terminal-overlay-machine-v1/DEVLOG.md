# Development Log: terminal-overlay-machine-v1

## Sprint Status: Epics 1-3 Complete, Epic 4 Deferred

**Started:** 2024-12-25
**Deployed:** 2024-12-25
**Execution Agent:** Claude Opus 4.5

---

## Pre-Execution

### Pattern Check ✅

- [x] Read PROJECT_PATTERNS.md
- [x] Mapped requirements to Pattern 2 (Engagement Machine)
- [x] Documented extension approach in SPEC.md
- [x] No new patterns required (simplification of existing)

### Canonical Source Audit ✅

| Capability | Canonical Home | Recommendation |
|------------|----------------|----------------|
| Overlay components | `src/explore/`, `Terminal/` | INVOKE (already canonical) |
| State management | `useTerminalState.ts` | REFACTOR (simplify) |
| Type definitions | `types.ts` | REFACTOR (consolidate) |

---

## Execution Log

### Epic 1: Type Foundation

**Status:** ✅ Complete

- [x] Story 1.1: Add TerminalOverlay type
- [x] Story 1.2: Create overlay-registry.ts
- [x] Story 1.3: Create overlay-helpers.ts
- [x] Build Gate 1

**Notes:**
- Created discriminated union `TerminalOverlay` with types: none, welcome, lens-picker, journey-picker, wizard, field-picker
- Registry maps overlay types to components with static props and config (hideInput, analytics)
- Helper functions: `shouldShowInput()`, `isOverlayActive()`, `getOverlayAnalytics()`

**Commit:** `2a01ae2` - feat(terminal): Add overlay state machine (Epics 1-3)

---

### Epic 2: Renderer Component

**Status:** ✅ Complete

- [x] Story 2.1: Create TerminalOverlayRenderer
- [x] Story 2.2: Export new components
- [x] Build Gate 2

**Notes:**
- `TerminalOverlayRenderer` looks up component from registry and builds props via switch
- Added container wrapper `h-full w-full overflow-hidden` for proper sizing
- Exports added to `Terminal/index.ts`

**Commit:** `8662248` - fix(terminal): Add container wrapper to TerminalOverlayRenderer

---

### Epic 3: State Migration

**Status:** ✅ Complete

- [x] Story 3.1: Add overlay state (dual-write)
- [x] Story 3.2: Update Terminal.tsx rendering
- [x] Story 3.3: Update action callsites
- [x] Build Gate 3
- [x] Manual QA

**Notes:**
- Added `overlay` state to `useTerminalState` with dual-write to legacy booleans
- Added `setOverlay()` and `dismissOverlay()` actions
- Created `overlayHandlers` useMemo with unified lens selection logic
- Replaced ternary cascade in both embedded and overlay modes with `TerminalOverlayRenderer`
- Migrated all 15+ callsites from legacy actions to `setOverlay()`
- Net reduction: ~40 lines removed from Terminal.tsx

**Commit:** `af6e5a3` - feat(terminal): Complete Epic 3 - full overlay state machine migration

---

### Epic 4: Cleanup

**Status:** ⏸️ Deferred

- [ ] Story 4.1: Remove dual-write
- [ ] Story 4.2: Remove legacy state
- [ ] Story 4.3: Remove legacy types
- [ ] Final Build Gate
- [ ] Final QA

**Notes:**
- Deferred to verify stability in production
- Dual-write ensures backward compatibility during transition
- Can be completed in follow-up sprint once no regressions confirmed

---

## Issues Encountered

### Issue 1: Proportional Scaling Lost
**Symptom:** Lens picker and journey picker cards went full-width in narrow container
**Cause:** `max-w-3xl` (768px) doesn't constrain when container is ~400px
**Resolution:** Changed to `w-[92%] max-w-3xl mx-auto` for percentage-based margins
**Commit:** `9bfb166` - fix(explore): Apply percentage-based scaling to compact mode pickers

### Issue 2: Minor UI bugs remain
**Status:** Known, not blocking
**Notes:** Some edge cases in overlay transitions; will address in follow-up

---

## Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| State sources | 2 (booleans + overlay) | 1 (overlay primary) | 1 |
| Overlay actions | 8 (show/hide pairs) | 2 (setOverlay, dismissOverlay) | 2 |
| New overlay effort | 5+ files | 2 entries (registry + props) | 2 entries |
| Terminal.tsx overlay lines | ~50 | ~10 | ~10 |

---

## Post-Mortem

### What Went Well

- Dual-write migration strategy allowed incremental changes without breaking existing code
- Registry pattern made overlay config declarative and easy to extend
- Unified `overlayHandlers` consolidated duplicate lens selection logic

### What Could Improve

- Should have tested percentage-based scaling earlier (caught after deploy)
- Epic 4 cleanup should be scheduled to prevent technical debt accumulation

### Lessons for Future Sprints

- When refactoring state, dual-write then cleanup is safer than big-bang replacement
- Test responsive behavior in narrow containers, not just wide screens
- Registry patterns work well for component switching scenarios

---

## References

- [INDEX.md](./INDEX.md)
- [SPEC.md](./SPEC.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DECISIONS.md](./DECISIONS.md)
- [MIGRATION_MAP.md](./MIGRATION_MAP.md)
- [SPRINTS.md](./SPRINTS.md)
- [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md)
- [PROJECT_PATTERNS.md](../../PROJECT_PATTERNS.md)
