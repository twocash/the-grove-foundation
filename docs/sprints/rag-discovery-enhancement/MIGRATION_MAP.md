# Migration Map — rag-discovery-enhancement-v1

## Overview

Add hybrid search capabilities to the Knowledge Pipeline by:
1. Creating new database functions (alongside existing)
2. Extending search module with hybrid functions
3. Adding API endpoints for hybrid search and bulk enrichment
4. Maintaining full backward compatibility

## Files to Create

### `supabase/migrations/005_hybrid_search.sql`

**Purpose:** Database functions for hybrid search, retrieval tracking, and entity lookup
**Depends on:** Migration 004 (enrichment fields)
**Tests:** Manual SQL verification in Supabase SQL editor

**Content summary:**
- `search_documents_hybrid()` — Weighted scoring combining vector + metadata
- `track_document_retrieval()` — Increment utility counters
- `find_documents_by_entity()` — Entity-based document lookup

---

### `lib/knowledge/enrich.js`

**Purpose:** Bulk enrichment pipeline for backfilling existing corpus
**Depends on:** `lib/supabase.js`, existing enrichment logic in server.js
**Tests:** Integration test for batch enrichment

**Content summary:**
- `getUnenrichedDocuments()` — Find docs needing enrichment
- `getEnrichmentStats()` — Progress statistics
- `enrichBatch()` — Process N documents with rate limiting

---

## Files to Modify

### `lib/knowledge/search.js`

**Lines:** Full file (~170 lines)
**Change Type:** Add new functions alongside existing

**Add after `findSimilarDocuments` function:**

```javascript
// --- HYBRID SEARCH (NEW) ---

/**
 * Extract keywords from a query string
 * @param {string} query
 * @returns {string[]}
 */
function extractQueryKeywords(query) {
  const stopwords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'shall',
    'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in',
    'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
    'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'again', 'further', 'then', 'once',
    'here', 'there', 'when', 'where', 'why', 'how', 'all',
    'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because',
    'until', 'while', 'what', 'which', 'who', 'whom', 'this',
    'that', 'these', 'those', 'am', 'it', 'its', 'i', 'you',
    'he', 'she', 'they', 'we', 'me', 'him', 'her', 'them', 'us'
  ]);
  
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.has(word))
    .slice(0, 10);
}

/**
 * Search documents using hybrid scoring (vector + metadata)
 * @param {string} query - Search query
 * @param {Object} [options]
 * @param {number} [options.limit=10]
 * @param {number} [options.threshold=0.3]
 * @param {boolean} [options.trackRetrievals=true]
 * @param {number} [options.freshnessDecayDays=30]
 * @returns {Promise<Array>}
 */
export async function searchDocumentsHybrid(query, options = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const {
    limit = 10,
    threshold = 0.3,
    trackRetrievals = true,
    freshnessDecayDays = 30,
  } = options;

  // Generate embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Extract keywords
  const keywords = extractQueryKeywords(query);
  
  console.log(`[HybridSearch] Query: "${query.slice(0, 50)}...", Keywords: [${keywords.join(', ')}]`);

  // Call hybrid search RPC
  const { data, error } = await supabaseAdmin.rpc('search_documents_hybrid', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    query_keywords: keywords,
    match_count: limit,
    match_threshold: threshold,
    track_retrievals: trackRetrievals,
    freshness_decay_days: freshnessDecayDays,
  });

  if (error) {
    console.error('[HybridSearch] RPC error:', error);
    throw new Error(`Hybrid search failed: ${error.message}`);
  }

  console.log(`[HybridSearch] Found ${data?.length || 0} results`);

  // Track retrievals asynchronously (don't block response)
  if (trackRetrievals && data?.length > 0) {
    trackDocumentRetrievals(data.map(r => r.id), query).catch(err => {
      console.error('[HybridSearch] Tracking error:', err.message);
    });
  }

  return data || [];
}

/**
 * Track document retrievals for utility scoring
 * @param {string[]} documentIds
 * @param {string} query
 */
async function trackDocumentRetrievals(documentIds, query) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return;

  for (const docId of documentIds) {
    await supabaseAdmin.rpc('track_document_retrieval', {
      doc_id: docId,
      query_text: query.slice(0, 200),
    });
  }
}

/**
 * Find documents by named entity
 * @param {string} entityName
 * @param {Object} [options]
 * @param {string} [options.entityType] - Filter by type (people, organizations, etc.)
 * @param {number} [options.limit=10]
 * @returns {Promise<Array>}
 */
export async function findDocumentsByEntity(entityName, options = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { entityType = null, limit = 10 } = options;

  const { data, error } = await supabaseAdmin.rpc('find_documents_by_entity', {
    entity_name: entityName,
    entity_type: entityType,
    match_limit: limit,
  });

  if (error) {
    console.error('[EntitySearch] RPC error:', error);
    throw new Error(`Entity search failed: ${error.message}`);
  }

  return data || [];
}
```

