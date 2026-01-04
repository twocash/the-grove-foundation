# hybrid-search-toggle-v1 — Sprint Index

**Sprint:** hybrid-search-toggle-v1  
**Status:** 🟡 Ready for Execution  
**Created:** 2025-01-04

---

## Quick Links

| Artifact | Purpose |
|----------|---------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis |
| [SPEC.md](./SPEC.md) | Goals, acceptance criteria |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Data flow diagram |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes |
| [DECISIONS.md](./DECISIONS.md) | Architectural decisions |
| [SPRINTS.md](./SPRINTS.md) | Story breakdown |
| **[EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md)** | **Claude Code handoff** |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking |

---

## How to Execute

1. Open Claude Desktop or Claude Code
2. Navigate to repository root: `C:\github\the-grove-foundation`
3. Read: `docs/sprints/hybrid-search-toggle-v1/EXECUTION_PROMPT.md`
4. Follow the phased execution plan

---

## Sprint Summary

**Objective:** Add UI toggle to /explore header for hybrid RAG search

**Scope:**
- Toggle button in KineticHeader (RAG ON/OFF)
- State persistence via localStorage
- Wire flag through chatService to backend
- E2E tests for toggle behavior

**Duration:** 0.5 days

**Success Criteria:**
- Toggle visible and functional in /explore header
- State persists across page refreshes
- Flag reaches backend API
- 3 E2E tests pass
