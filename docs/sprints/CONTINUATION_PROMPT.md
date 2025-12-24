# Grove UI Unification - Continuation Prompt

**Use this prompt in a fresh Claude Desktop context window to continue the UI unification work.**

---

## Context

You're continuing a UI unification initiative for The Grove, a distributed AI infrastructure project. The previous session (2024-12-24) completed extensive planning and created a full Foundation Loop for Sprint 1.

## Project Location

```
C:\GitHub\the-grove-foundation
```

## What Was Accomplished

### Strategic Analysis
- Verified Terminal (/terminal) and Foundation (/foundation) routes are architecturally isolated
- Discovered Terminal has two render modes: `variant="embedded"` (dark) and `variant="overlay"` (paper/ink)
- Found Genesis split panel and Workspace ExploreChat use different styling approaches for the same Terminal component
- Identified 100+ line CSS hack in ExploreChat.tsx that needs deletion
- Chose "Option C" - unified `--chat-*` token system for chat column (warm forest palette)

### Documentation Created
All artifacts are in `docs/sprints/`:

**Master Roadmap:**
- `docs/sprints/ROADMAP.md` - 8-sprint sequence, all prior analysis preserved

**Sprint 1 Foundation Loop (COMPLETE):**
- `docs/sprints/chat-column-unification-v1/INDEX.md` - Navigation
- `docs/sprints/chat-column-unification-v1/REPO_AUDIT.md` - Color inventory
- `docs/sprints/chat-column-unification-v1/SPEC.md` - Goals, acceptance criteria
- `docs/sprints/chat-column-unification-v1/ARCHITECTURE.md` - Token system design
- `docs/sprints/chat-column-unification-v1/MIGRATION_MAP.md` - File-by-file changes
- `docs/sprints/chat-column-unification-v1/DECISIONS.md` - 7 ADRs
- `docs/sprints/chat-column-unification-v1/STORIES.md` - 22 stories, 7 epics
- `docs/sprints/chat-column-unification-v1/EXECUTION_PROMPT.md` - Claude Code handoff
- `docs/sprints/chat-column-unification-v1/DEV_LOG.md` - Execution tracking

### Key Technical Decisions
1. Three token namespaces: `--grove-*` (workspace), `--chat-*` (Terminal), `--theme-*` (Foundation)
2. Container queries for responsive chat (not media queries)
3. Overlay mode (paper/ink) unchanged in Sprint 1
4. Token values exactly match current Genesis hardcoded values (zero visual regression)

## Sprint Roadmap

| Sprint | Name | Days | Status |
|--------|------|------|--------|
| 1 | Chat Column Unification | 4-5 | 🟡 Ready / ✅ Done? |
| 2 | Terminal Polish (overlay) | 3 | 📋 Next |
| 3 | Workspace Shell Completion | 3-4 | 📋 Planned |
| 4 | Foundation Theme Integration | 2-3 | 📋 Planned |
| 5 | Cross-Surface Consistency | 2-3 | 📋 Planned |
| 6 | Responsive Excellence | 3-4 | 📋 Planned |
| 7 | Animation & Micro-interactions | 2-3 | 📋 Planned |
| 8 | Documentation & Handoff | 2 | 📋 Planned |

## Your Task

### If Sprint 1 is COMPLETE:

1. **Review completion:**
   - Read `docs/sprints/chat-column-unification-v1/DEV_LOG.md` for execution notes
   - Check if Genesis baseline tests pass
   - Verify ExploreChat.tsx was cleaned up

2. **Create Sprint 2 Foundation Loop:**
   - Sprint 2: Terminal Polish (overlay mode, transitions, mobile)
   - Follow same artifact structure as Sprint 1
   - Reference ROADMAP.md for scope

3. **Update ROADMAP.md:**
   - Mark Sprint 1 complete
   - Add any lessons learned

### If Sprint 1 is NOT YET EXECUTED:

1. **Confirm ready for execution:**
   - Review EXECUTION_PROMPT.md
   - Ensure no blockers

2. **Guide execution:**
   - Sprint 1 is executed via Claude Code CLI
   - Execution prompt is at: `docs/sprints/chat-column-unification-v1/EXECUTION_PROMPT.md`

## Key Files to Read First

Before doing anything, read these to understand current state:

```
1. docs/sprints/ROADMAP.md (master plan, all context)
2. docs/sprints/chat-column-unification-v1/INDEX.md (Sprint 1 overview)
3. docs/sprints/chat-column-unification-v1/DEV_LOG.md (execution status)
```

## Token Architecture Reference

```
Surface          Namespace    Aesthetic
─────────────────────────────────────────
Workspace Shell  --grove-*    Cool slate (#0f172a)
Chat Column      --chat-*     Warm forest (#1a2421)
Foundation       --theme-*    Dark holodeck
```

## Critical Context

- **Genesis baseline tests exist** at `tests/e2e/genesis-baseline.spec.ts`
- **ExploreChat CSS hack** is 100+ lines of !important overrides - must be deleted
- **TerminalHeader** has lens picker, journey badge, streak counter - preserve all functionality
- **Container queries** used for responsive (not media queries) because component needs to respond to panel width, not viewport

## Questions to Ask Jim

If you need clarification:
1. "Has Sprint 1 been executed yet?"
2. "Any issues during Sprint 1 execution?"
3. "Ready to plan Sprint 2, or need to review Sprint 1 first?"

---

**Start by reading the ROADMAP.md to orient yourself, then check Sprint 1 status.**
