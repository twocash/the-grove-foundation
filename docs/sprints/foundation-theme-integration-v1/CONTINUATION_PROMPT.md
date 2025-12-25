# Continuation Prompt: Foundation Theme Cleanup (Sprint 4)

**Last Updated:** 2024-12-24
**Status:** 🔄 Planning Complete, Ready for Execution
**Project:** The Grove Foundation
**Path:** `C:\GitHub\the-grove-foundation`

---

## Quick Context

Sprint 4 cleans up an incomplete theme system that was never finished. The codebase has TWO parallel Foundation layouts—one works (uses workspace tokens), one is broken and orphaned (uses theme-* tokens that don't generate Tailwind classes).

**This is a cleanup sprint, not a feature sprint.** We're deleting ~386 lines of dead code.

---

## What Was Accomplished This Session

1. ✅ Discovered the theme system was never completed
2. ✅ Identified `src/foundation/layout/` as orphaned (never imported)
3. ✅ Found Tailwind config bug (theme-* tokens at wrong nesting level)
4. ✅ Created all Foundation Loop artifacts
5. ✅ Updated ROADMAP.md with revised Sprint 4 scope and detailed Sprint 5 plan

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Delete orphaned files, don't fix them | Active system works; no use case for broken alternative |
| Remove theme-* from Tailwind | Broken config; Sprint 5 can implement correctly if needed |
| Sprint 5 is conditional | Only execute if dynamic theme switching becomes a requirement |

---

## Sprint Status

| Story | Status | Notes |
|-------|--------|-------|
| 1. Verify no hidden imports | ⬜ Not started | Gate for deletion |
| 2. Delete layout directory | ⬜ Not started | ~310 lines |
| 3. Clean config files | ⬜ Not started | tailwind + globals.css |
| 4. Verify and document | ⬜ Not started | Test routes, update docs |

**Estimated Time:** 45 minutes

---

## Files to Read First

Read in this order to reconstruct context:

1. `docs/sprints/ROADMAP.md` — Multi-sprint overview, Sprint 4-5 details
2. `docs/sprints/foundation-theme-integration-v1/REPO_AUDIT.md` — Discovery findings
3. `docs/sprints/foundation-theme-integration-v1/SPEC.md` — Sprint scope
4. `docs/sprints/foundation-theme-integration-v1/EXECUTION_PROMPT.md` — Step-by-step execution

---

## Next Actions

### Option A: Execute Sprint 4 (Recommended)

Hand off to Claude Code CLI:

```bash
cd C:\GitHub\the-grove-foundation
# Read the execution prompt
cat docs/sprints/foundation-theme-integration-v1/EXECUTION_PROMPT.md
# Follow the steps
```

Or execute manually following EXECUTION_PROMPT.md.

### Option B: Review and Adjust

If scope needs adjustment:
1. Read SPEC.md for current scope
2. Modify as needed
3. Update STORIES.md and EXECUTION_PROMPT.md
4. Then execute

---

## Files Changed/Created This Session

### Created (Sprint Artifacts)
- `docs/sprints/foundation-theme-integration-v1/REPO_AUDIT.md` (199 lines)
- `docs/sprints/foundation-theme-integration-v1/SPEC.md` (231 lines)
- `docs/sprints/foundation-theme-integration-v1/ARCHITECTURE.md` (265 lines)
- `docs/sprints/foundation-theme-integration-v1/MIGRATION_MAP.md` (309 lines)
- `docs/sprints/foundation-theme-integration-v1/STORIES.md` (171 lines)
- `docs/sprints/foundation-theme-integration-v1/EXECUTION_PROMPT.md` (302 lines)
- `docs/sprints/foundation-theme-integration-v1/DEV_LOG.md` (139 lines)
- `docs/sprints/foundation-theme-integration-v1/CONTINUATION_PROMPT.md` (this file)

### Modified
- `docs/sprints/ROADMAP.md` — Updated Sprint 4 scope, added Sprint 5 details

---

## Sprint 5 Decision Point

After Sprint 4 completes, evaluate:

| Question | If Yes | If No |
|----------|--------|-------|
| Need dynamic theme switching? | Execute Sprint 5 (2-3h) | Skip to Sprint 6 |
| Need Foundation dark mode? | Execute Sprint 5 | Skip to Sprint 6 |
| Workspace tokens sufficient? | Skip to Sprint 6 | Execute Sprint 5 |

**Current Recommendation:** Skip Sprint 5 unless concrete user story emerges.

---

## Questions to Verify State

If unsure about current state, check:

1. **Is layout directory still there?**
   ```bash
   ls src/foundation/layout/
   ```
   If exists → Sprint 4 not executed yet

2. **Does Tailwind have theme-* tokens?**
   ```bash
   grep "theme-bg" tailwind.config.ts
   ```
   If matches → Sprint 4 not executed yet

3. **Does Foundation work?**
   ```bash
   npm run dev
   # Visit http://localhost:3000/foundation
   ```
   Should load dashboard regardless of Sprint 4 status

---

## Git State

- **Branch:** `main` (Sprint 3 PR #35 merged)
- **Commit:** `1b32a9f` (roadmap update)
- **Clean:** Yes (no uncommitted changes)

Sprint 4 should create branch: `chore/foundation-theme-cleanup`

---

## Critical Context

### Why This Cleanup Matters

The orphaned theme system creates confusion:
- Comments reference non-existent `ThemeProvider.tsx`
- 300+ lines of dead code in `src/foundation/layout/`
- Broken Tailwind config that generates no classes
- Future developers will waste time trying to understand it

### Why Sprint 5 is Conditional

The active Foundation surface (`FoundationWorkspace.tsx`) uses workspace tokens and works correctly. There's no current use case for:
- Dynamic theme switching
- Foundation-specific dark mode
- JSON-driven theme loading

If these become requirements, Sprint 5 has detailed implementation plans ready.

---

## Handoff Instructions

### For Claude Desktop (Planning/Review)
```
Read C:\GitHub\the-grove-foundation\docs\sprints\foundation-theme-integration-v1\CONTINUATION_PROMPT.md

Then review Sprint 4 artifacts and confirm ready for execution, or identify any adjustments needed before handoff to Claude Code.
```

### For Claude Code (Execution)
```
Read C:\GitHub\the-grove-foundation\docs\sprints\foundation-theme-integration-v1\EXECUTION_PROMPT.md

Execute Sprint 4 following the step-by-step instructions. Update DEV_LOG.md as you complete each story.
```

---

## Session Metadata

- **Session Type:** Sprint Planning
- **Duration:** ~1 hour
- **Artifacts Created:** 8
- **Lines of Documentation:** ~1,750
- **Sprint Scope:** -386 lines of code
