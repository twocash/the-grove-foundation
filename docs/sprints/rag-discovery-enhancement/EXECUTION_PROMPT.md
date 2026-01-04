# Execution Prompt — rag-discovery-enhancement-v1

## Context

The Knowledge Pipeline has complete enrichment infrastructure (keywords, entities, utility scores, temporal classification) but the search system ignores all of it. This sprint adds **hybrid search** that combines vector similarity with enrichment metadata to deliver more relevant results.

**The core problem:** When a user asks "How does Raft consensus work?", documents with explicit "Raft" keywords should rank higher than pure semantic matches. Currently they don't.

## Attention Anchoring Protocol

**Before any major decision, re-read:**
1. SPEC.md Live Status block
2. SPEC.md Attention Anchor block

**After every 10 tool calls:**
- Check: Am I still pursuing hybrid search implementation?
- If uncertain: Re-read SPEC.md Goals and Acceptance Criteria

**Before committing:**
- Verify: Does this change satisfy the acceptance criteria?

## Documentation

Sprint documentation in `docs/sprints/rag-discovery-enhancement/`:
- `SPEC.md` — Goals, acceptance criteria, scope boundaries
- `ARCHITECTURE.md` — System design, API contracts, data structures
- `MIGRATION_MAP.md` — File-by-file changes with code samples
- `DECISIONS.md` — ADRs explaining key choices
- `SPRINTS.md` — Epic breakdown with build gates

## Repository Intelligence

Key locations:
- `lib/knowledge/search.js` — Current search (extend this)
- `lib/knowledge/index.js` — Module exports (add new exports)
- `lib/embeddings.js` — Embedding generation (unchanged)
- `server.js` — API endpoints (add hybrid parameter)
- `supabase/migrations/` — Database migrations (create 005)

## DEX Compliance Rules

- NO hardcoded domain logic (weights are exception for MVP, noted in comments)
- Behavior in config, engine interprets
- Test behavior, not implementation
- Preserve backward compatibility (strangler fig pattern)

## Execution Order

### Phase 1: Database Functions

Create `supabase/migrations/005_hybrid_search.sql`:

```sql
-- Migration: 005_hybrid_search.sql
-- Sprint: rag-discovery-enhancement-v1
-- Purpose: Add hybrid search, retrieval tracking, and entity search functions

-- DEX NOTE: Weights hardcoded for MVP. Future sprint will move to search_config table.
-- Default weights: vector=0.50, keyword=0.25, utility=0.15, freshness=0.10
-- Temporal weights: evergreen=1.0, current=1.0, dated=0.7, historical=0.5

-- 1. Hybrid Search Function
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
      1 - (e.embedding <=> query_embedding) AS vector_sim,
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
      CASE 
        WHEN d.utility_score IS NULL OR d.utility_score <= 0 THEN 0
        ELSE LN(d.utility_score + 1) / LN(10 + 1)
      END AS util_boost,
      1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - d.created_at)) / (freshness_decay_days * 86400)) AS fresh_boost,
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
    (s.vector_sim * 0.50 + s.kw_score * 0.25 + s.util_boost * 0.15 + s.fresh_boost * 0.10) * s.temp_weight AS final_score,
    s.keywords,
    s.temporal_class
  FROM scored s
  ORDER BY final_score DESC
  LIMIT match_count;
END;
$$;

-- 2. Retrieval Tracking Function
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

-- 3. Entity Search Function
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

**Verify:**
```bash
# Run migration locally
cd supabase && supabase db push

# Or paste SQL directly in Supabase SQL editor
# Then verify functions exist:
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%hybrid%' OR routine_name LIKE '%track%' OR routine_name LIKE '%entity%';
```

### Phase 2: Search Module

Modify `lib/knowledge/search.js` to add hybrid search functions.

**Add after existing `findSimilarDocuments` function (around line 100):**

```javascript
// --- HYBRID SEARCH ---
// Sprint: rag-discovery-enhancement-v1

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of',
  'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am',
  'it', 'its', 'i', 'you', 'he', 'she', 'they', 'we', 'me', 'him', 'her',
  'them', 'us'
]);

/**
 * Extract keywords from a query string
 */
export function extractQueryKeywords(query) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word))
    .slice(0, 10);
}

/**
 * Search documents using hybrid scoring (vector + metadata)
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

  const queryEmbedding = await generateEmbedding(query);
  const keywords = extractQueryKeywords(query);
  
  console.log(`[HybridSearch] Query: "${query.slice(0, 50)}...", Keywords: [${keywords.join(', ')}]`);

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

  // Track retrievals asynchronously
  if (trackRetrievals && data?.length > 0) {
    trackDocumentRetrievals(data.map(r => r.id), query).catch(err => {
      console.error('[HybridSearch] Tracking error:', err.message);
    });
  }

  return data || [];
}

/**
 * Track document retrievals for utility scoring (fire-and-forget)
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

**Update `lib/knowledge/index.js` exports:**

```javascript
export { 
  searchDocuments,
  searchDocumentsHybrid,
  findSimilarDocuments,
  findDocumentsByEntity,
  extractQueryKeywords,
} from './search.js';
```

**Verify:**
```bash
node -e "import('./lib/knowledge/index.js').then(m => console.log('searchDocumentsHybrid' in m))"
# Should print: true
```

### Phase 3: Bulk Enrichment

Create `lib/knowledge/enrich.js`:

```javascript
// lib/knowledge/enrich.js
// Bulk enrichment pipeline for document corpus
// Sprint: rag-discovery-enhancement-v1

import { getSupabaseAdmin } from '../supabase.js';

/**
 * Get documents needing enrichment
 */
