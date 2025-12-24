# Chat Column Unification v1 - Sprint Index

**Sprint:** Chat Column Unification v1  
**Status:** 🟡 Ready for Execution  
**Created:** 2024-12-24

---

## Quick Links

| Artifact | Purpose |
|----------|---------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Color inventory, file mapping |
| [SPEC.md](./SPEC.md) | Goals, acceptance criteria |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Token system design |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes |
| [DECISIONS.md](./DECISIONS.md) | 7 architectural decisions |
| [STORIES.md](./STORIES.md) | 22 stories across 7 epics |
| **[EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md)** | **Claude Code handoff** |
| [DEV_LOG.md](./DEV_LOG.md) | Execution tracking template |

---

## Parent Documents

| Document | Purpose |
|----------|---------|
| [../ROADMAP.md](../ROADMAP.md) | Full 8-sprint roadmap |

---

## How to Execute

1. Open Claude Code CLI
2. Navigate to repository root
3. Run: `cat docs/sprints/chat-column-unification-v1/EXECUTION_PROMPT.md`
4. Follow the phased execution plan

---

## Sprint Summary

**Objective:** Create unified `--chat-*` token system for Terminal, fix responsive behavior, delete ExploreChat CSS hack

**Scope:**
- 30+ CSS tokens
- ~18 files modified
- 100+ lines of CSS hack deleted
- Container query responsive system

**Duration:** 4-5 days

**Success Criteria:**
- Genesis baseline tests pass
- Workspace chat matches Genesis
- ExploreChat.tsx < 40 lines
- All header functionality preserved
