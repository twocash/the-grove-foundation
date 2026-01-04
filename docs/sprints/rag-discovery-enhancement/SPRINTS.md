# Sprint Breakdown — rag-discovery-enhancement-v1

## Sprint Overview

| Epic | Scope | Estimated Time | Dependencies |
|------|-------|----------------|--------------|
| Epic 1 | Database Functions | 2 hours | None |
| Epic 2 | Search Module | 2 hours | Epic 1 |
| Epic 3 | Bulk Enrichment | 2 hours | Epic 2 |
| Epic 4 | API Integration | 1.5 hours | Epic 2, 3 |
| Epic 5 | Testing & Validation | 1.5 hours | Epic 4 |

**Total:** ~9 hours (1-2 days)

---

## Epic 1: Database Functions

### Attention Checkpoint
Before starting this epic, verify:
- [ ] SPEC.md Live Status shows Phase 8: Execution
- [ ] Local Supabase is running or have access to Supabase dashboard
- [ ] Goal alignment confirmed: Add hybrid search SQL functions

### Story 1.1: Create Hybrid Search Function

**Task:** Create `search_documents_hybrid` RPC function

**File:** `supabase/migrations/005_hybrid_search.sql`

**Implementation:**
```sql
-- DEX NOTE: Weights hardcoded for MVP. Future sprint will move to search_config table.
-- Default weights: vector=0.50, keyword=0.25, utility=0.15, freshness=0.10
-- Temporal weights: evergreen=1.0, current=1.0, dated=0.7, historical=0.5

CREATE OR REPLACE FUNCTION search_documents_hybrid(
  query_embedding vector(768),
  query_keywords text[],
  match_count int DEFAULT 10,
  match_threshold float DEFAULT 0.3,
  track_retrievals boolean DEFAULT true,
  freshness_decay_days int DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  similarity float,
  keyword_score float,
  utility_boost float,
  freshness_boost float,
  temporal_weight float,
  final_score float,
  keywords text[],
  temporal_class text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH scored AS (
    SELECT 
      d.id,
      d.title,
      d.content,
      d.keywords,
      d.utility_score,
      d.temporal_class,
      d.created_at,
      -- Vector similarity (0-1)
      1 - (e.embedding <=> query_embedding) AS vector_sim,
      -- Keyword overlap score (0-1)
      CASE 
        WHEN d.keywords IS NULL OR array_length(query_keywords, 1) IS NULL THEN 0
        ELSE (
          SELECT COUNT(*)::float / GREATEST(array_length(query_keywords, 1), 1)
          FROM unnest(d.keywords) dk
          WHERE EXISTS (
            SELECT 1 FROM unnest(query_keywords) qk 
            WHERE LOWER(dk) LIKE '%' || LOWER(qk) || '%'
          )
        )
      END AS kw_score,
      -- Utility normalization (0-1 range via log scaling)
      CASE 
        WHEN d.utility_score IS NULL OR d.utility_score <= 0 THEN 0
        ELSE LN(d.utility_score + 1) / LN(10 + 1)  -- Normalize assuming max ~10
      END AS util_boost,
      -- Freshness decay (1 for new, decays to ~0.5 over decay period)
      1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - d.created_at)) / (freshness_decay_days * 86400)) AS fresh_boost,
      -- Temporal weight multiplier
      CASE d.temporal_class
        WHEN 'evergreen' THEN 1.0
        WHEN 'current' THEN 1.0
        WHEN 'dated' THEN 0.7
        WHEN 'historical' THEN 0.5
        ELSE 1.0
      END AS temp_weight
    FROM documents d
    JOIN embeddings e ON e.document_id = d.id AND e.chunk_id IS NULL
    WHERE d.archived = false
      AND d.embedding_status = 'complete'
      AND 1 - (e.embedding <=> query_embedding) > match_threshold
  )
  SELECT 
    s.id,
    s.title,
    s.content,
    s.vector_sim AS similarity,
    s.kw_score AS keyword_score,
    s.util_boost AS utility_boost,
    s.fresh_boost AS freshness_boost,
    s.temp_weight AS temporal_weight,
    -- Final weighted score
    (
      s.vector_sim * 0.50 +
      s.kw_score * 0.25 +
      s.util_boost * 0.15 +
      s.fresh_boost * 0.10
    ) * s.temp_weight AS final_score,
    s.keywords,
    s.temporal_class
  FROM scored s
  ORDER BY final_score DESC
  LIMIT match_count;
END;
$$;
```