export async function getUnenrichedDocuments(limit = 10) {
  const supabaseAdmin = getSupabaseAdmin();
  
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('id, title, content, tier, enriched_at, keywords, summary')
    .eq('embedding_status', 'complete')
    .eq('archived', false)
    .is('enriched_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to get unenriched docs: ${error.message}`);
  return data || [];
}

/**
 * Get enrichment progress statistics
 */
export async function getEnrichmentStats() {
  const supabaseAdmin = getSupabaseAdmin();
  
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('id, enriched_at, embedding_status, archived')
    .eq('archived', false);

  if (error) throw new Error(`Failed to get stats: ${error.message}`);

  const docs = data || [];
  const embedded = docs.filter(d => d.embedding_status === 'complete');
  const enriched = docs.filter(d => d.enriched_at !== null);

  return {
    total: docs.length,
    embedded: embedded.length,
    enriched: enriched.length,
    unenriched: embedded.length - enriched.length,
    enrichmentRate: embedded.length > 0 
      ? Math.round((enriched.length / embedded.length) * 100) 
      : 0,
  };
}

/**
 * Enrich a batch of documents
 */
export async function enrichBatch(batchSize = 10, options = {}) {
  const {
    operations = ['keywords', 'summary', 'entities', 'type', 'questions', 'freshness'],
    onProgress = null,
  } = options;

  const docs = await getUnenrichedDocuments(batchSize);
  
  if (docs.length === 0) {
    return { processed: 0, errors: [], message: 'No documents need enrichment' };
  }

  const results = { processed: 0, errors: [], enriched: [] };

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    
    try {
      // Note: enrichDocument implementation depends on existing enrichment logic
      // This is a placeholder - actual implementation uses server-side enrichment
      results.processed++;
      results.enriched.push({ id: doc.id, title: doc.title });
      
      if (onProgress) {
        onProgress({ current: i + 1, total: docs.length, doc: doc.title, success: true });
      }

      // Rate limit: 1 second between docs
      if (i < docs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      results.errors.push({ id: doc.id, title: doc.title, error: error.message });
    }
  }

  return results;
}
```

**Update `lib/knowledge/index.js`:**

```javascript
export { 
  getUnenrichedDocuments,
  getEnrichmentStats,
  enrichBatch,
} from './enrich.js';
```

### Phase 4: API Integration

Modify `server.js` to add hybrid search support and enrichment endpoints.

**Update existing `/api/knowledge/search` endpoint:**

Find the existing search endpoint and replace/modify to:

```javascript
// GET /api/knowledge/search - Enhanced with hybrid mode
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
          keywords: knowledge.extractQueryKeywords(q),
          hybrid: true 
        } 
      });
    } else {
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

**Add new endpoints (after existing knowledge endpoints):**

```javascript
// GET /api/knowledge/enrich/stats
app.get('/api/knowledge/enrich/stats', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    const stats = await knowledge.getEnrichmentStats();
    res.json(stats);
  } catch (error) {
    console.error('[API] Enrich stats error:', error);
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
    console.error('[API] Enrich batch error:', error);
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
    console.error('[API] Entity search error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Verify:**
```bash
npm run dev

# Test hybrid search
curl "http://localhost:3000/api/knowledge/search?q=Raft%20consensus&hybrid=true"

# Test basic search (backward compat)
curl "http://localhost:3000/api/knowledge/search?q=test&hybrid=false"

# Test enrichment stats
curl "http://localhost:3000/api/knowledge/enrich/stats"

# Test entity search
curl "http://localhost:3000/api/knowledge/entities/Raft"
```

## Success Criteria

- [ ] `search_documents_hybrid` function exists and returns scored results
- [ ] Hybrid search returns score breakdown (similarity, keyword_score, etc.)
- [ ] `?hybrid=true` parameter works on search endpoint
- [ ] `?hybrid=false` returns existing format (backward compat)
- [ ] Retrieval tracking increments utility scores
- [ ] Enrichment stats endpoint returns accurate counts
- [ ] Entity search finds documents by entity name
- [ ] No regressions in existing functionality

## Forbidden Actions

- Do NOT modify the existing `searchDocuments()` function (add alongside it)
- Do NOT change default behavior (hybrid=false until validated)
- Do NOT add Terminal integration (strangler fig pattern)
- Do NOT add question embedding matching (deferred to future sprint)
- Do NOT add full-text search (separate enhancement)

## Troubleshooting

### If migration fails
1. Check Supabase connection
2. Verify pgvector extension is enabled
3. Check for existing function conflicts

### If hybrid search returns no results
1. Verify embeddings exist (`embedding_status = 'complete'`)
2. Lower threshold (try 0.2)
3. Check keywords are being extracted

### If tracking fails
1. Check document IDs are valid UUIDs
2. Verify RPC function exists
3. Check Supabase permissions

## Local Testing Workflow

```bash
# 1. Start dev server
npm run dev

# 2. Run migration (or paste SQL in Supabase dashboard)
cd supabase && supabase db push

# 3. Test hybrid search
curl "http://localhost:3000/api/knowledge/search?q=distributed%20systems&hybrid=true" | jq

# 4. Compare with basic search
curl "http://localhost:3000/api/knowledge/search?q=distributed%20systems&hybrid=false" | jq

# 5. Verify keyword boost
# Search for term that matches a document's keywords
curl "http://localhost:3000/api/knowledge/search?q=Raft&hybrid=true" | jq '.results[0].keyword_score'

# 6. Check enrichment stats
curl "http://localhost:3000/api/knowledge/enrich/stats" | jq
```

## DEVLOG Updates

After each phase, update `docs/sprints/rag-discovery-enhancement/DEVLOG.md`:

```markdown
### Phase N: {Name}
**Status:** ✅ Complete / 🔴 Blocked
**Completed:** {timestamp}
**Notes:** {any issues encountered}
```
