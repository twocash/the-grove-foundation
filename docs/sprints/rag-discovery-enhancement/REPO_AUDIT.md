# Repository Audit — rag-discovery-enhancement-v1

## Audit Date: 2026-01-04

## Current State Summary

The Knowledge Pipeline has complete enrichment infrastructure (keywords, entities, questions_answered, utility_score, temporal_class) and a UI for viewing/editing these fields. However, the retrieval system uses pure vector similarity and **ignores all enrichment metadata**. This sprint closes the loop by adding hybrid search that leverages enrichment data.

## File Structure Analysis

### Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `lib/knowledge/search.js` | Current search implementation | 170 |
| `lib/knowledge/index.js` | Module exports | ~50 |
| `lib/embeddings.js` | Embedding generation | ~100 |
| `server.js` | API endpoints including `/api/knowledge/search` | ~2000 |
| `supabase/migrations/004_enrichment_fields.sql` | Enrichment schema | ~100 |

### Database Functions (Supabase)

| Function | Purpose | Status |
|----------|---------|--------|
| `search_documents` | Pure vector similarity search | ✅ Exists |
| `search_documents_hybrid` | Hybrid search with metadata | ❌ Missing |
| `track_document_retrieval` | Update utility scores | ❌ Missing |
| `find_documents_by_entity` | Entity-based lookup | ❌ Missing |

### Dependencies

```json
{
  "@supabase/supabase-js": "^2.x",
  "@google/generative-ai": "^0.x"  // For embeddings
}
```

No new dependencies required.

## Architecture Assessment

### DEX Compliance

| Area | Status | Notes |
|------|--------|-------|
| Declarative config | ⚠️ Partial | Weights hardcoded for MVP; should be configurable |
| Capability agnostic | ✅ Pass | Works with any embedding model |
| Single source of truth | ✅ Pass | Enrichment data in documents table |

### Violations Found

None blocking. Note for future:
- Search weights (50/25/15/10) should move to config table
- Temporal decay values should be admin-adjustable

## Test Coverage Assessment

### Current Test State

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Unit | 0 | 0 | Knowledge module not unit tested |
| Integration | 0 | 0 | API endpoints not integration tested |
| E2E | 1 | ~5 | Basic Terminal flow only |

### Test Quality
- [ ] Tests verify behavior (not implementation) — N/A (no tests exist)
- [ ] Tests use semantic queries — N/A
- [ ] Tests report to Health system — N/A

### Test Gaps
- No tests for `lib/knowledge/*.js` functions
- No API endpoint tests for `/api/knowledge/*`
- No tests for enrichment pipeline

**Recommendation:** Add integration tests for search endpoints as part of this sprint.

## Technical Debt

1. **No hybrid search** — Core gap this sprint addresses
2. **No retrieval tracking** — Can't measure document utility
3. **No bulk enrichment** — Manual per-doc enrichment only
4. **Search weights hardcoded** — Not DEX-compliant

## Risk Assessment

| Area | Current Risk | Notes |
|------|--------------|-------|
| Search regression | Medium | New function alongside existing, not replacing |
| Performance | Low | Hybrid scoring adds minimal overhead |
| Data integrity | Low | Read-only operations except tracking |
| Enrichment cold start | Medium | Need bulk enrichment for corpus |

## Recommendations

1. **Create `search_documents_hybrid`** — New RPC, keep existing function
2. **Add retrieval tracking** — Increment counts, build utility signal
3. **Add bulk enrichment endpoint** — Backfill existing corpus
4. **Add integration tests** — At minimum, test search API endpoints
5. **Document rollout** — Easy local testing before production

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/005_hybrid_search.sql` | Database functions |
| `lib/knowledge/enrich.js` | Bulk enrichment pipeline |

## Files to Modify

| File | Change |
|------|--------|
| `lib/knowledge/search.js` | Add `searchDocumentsHybrid()`, `trackRetrievals()` |
| `lib/knowledge/index.js` | Export new functions |
| `server.js` | Add `hybrid` parameter, enrichment endpoints |
