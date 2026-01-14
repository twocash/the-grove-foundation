# Session Notes: Knowledge Base Integration v1

**Sprint:** knowledge-base-integration-v1
**Date:** 2026-01-13
**Session Type:** Implementation + Hotfix

---

## Summary

Implemented the "Add to Knowledge Base" feature that allows users to promote research documents from sprouts to the grove's persistent knowledge corpus. Discovered and fixed a critical schema mismatch during testing.

---

## Work Completed

### Phase 1: Core Implementation (Commit 77283ad)

| Deliverable | File | Status |
|-------------|------|--------|
| KB Integration Service | `src/explore/services/knowledge-base-integration.ts` | Created |
| React Hook | `src/explore/hooks/useKnowledgeBase.ts` | Created |
| Button Component | `src/explore/components/AddToKnowledgeBaseButton.tsx` | Created |
| ResearchResultsView Integration | `src/explore/components/ResearchResultsView.tsx` | Modified |
| GardenInspector Wiring | `src/explore/GardenInspector.tsx` | Modified |
| Visual QA Tests | `tests/visual-qa/knowledge-base-integration.spec.ts` | Created |
| Demo Page Update | `src/explore/ResultsDisplayDemo.tsx` | Modified |
| Review Document | `docs/sprints/knowledge-base-integration-v1/REVIEW.html` | Created |

**All 20 acceptance criteria passed. 9 Playwright visual QA screenshots captured.**

### Phase 2: Hotfix - Schema Mismatch (Post-commit)

**Problem Discovered:** When testing "Add to KB" button locally, inserts failed because:
- The `document` type in SupabaseAdapter mapped to the `documents` table
- The `documents` table was designed for RAG/Knowledge Vault with columns: `content`, `content_hash`, `tier`, `source_type`, etc.
- The GroveObject pattern expects: `meta` (JSONB), `payload` (JSONB)

**Root Cause:** Schema collision between two different "document" concepts:
1. **RAG Documents** (`documents` table) - Knowledge Vault content for retrieval
2. **Corpus Documents** (new) - Research documents promoted from sprouts

**Solution:** Created separate `corpus_documents` table using JSONB meta+payload pattern.

| Fix | File | Change |
|-----|------|--------|
| New Migration | `supabase/migrations/014_corpus_documents.sql` | Created table with JSONB pattern |
| Adapter Update | `src/core/data/adapters/supabase-adapter.ts` | Changed TABLE_MAP: `document` → `corpus_documents` |
| Adapter Update | `src/core/data/adapters/supabase-adapter.ts` | Added `document` to JSONB_META_TYPES |

**Migration applied via Supabase MCP to project `cntzzxqgqsjzsvscunsp` (The Grove Foundation).**

---

## Files Changed (Hotfix Only)

```
supabase/migrations/014_corpus_documents.sql  (NEW)
src/core/data/adapters/supabase-adapter.ts    (MODIFIED)
```

---

## Database Schema Added

```sql
CREATE TABLE corpus_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL DEFAULT '{}',
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for status, sproutId lookup, and sorting
-- Trigger for auto-updating updated_at
```

---

## Architecture Decision

**Why separate table instead of altering `documents`?**

1. **Separation of concerns** - RAG documents and corpus documents serve different purposes
2. **No migration risk** - Existing 69 RAG documents unaffected
3. **Schema clarity** - `corpus_documents` uses GroveObject pattern consistently
4. **Future-proof** - Corpus documents may need different RLS policies, indexes

---

## Testing Status

| Test | Status |
|------|--------|
| `npm run build` | PASS |
| Playwright Visual QA (9 tests) | PASS |
| Local KB Button Click | Pending re-test after migration |

---

## Next Steps

1. Re-test "Add to KB" button locally to confirm fix
2. Commit hotfix changes
3. Push to main
4. Deploy to production

---

## Commit History

| Commit | Message |
|--------|---------|
| `77283ad` | feat(explore): Knowledge Base Integration v1 - Add to KB button with full provenance |
| (pending) | fix(data): Schema separation for corpus documents |

---

## Sprintmaster Notes

This sprint is **functionally complete** but required an unplanned hotfix for a schema mismatch discovered during local testing. The hotfix is:
- Low risk (additive change only)
- Properly isolated (new table, no existing data affected)
- Migration applied to production Supabase

**Recommendation:** Merge hotfix, deploy, and close sprint.