**Reason:** Add hybrid search capability alongside existing vector search
**Tests:** `tests/integration/hybrid-search.test.js`

---

### `lib/knowledge/index.js`

**Change Type:** Add exports

**Add to exports:**
```javascript
export { 
  searchDocumentsHybrid, 
  findDocumentsByEntity 
} from './search.js';

export { 
  getUnenrichedDocuments, 
  getEnrichmentStats, 
  enrichBatch 
} from './enrich.js';
```

**Reason:** Make new functions available from module
**Tests:** Import verification

---

### `server.js`

**Change Type:** Modify existing endpoint, add new endpoints

**Modify `/api/knowledge/search` route:**
```javascript
// Update existing search endpoint to support hybrid mode
app.get('/api/knowledge/search', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    const { q, limit = 10, threshold = 0.5, hybrid = 'false' } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    
    const useHybrid = hybrid === 'true';
    
    if (useHybrid) {
      const results = await knowledge.searchDocumentsHybrid(q, {
        limit: parseInt(limit),
        threshold: parseFloat(threshold),
      });
      res.json({ 
        results, 
        query: { 
          original: q, 
          keywords: extractQueryKeywords(q),
          hybrid: true 
        } 
      });
    } else {
      // Existing vector-only search
      const results = await knowledge.searchDocuments(q, {
        limit: parseInt(limit),
        threshold: parseFloat(threshold),
      });
      res.json({ results, query: { original: q, hybrid: false } });
    }
  } catch (error) {
    console.error('[API] Search error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Add new endpoints:**
```javascript
// GET /api/knowledge/enrich/stats
app.get('/api/knowledge/enrich/stats', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    const stats = await knowledge.getEnrichmentStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/knowledge/enrich/batch
app.post('/api/knowledge/enrich/batch', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    const { batchSize = 10, operations } = req.body;
    const results = await knowledge.enrichBatch(batchSize, { operations });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/knowledge/entities/:name
app.get('/api/knowledge/entities/:name', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    const { name } = req.params;
    const { type, limit = 10 } = req.query;
    const results = await knowledge.findDocumentsByEntity(name, {
      entityType: type,
      limit: parseInt(limit),
    });
    res.json({ results, entity: { name, type } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Reason:** Expose hybrid search and enrichment via API
**Tests:** `tests/integration/api-knowledge.test.js`

---

## Files to Delete

None. This sprint adds capabilities, doesn't remove anything.

---

## Test Changes

### Tests to Create

| Test File | Tests | Verifies |
|-----------|-------|----------|
| `tests/integration/hybrid-search.test.js` | 5 | Hybrid scoring, keyword boost, tracking |
| `tests/integration/enrichment.test.js` | 3 | Stats, batch processing, rate limiting |

### Tests to Update

None — no existing knowledge tests to modify.

### Tests to Deprecate

None.

---

## Execution Order

1. **Create migration file** — `005_hybrid_search.sql`
2. **Verify:** Run SQL in Supabase SQL editor locally
3. **Create enrich module** — `lib/knowledge/enrich.js`
4. **Modify search module** — Add hybrid functions to `search.js`
5. **Update exports** — `lib/knowledge/index.js`
6. **Verify:** `node -e "import('./lib/knowledge/index.js')"`
7. **Modify server** — Add API endpoints
8. **Verify:** `curl http://localhost:3000/api/knowledge/search?q=test&hybrid=true`
9. **Create tests** — Integration tests
10. **Verify:** `npm test`

## Build Gates

After each phase:
```bash
npm run build
npm test
npm run dev  # Manual verification
```

## Rollback Plan

### If hybrid search fails:
1. Set `hybrid=false` as default in API
2. Existing `searchDocuments()` continues working
3. Users unaffected

### Full rollback:
```bash
# Revert server.js changes
git checkout HEAD -- server.js

# Revert search.js changes  
git checkout HEAD -- lib/knowledge/search.js

# Migration can stay (functions unused if not called)
```

## Verification Checklist

- [ ] `search_documents_hybrid` function exists in Supabase
- [ ] `searchDocumentsHybrid()` returns results with score breakdown
- [ ] `hybrid=true` parameter works on search endpoint
- [ ] `hybrid=false` returns existing format (backward compat)
- [ ] Enrichment stats endpoint returns accurate counts
- [ ] Batch enrichment processes documents with rate limiting
- [ ] No regressions in existing functionality
