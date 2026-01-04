# RAG Discovery Enhancement — Continuation Prompt

**Use this prompt in a fresh Claude context window to continue work.**

---

## Context

This sprint adds **hybrid search** to the Grove Knowledge Pipeline, combining vector similarity with enrichment metadata (keywords, utility scores, temporal classification) to deliver more relevant search results. The problem: documents have rich metadata but search ignores it entirely.

**Current Status:** Planning complete, Foundation Loop artifacts generated, ready for execution.

## Project Location

```
C:\GitHub\the-grove-foundation
```

## What Was Accomplished

### Planning Phase
- Identified gap: enrichment metadata unused by retrieval
- Designed hybrid scoring formula with configurable weights
- Created 9 Foundation Loop artifacts for structured execution

### Documentation Created

All artifacts are in `docs/sprints/rag-discovery-enhancement/`:

| Document | Purpose |
|----------|---------|
| `INDEX.md` | Sprint navigation |
| `SPEC.md` | Goals, acceptance criteria, Live Status |
| `REPO_AUDIT.md` | Current state analysis |
| `ARCHITECTURE.md` | Target design, API contracts |
| `MIGRATION_MAP.md` | File-by-file changes with code |
| `DECISIONS.md` | 8 ADRs explaining key choices |
| `SPRINTS.md` | 5 epics with build gates |
| `EXECUTION_PROMPT.md` | Claude Code handoff |
| `DEVLOG.md` | Execution tracking |

### Key Technical Decisions

1. **Hybrid scoring formula:** vector×0.50 + keyword×0.25 + utility×0.15 + freshness×0.10
2. **Temporal decay:** dated=0.7, historical=0.5 (aggressive for fresh content)
3. **Backward compatible:** `hybrid=false` default until validated
4. **Strangler fig:** No Terminal changes, new functions alongside existing

## Sprint Roadmap

| Epic | Name | Status |
|------|------|--------|
| 1 | Database Functions | 📋 Ready |
| 2 | Search Module | 📋 Ready |
| 3 | Bulk Enrichment | 📋 Ready |
| 4 | API Integration | 📋 Ready |
| 5 | Testing & Validation | 📋 Ready |

**Estimated time:** ~9 hours (1-2 days)

## Your Task

### If Execution Has NOT Started:

1. **Read the execution prompt:**
   ```
   docs/sprints/rag-discovery-enhancement/EXECUTION_PROMPT.md
   ```

2. **Start with Epic 1:**
   - Create `supabase/migrations/005_hybrid_search.sql`
   - Run migration locally
   - Verify functions exist

3. **Follow build gates after each epic**

### If Execution Is IN PROGRESS:

1. **Check DEVLOG.md** for current status
2. **Find the last completed epic**
3. **Continue with next unchecked item**

### If Sprint Is COMPLETE:

1. **Verify all acceptance criteria** in SPEC.md
2. **Run final validation** (see EXECUTION_PROMPT.md)
3. **Update DEVLOG.md** with final status
4. **Prepare for production rollout**

## Files to Read First

Before doing anything, read these to understand current state:

```
1. docs/sprints/rag-discovery-enhancement/SPEC.md (Live Status + Attention Anchor)
2. docs/sprints/rag-discovery-enhancement/DEVLOG.md (Execution progress)
3. docs/sprints/rag-discovery-enhancement/EXECUTION_PROMPT.md (How to implement)
```

## Critical Context

- **DEX Compliance:** Weights hardcoded for MVP, noted in comments for future config
- **Backward Compatible:** Existing `searchDocuments()` unchanged
- **Local Testing:** Use `?hybrid=true` parameter to test before production
- **No Terminal Changes:** Strangler fig pattern, Terminal uses existing search

## Attention Anchor

**We are building:** Hybrid search combining vector similarity with enrichment metadata
**Success looks like:** Docs with explicit keywords rank higher for matching queries
**We are NOT:** Building Terminal integration, question matching, or full-text search

---

**Start by reading SPEC.md Live Status to orient yourself, then check DEVLOG.md for execution progress.**
