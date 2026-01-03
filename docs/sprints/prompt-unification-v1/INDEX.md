# Sprint: prompt-unification-v1

**Reference DEX Trellis 1.0 Implementation**

---

## Quick Links

| Artifact | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Goals, non-goals, acceptance criteria |
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Target state, schemas |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes |
| [DECISIONS.md](./DECISIONS.md) | Architectural decisions |
| [SPRINTS.md](./SPRINTS.md) | Epic breakdown with tests |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Handoff for Claude Code |
| [DEVLOG.md](./DEVLOG.md) | Progress tracking |

---

## Sprint Summary

**What:** Unified Prompt object type with declarative sequence membership.

**Why:** All guided content (journeys, briefings, wizards) are the same structure with different metadata.

**Branch:** `bedrock` + `explore`

**Contract:** Bedrock Sprint Contract v1.0

---

## Status

| Phase | Status |
|-------|--------|
| Phase 0: Pattern Check | ✅ Complete |
| Phase 0.5: Canonical Source Audit | ✅ Complete |
| Phase 1: Repository Audit | ✅ Complete |
| Phase 2: Specification | ✅ Complete |
| Phase 3: Architecture | 🔄 In Progress |
| Phase 4: Migration Map | ⬜ Pending |
| Phase 5: Decisions | ⬜ Pending |
| Phase 6: Sprints | ⬜ Pending |
| Phase 7: Execution Prompt | ⬜ Pending |
| Phase 8: Execution | ⬜ Pending |

---

## Key Files

**Schema:**
- `src/core/schema/prompt.ts`

**Data Layer:**
- `src/core/data/grove-data-provider.ts` (extend)
- `src/core/data/adapters/supabase-adapter.ts` (extend)

**Console:**
- `src/bedrock/consoles/PromptWorkshop/`

**Explore:**
- `src/explore/hooks/usePromptSuggestions.ts`
- `src/explore/hooks/useSequence.ts`