**Tests:**
- Manual: Run in SQL editor with sample embedding and keywords
- Verify: Results include score breakdown columns

### Story 1.2: Create Retrieval Tracking Function

**Task:** Create `track_document_retrieval` RPC function

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION track_document_retrieval(
  doc_id uuid,
  query_text text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE documents
  SET 
    retrieval_count = COALESCE(retrieval_count, 0) + 1,
    last_retrieved_at = NOW(),
    retrieval_queries = (
      SELECT array_agg(DISTINCT q)
      FROM (
        SELECT unnest(COALESCE(retrieval_queries, ARRAY[]::text[])) AS q
        UNION
        SELECT LEFT(query_text, 200)
        LIMIT 50
      ) subq
    )
  WHERE id = doc_id;
END;
$$;
```

**Tests:**
- Verify counter increments
- Verify query deduplication
- Verify cap at 50 queries

### Story 1.3: Create Entity Search Function

**Task:** Create `find_documents_by_entity` RPC function

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION find_documents_by_entity(
  entity_name text,
  entity_type text DEFAULT NULL,
  match_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  matched_entity text,
  matched_type text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    d.id,
    d.title,
    ent->>'name' AS matched_entity,
    ent->>'type' AS matched_type
  FROM documents d,
       jsonb_array_elements(d.named_entities) AS ent
  WHERE d.archived = false
    AND ent->>'name' ILIKE '%' || entity_name || '%'
    AND (entity_type IS NULL OR ent->>'type' = entity_type)
  LIMIT match_limit;
END;
$$;
```

**Tests:**
- Search for known entity
- Filter by type
- Verify ILIKE matching

### Build Gate (Epic 1)
```bash
# Run migration
cd supabase && supabase db push

# Or test SQL directly in Supabase dashboard
# Verify functions exist:
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('search_documents_hybrid', 'track_document_retrieval', 'find_documents_by_entity');
```

---

## Epic 2: Search Module

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epic 1 complete (database functions exist)
- [ ] Previous epic tests pass
- [ ] Goal alignment confirmed: Add hybrid search to JS module

### Story 2.1: Add Keyword Extraction

**Task:** Add `extractQueryKeywords()` function to `lib/knowledge/search.js`

**Implementation:** See MIGRATION_MAP.md for full code

**Tests:**
- Unit: `extractQueryKeywords('How does Raft work?')` → `['raft', 'work']`
- Unit: Stopwords removed
- Unit: Max 10 keywords

### Story 2.2: Add Hybrid Search Function

**Task:** Add `searchDocumentsHybrid()` to `lib/knowledge/search.js`

**Implementation:** See MIGRATION_MAP.md for full code

**Tests:**
- Integration: Returns results with score breakdown
- Integration: Keywords extracted and passed to RPC
- Integration: Tracking called asynchronously

### Story 2.3: Add Entity Search Function

**Task:** Add `findDocumentsByEntity()` to `lib/knowledge/search.js`

**Implementation:** See MIGRATION_MAP.md for full code

**Tests:**
- Integration: Returns documents matching entity
- Integration: Type filter works

### Story 2.4: Update Module Exports

**Task:** Export new functions from `lib/knowledge/index.js`

**Implementation:**
```javascript
export { 
  searchDocuments,
  searchDocumentsHybrid,
  findSimilarDocuments,
  findDocumentsByEntity,
} from './search.js';
```

### Build Gate (Epic 2)
```bash
# Verify imports work
node -e "import('./lib/knowledge/index.js').then(m => console.log(Object.keys(m)))"

# Should list: searchDocuments, searchDocumentsHybrid, findDocumentsByEntity, etc.
```

---

## Epic 3: Bulk Enrichment

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epic 2 complete (search module updated)
- [ ] Previous epic tests pass
- [ ] Goal alignment confirmed: Add bulk enrichment pipeline

### Story 3.1: Create Enrichment Module

**Task:** Create `lib/knowledge/enrich.js` with:
- `getUnenrichedDocuments()`
- `getEnrichmentStats()`
- `enrichBatch()`

**Implementation:** See SPEC.md Epic 5 section for full code

**Tests:**
- Stats returns accurate counts
- Batch processes with rate limiting
- Errors don't crash batch

### Story 3.2: Update Module Exports

**Task:** Export enrichment functions from `lib/knowledge/index.js`

**Implementation:**
```javascript
export { 
  getUnenrichedDocuments,
  getEnrichmentStats,
  enrichBatch,
} from './enrich.js';
```

### Build Gate (Epic 3)
```bash
# Verify imports
node -e "import('./lib/knowledge/index.js').then(m => console.log('enrichBatch' in m))"
# Should print: true
```

---

## Epic 4: API Integration

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epic 2 and 3 complete
- [ ] All module functions exported
- [ ] Goal alignment confirmed: Expose hybrid search via API

### Story 4.1: Update Search Endpoint

**Task:** Modify `/api/knowledge/search` to support `hybrid` parameter

**File:** `server.js`

**Implementation:** See MIGRATION_MAP.md for code

**Tests:**
- `?hybrid=false` returns existing format
- `?hybrid=true` returns score breakdown
- Default maintains backward compatibility

### Story 4.2: Add Enrichment Stats Endpoint

**Task:** Add `GET /api/knowledge/enrich/stats`

**Implementation:** See MIGRATION_MAP.md for code

**Tests:**
- Returns accurate counts
- Handles empty database

### Story 4.3: Add Batch Enrichment Endpoint

**Task:** Add `POST /api/knowledge/enrich/batch`

**Implementation:** See MIGRATION_MAP.md for code

**Tests:**
- Processes specified batch size
- Returns processed count and errors

### Story 4.4: Add Entity Search Endpoint

**Task:** Add `GET /api/knowledge/entities/:name`

**Implementation:** See MIGRATION_MAP.md for code

**Tests:**
- Returns matching documents
- Type filter works

### Build Gate (Epic 4)
```bash
npm run dev

# Test endpoints
curl "http://localhost:3000/api/knowledge/search?q=test&hybrid=true"
curl "http://localhost:3000/api/knowledge/enrich/stats"
curl "http://localhost:3000/api/knowledge/entities/Raft"
```

---

## Epic 5: Testing & Validation

### Attention Checkpoint
Before starting this epic, verify:
- [ ] All previous epics complete
- [ ] API endpoints working locally
- [ ] Goal alignment confirmed: Validate and prepare for rollout

### Story 5.1: Create Integration Tests

**Task:** Create `tests/integration/hybrid-search.test.js`

**Tests:**
1. Hybrid search returns results with score breakdown
2. Keyword matches boost relevance
3. Tracking increments retrieval count
4. Entity search finds matching docs
5. Backward compatibility (hybrid=false)

### Story 5.2: Create Enrichment Tests

**Task:** Create `tests/integration/enrichment.test.js`

**Tests:**
1. Stats endpoint returns accurate counts
2. Batch endpoint processes documents
3. Rate limiting prevents API abuse

### Story 5.3: Local Validation

**Task:** Manual validation checklist

- [ ] Run `npm run dev`
- [ ] Test hybrid search with real query
- [ ] Compare hybrid vs basic results
- [ ] Verify score breakdown makes sense
- [ ] Test bulk enrichment on sample docs
- [ ] Verify no regressions

### Story 5.4: Update DEVLOG

**Task:** Document execution in `DEVLOG.md`

### Build Gate (Epic 5 - Final)
```bash
npm run build
npm test
npm run dev  # Manual smoke test
```

---

## Commit Sequence

```
1. feat(db): add hybrid search SQL functions
2. feat(knowledge): add hybrid search to search module
3. feat(knowledge): add bulk enrichment pipeline
4. feat(api): add hybrid parameter to search endpoint
5. feat(api): add enrichment endpoints
6. test: add hybrid search integration tests
7. docs: update sprint documentation
```

## Build Gates Summary

| After | Command | Expected |
|-------|---------|----------|
| Epic 1 | SQL verification | 3 functions exist |
| Epic 2 | Import check | searchDocumentsHybrid exported |
| Epic 3 | Import check | enrichBatch exported |
| Epic 4 | API curl tests | Endpoints respond |
| Epic 5 | `npm test` | All tests pass |

## Smoke Test Checklist

- [ ] Hybrid search returns results with score breakdown
- [ ] Keyword "Raft" in query boosts docs with "Raft" keyword
- [ ] Basic search (`hybrid=false`) still works
- [ ] Enrichment stats endpoint returns counts
- [ ] Batch enrichment processes documents
- [ ] No regressions in existing functionality
