# RAG Discovery Enhancement — Sprint Index

**Sprint:** rag-discovery-enhancement-v1  
**Status:** 🟡 Ready for Execution  
**Created:** 2026-01-04

---

## Quick Links

| Artifact | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Goals, acceptance criteria, Live Status |
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Target state design, API contracts |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes with code |
| [DECISIONS.md](./DECISIONS.md) | Architectural decision records |
| [SPRINTS.md](./SPRINTS.md) | Epic breakdown with build gates |
| **[EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md)** | **Claude Code handoff** |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking |
| [CONTINUATION_PROMPT.md](./CONTINUATION_PROMPT.md) | Session handoff |

---

## How to Execute

### Using Claude Code CLI:
```bash
cd C:\GitHub\the-grove-foundation
cat docs/sprints/rag-discovery-enhancement/EXECUTION_PROMPT.md
# Follow the phased execution plan
```

### Using Claude Desktop:
1. Read SPEC.md for context and acceptance criteria
2. Read EXECUTION_PROMPT.md for step-by-step instructions
3. Execute each epic, updating DEVLOG.md as you go

---

## Sprint Summary

**Objective:** Add hybrid search that combines vector similarity with enrichment metadata (keywords, utility scores, temporal classification) to improve RAG retrieval relevance.

**Problem:** Documents have rich metadata but search ignores it entirely. A document with explicit "Raft" keywords doesn't rank higher when user asks about Raft consensus.

**Solution:** 
- Create `search_documents_hybrid` SQL function with weighted scoring
- Add `searchDocumentsHybrid()` to knowledge module
- Expose via API with backward-compatible `hybrid` parameter
- Add bulk enrichment pipeline for corpus backfill

**Scope:**
- ✅ Hybrid search function (vector + keyword + utility + freshness)
- ✅ Retrieval tracking for utility scores
- ✅ Bulk enrichment pipeline
- ✅ API endpoints with backward compatibility
- ❌ Question embedding matching (deferred)
- ❌ Terminal integration (strangler fig)
- ❌ Full-text search (separate enhancement)

**Duration:** ~9 hours (1-2 days)

**Success Criteria:**
1. When user asks "How does Raft work?", docs with "Raft" keywords rank higher
2. Utility scores update based on retrieval patterns
3. New documents get fair visibility via freshness boost
4. Existing search (`hybrid=false`) continues working unchanged

---

## Epic Overview

| Epic | Focus | Est. Time | Build Gate |
|------|-------|-----------|------------|
| 1 | Database Functions | 2h | SQL functions exist |
| 2 | Search Module | 2h | Import check passes |
| 3 | Bulk Enrichment | 2h | Enrich module works |
| 4 | API Integration | 1.5h | Endpoints respond |
| 5 | Testing & Validation | 1.5h | All tests pass |

---

## Key Files

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/005_hybrid_search.sql` | CREATE | SQL functions |
| `lib/knowledge/search.js` | MODIFY | Add hybrid functions |
| `lib/knowledge/enrich.js` | CREATE | Bulk enrichment |
| `lib/knowledge/index.js` | MODIFY | Export new functions |
| `server.js` | MODIFY | API endpoints |

---

## Attention Anchor

**Re-read this before major decisions:**

- **We are building:** Hybrid search using enrichment metadata
- **Success looks like:** Keyword matches boost document relevance
- **We are NOT:** Changing Terminal, adding question matching, full-text search
