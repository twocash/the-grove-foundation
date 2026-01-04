# RAG Discovery Enhancement Sprint
## Sprint: rag-discovery-enhancement-v1

**Version:** 0.2  
**Status:** PLANNING → READY FOR EXECUTION  
**Date:** January 4, 2026  
**Prerequisites:** pipeline-inspector-v1 (completed)

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 8: Ready for Execution |
| **Status** | 🟡 Ready for Execution |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-04T17:15:00Z |
| **Next Action** | Execute Epic 1: Create database functions |
| **Attention Anchor** | Re-read before starting execution |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Hybrid search that combines vector similarity with enrichment metadata (keywords, utility scores, temporal class)
- **Success looks like:** When user asks "How does Raft consensus work?", docs with explicit "Raft" keywords rank higher than pure semantic matches
- **We are NOT:** Building Terminal integration, question embedding matching, or full-text search (deferred)
- **Current phase:** Planning complete, generating execution artifacts
- **Next action:** Create REPO_AUDIT, ARCHITECTURE, MIGRATION_MAP, DECISIONS, SPRINTS, EXECUTION_PROMPT

---

## Domain Contract

**Applicable contract:** Bedrock Sprint Contract  
**Contract version:** 1.0  
**Additional requirements:** Knowledge Commons, No Gatekeeping, Quality Through Use

---

## Patterns Extended (MANDATORY)

**Per PROJECT_PATTERNS.md Phase 0 requirements:**

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Semantic search | `lib/knowledge/search.js` | Extend with hybrid scoring in `searchDocumentsHybrid()` |
| Database RPC | `search_documents` function | Add new `search_documents_hybrid` RPC alongside existing |
| Knowledge module | `lib/knowledge/index.js` | Export new hybrid functions from module |
| API endpoints | `server.js /api/knowledge/*` | Add `hybrid` parameter, maintain backward compat |

### New Patterns Proposed

**None required.** All needs met by extending existing patterns:
- Search function pattern already exists in `lib/knowledge/search.js`
- RPC pattern established with `search_documents`
- API routing established in `server.js`

This sprint adds capabilities to existing patterns rather than creating new architectural concepts.

### DEX Compliance Note

The scoring weights (vector=0.50, keyword=0.25, utility=0.15, freshness=0.10) and temporal decay values (dated=0.7, historical=0.5) are hardcoded for MVP. For full DEX compliance, these should become declarative configuration (admin-adjustable sliders) in a future sprint.

---

## Executive Summary

The Pipeline Monitor UI and database schema now support rich document enrichment (keywords, entities, summary, temporal_class, questions_answered, utility_score). The Copilot can extract this metadata via AI. **But retrieval doesn't use any of it yet.**

Current search is pure vector similarity:
```sql
SELECT ... FROM embeddings e
JOIN documents d ON e.document_id = d.id
WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
ORDER BY e.embedding <=> query_embedding
```

This sprint closes the loop: enrichment metadata should **improve RAG retrieval**, not just sit in the database for human curation.

---

## Problem Statement

### Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Database schema | ✅ Complete | keywords, entities, questions, temporal_class, utility_score |
| Enrichment API | ✅ Complete | `/api/knowledge/enrich` calls Gemini |
| Inspector UI | ✅ Complete | Can view/edit all enrichment fields |
| Copilot handlers | ✅ Complete | Extract, summarize, classify commands work |
| **Search function** | ❌ Vector-only | Doesn't use enrichment at all |
| **Retrieval scoring** | ❌ Basic | No quality weighting |
| **Keyword boosting** | ❌ Missing | Keywords extracted but unused |

### The Gap

A document might have:
- `keywords: ['distributed systems', 'consensus', 'Raft']`
- `questions_answered: ['How does Raft achieve consensus?']`
- `named_entities: { concepts: ['Byzantine fault tolerance'] }`
- `utility_score: 2.4` (frequently retrieved)
- `temporal_class: 'evergreen'`

When a user asks "How does Raft consensus work?", the current system:
1. Embeds the query
2. Finds documents with similar embeddings
3. **Ignores** the explicit keyword match on 'Raft'
4. **Ignores** the exact question match
5. **Ignores** that this doc has high utility score
6. **Ignores** that it's marked evergreen (timeless)

### The Opportunity

Hybrid retrieval can:
- Boost exact keyword matches (user says "Raft" → docs with `'Raft'` in keywords)
- Match questions (user question ≈ stored `questions_answered`)
- Weight by utility (frequently useful docs rank higher)
- Respect temporal context (prefer evergreen for fundamentals, current for news)
- Enable concept-based navigation (user clicks entity → find related docs)

---

## Vision Alignment

### From the Kinetic Stream Vision (KINETIC_STREAM_RESET_VISION_v2.md)

> "The backend uses `targetId` (if present) to bias RAG retrieval toward that node's neighborhood... This enables 'smart pivots' that feel contextually aware."

### From Foundation Refinery Requirements

> "Moving from pure vector similarity to relationship-aware traversal. This is where the real intelligence lives—understanding that Node A contradicts Node B, not just that they're semantically similar."

### From World Models Research

> "GraphRAG bridges semantic gaps using knowledge graphs, combining vector retrieval with relationship traversal. Adaptive patterns like Self-RAG, RAG-Fusion (multiple queries with reciprocal rank fusion)..."

### From Chronicler Cognitive Archaeology

> "Pattern mining identifies recurring cognitive patterns that produce insights... archaeology of understanding accumulates over time."

---

## Proposed Solution

### Tier 1: Hybrid Search Function (Must Have)

Create `search_documents_hybrid` that combines:

```
final_score = (
  vector_similarity * weights.vector +      -- Default: 0.50
  keyword_overlap_score * weights.keyword + -- Default: 0.25
  utility_boost * weights.utility +         -- Default: 0.15
  freshness_boost * weights.freshness       -- Default: 0.10
) * temporal_weight                         -- Decay dated content
```

**DEX Compliance Note:** These weights are hardcoded for MVP but should become declarative configuration in a future sprint. The vision is admin-adjustable sliders in Pipeline Monitor settings, stored in a `search_config` table or JSON config file.

**Implementation approach:**
1. New Supabase RPC function: `search_documents_hybrid`
2. Keyword overlap via `array_overlap()` on enriched keywords array
3. Utility boost: `ln(utility_score + 1) / ln(max_utility + 1)` (normalized)
4. Freshness boost: `1 / (1 + days_since_created/30)` (decay over 30 days)
5. Temporal weight: evergreen=1.0, current=1.0, dated=0.7, historical=0.5

**DEX Compliance Note:** Temporal weights are hardcoded for MVP. Future enhancement: declarative config with admin sliders to tune decay aggressiveness per corpus type (research vs news vs documentation).

### Tier 2: Retrieval Tracking (Must Have)

Enable the utility feedback loop:

1. Every search result returned → increment `retrieval_count`
2. Store unique queries in `retrieval_queries` array
3. Trigger auto-updates `utility_score` via existing database trigger
4. Track `last_retrieved_at` for freshness signals

### Tier 3: Query Enhancement (Should Have)

Leverage enrichment for smarter queries:

```typescript
// If query mentions a known entity, expand with related concepts
async function enhanceQueryWithEntities(query) {
  // Find documents whose entities match query terms
  const entityMatches = await findEntityMatches(query);
  
  // Extract related concepts from matched docs
  const relatedConcepts = entityMatches
    .flatMap(doc => doc.named_entities?.concepts || [])
    .slice(0, 5);
  
  return {
    original: query,
    enhanced: `${query} ${relatedConcepts.join(' ')}`,
    entityHits: entityMatches.length
  };
}
```

### Tier 4: Pivot Context (Future Sprint)

When Terminal highlights a concept and user clicks it:
```typescript
{
  type: 'pivot',
  targetText: 'Byzantine fault tolerance',
  sourceContext: 'The Raft algorithm avoids Byzantine assumptions...',
  entityMatch: true  // Tells retrieval to heavily weight entity matches
}
```

This is architectural setup—actual Terminal integration deferred.

---

## Technical Specification

### Epic 1: Hybrid Search Database Function

**Migration:** `005_hybrid_search.sql`

```sql
-- ============================================================================
-- Hybrid Search Function
-- Sprint: rag-discovery-enhancement-v1
-- ============================================================================

-- Enhanced search combining vector similarity with enrichment signals
CREATE OR REPLACE FUNCTION search_documents_hybrid(
  query_embedding vector(768),
  query_keywords TEXT[] DEFAULT '{}',
  match_count INT DEFAULT 10,
  match_threshold FLOAT DEFAULT 0.3,
  include_dated BOOLEAN DEFAULT true,
  freshness_days INT DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  tier TEXT,
  keywords TEXT[],
  temporal_class TEXT,
  vector_similarity FLOAT,
  keyword_score FLOAT,
  utility_score FLOAT,
  freshness_score FLOAT,
  final_score FLOAT
) AS $$
DECLARE
  max_utility FLOAT;
BEGIN
  -- Get max utility for normalization
  SELECT COALESCE(MAX(d.utility_score), 1) INTO max_utility FROM documents d;
  
  RETURN QUERY
  WITH base_scores AS (
    SELECT
      d.id,
      d.title,
      d.content,
      d.tier,
      d.keywords,
      d.temporal_class,
      d.utility_score AS doc_utility,
      d.created_at,
      -- Vector similarity (0-1)
      1 - (e.embedding <=> query_embedding) AS vec_sim
    FROM embeddings e
    JOIN documents d ON e.document_id = d.id
    WHERE d.archived = false
      AND d.tier IN ('sapling', 'tree', 'grove')
      AND e.chunk_id IS NULL  -- Document-level embedding only
  ),
  enriched_scores AS (
    SELECT
      bs.*,
      -- Keyword overlap score (0-1): fraction of query keywords found
      CASE 
        WHEN bs.keywords IS NULL OR array_length(query_keywords, 1) IS NULL THEN 0
        ELSE (
          SELECT COUNT(*)::FLOAT / GREATEST(array_length(query_keywords, 1), 1)
          FROM unnest(bs.keywords) k
          WHERE LOWER(k) = ANY(SELECT LOWER(unnest(query_keywords)))
        )
      END AS kw_score,
      -- Normalized utility (0-1)
      CASE 
        WHEN max_utility = 0 THEN 0
        ELSE ln(COALESCE(bs.doc_utility, 0) + 1) / ln(max_utility + 1)
      END AS util_norm,
      -- Freshness score (decays over freshness_days)
      1.0 / (1.0 + EXTRACT(EPOCH FROM (now() - bs.created_at)) / (freshness_days * 86400)) AS fresh_score,
      -- Temporal weight
      CASE bs.temporal_class
        WHEN 'evergreen' THEN 1.0
        WHEN 'current' THEN 1.0
        WHEN 'dated' THEN 0.7
        WHEN 'historical' THEN 0.5
        ELSE 1.0
      END AS temp_weight
    FROM base_scores bs
  )
  SELECT
    es.id,
    es.title,
    es.content,
    es.tier,
    es.keywords,
    es.temporal_class,
    es.vec_sim AS vector_similarity,
    es.kw_score AS keyword_score,
    es.doc_utility AS utility_score,
    es.fresh_score AS freshness_score,
    -- Final weighted score
    (
      es.vec_sim * 0.50 +      -- Vector similarity: 50%
      es.kw_score * 0.25 +     -- Keyword match: 25%
      es.util_norm * 0.15 +    -- Utility signal: 15%
      es.fresh_score * 0.10    -- Freshness: 10%
    ) * es.temp_weight AS final_score
  FROM enriched_scores es
  WHERE es.vec_sim > match_threshold
    AND (include_dated OR es.temporal_class IN ('evergreen', 'current'))
  ORDER BY final_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Retrieval Tracking Function
-- ============================================================================

CREATE OR REPLACE FUNCTION track_document_retrieval(
  doc_id UUID,
  query_text TEXT
)
RETURNS void AS $$
DECLARE
  truncated_query TEXT;
BEGIN
  -- Truncate query to prevent bloat
  truncated_query := LEFT(query_text, 200);
  
  UPDATE documents
  SET
    retrieval_count = COALESCE(retrieval_count, 0) + 1,
    last_retrieved_at = now(),
    -- Add query if not already present (dedup)
    retrieval_queries = CASE
      WHEN truncated_query = ANY(COALESCE(retrieval_queries, '{}')) 
        THEN retrieval_queries
      ELSE array_append(
        -- Keep last 50 queries max
        COALESCE(retrieval_queries[array_length(retrieval_queries, 1) - 48:], '{}'),
        truncated_query
      )
    END
  WHERE id = doc_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Entity Search Helper
-- ============================================================================

CREATE OR REPLACE FUNCTION find_documents_by_entity(
  entity_name TEXT,
  entity_type TEXT DEFAULT NULL,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  entity_matches JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.named_entities AS entity_matches
  FROM documents d
  WHERE d.archived = false
    AND d.tier IN ('sapling', 'tree', 'grove')
    AND (
      -- Search across all entity types or specific type
      CASE 
        WHEN entity_type = 'people' THEN
          EXISTS (SELECT 1 FROM jsonb_array_elements_text(d.named_entities->'people') e WHERE LOWER(e) LIKE '%' || LOWER(entity_name) || '%')
        WHEN entity_type = 'organizations' THEN
          EXISTS (SELECT 1 FROM jsonb_array_elements_text(d.named_entities->'organizations') e WHERE LOWER(e) LIKE '%' || LOWER(entity_name) || '%')
        WHEN entity_type = 'concepts' THEN
          EXISTS (SELECT 1 FROM jsonb_array_elements_text(d.named_entities->'concepts') e WHERE LOWER(e) LIKE '%' || LOWER(entity_name) || '%')
        WHEN entity_type = 'technologies' THEN
          EXISTS (SELECT 1 FROM jsonb_array_elements_text(d.named_entities->'technologies') e WHERE LOWER(e) LIKE '%' || LOWER(entity_name) || '%')
        ELSE
          EXISTS (SELECT 1 FROM jsonb_array_elements_text(d.named_entities->'people') e WHERE LOWER(e) LIKE '%' || LOWER(entity_name) || '%')
          OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(d.named_entities->'organizations') e WHERE LOWER(e) LIKE '%' || LOWER(entity_name) || '%')
          OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(d.named_entities->'concepts') e WHERE LOWER(e) LIKE '%' || LOWER(entity_name) || '%')
          OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(d.named_entities->'technologies') e WHERE LOWER(e) LIKE '%' || LOWER(entity_name) || '%')
      END
    )
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION search_documents_hybrid IS 'Hybrid search combining vector similarity with keyword matching, utility signals, and temporal weighting';
COMMENT ON FUNCTION track_document_retrieval IS 'Increment retrieval count and track query for utility scoring';
COMMENT ON FUNCTION find_documents_by_entity IS 'Find documents containing a named entity';
```

### Epic 2: Search Module Enhancement

**File:** `lib/knowledge/search.js` - Add hybrid search export

```javascript
// Add to existing search.js

/**
 * Enhanced search using hybrid retrieval
 * Combines vector similarity with enrichment signals
 * 
 * @param {string} query - Search query
 * @param {Object} [options]
 * @param {number} [options.limit=10] - Maximum results
 * @param {number} [options.threshold=0.3] - Minimum vector similarity
 * @param {string[]} [options.keywords] - Explicit keywords to match
 * @param {boolean} [options.includeDated=true] - Include dated/historical content
 * @param {number} [options.freshnessDays=30] - Freshness decay period
 * @param {boolean} [options.trackRetrieval=true] - Track this search for utility
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
    keywords = null,
    includeDated = true,
    freshnessDays = 30,
    trackRetrieval = true,
    expand = true,
  } = options;

  // Expand query if enabled
  let searchQuery = query;
  if (expand && shouldExpandQuery(query)) {
    const expansion = await expandQuery(query);
    if (expansion.wasExpanded) {
      searchQuery = expansion.expanded;
    }
  }

  // Extract keywords from query if not provided
  const queryKeywords = keywords || extractQueryKeywords(searchQuery);

  // Generate query embedding
  console.log(`[Search:Hybrid] Query: "${searchQuery.slice(0, 50)}..." Keywords: [${queryKeywords.join(', ')}]`);
  const queryEmbedding = await generateEmbedding(searchQuery);

  // Call hybrid search RPC
  const { data, error } = await supabaseAdmin
    .rpc('search_documents_hybrid', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      query_keywords: queryKeywords,
      match_count: limit,
      match_threshold: threshold,
      include_dated: includeDated,
      freshness_days: freshnessDays,
    });

  if (error) {
    console.error('[Search:Hybrid] RPC error:', error);
    throw new Error(`Hybrid search failed: ${error.message}`);
  }

  const results = (data || []).map(row => ({
    id: row.id,
    title: row.title,
    snippet: row.content.slice(0, 300) + (row.content.length > 300 ? '...' : ''),
    tier: row.tier,
    keywords: row.keywords,
    temporalClass: row.temporal_class,
    scores: {
      vector: row.vector_similarity,
      keyword: row.keyword_score,
      utility: row.utility_score,
      freshness: row.freshness_score,
      final: row.final_score,
    },
  }));

  console.log(`[Search:Hybrid] Found ${results.length} results`);

  // Track retrievals asynchronously (don't block response)
  if (trackRetrieval && results.length > 0) {
    trackRetrievals(results.map(r => r.id), query).catch(err => {
      console.error('[Search:Hybrid] Tracking error:', err);
    });
  }

  return results;
}

/**
 * Track retrieval events for utility scoring
 * @param {string[]} documentIds
 * @param {string} query
 */
export async function trackRetrievals(documentIds, query) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return;

  for (const docId of documentIds) {
    try {
      await supabaseAdmin.rpc('track_document_retrieval', {
        doc_id: docId,
        query_text: query,
      });
    } catch (err) {
      // Log but don't throw - tracking is best-effort
      console.error(`[Search] Failed to track retrieval for ${docId}:`, err.message);
    }
  }
}

/**
 * Find documents by named entity
 * @param {string} entityName
 * @param {string} [entityType] - 'people', 'organizations', 'concepts', 'technologies'
 * @param {number} [limit=10]
 */
export async function findByEntity(entityName, entityType = null, limit = 10) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabaseAdmin
    .rpc('find_documents_by_entity', {
      entity_name: entityName,
      entity_type: entityType,
      match_count: limit,
    });

  if (error) {
    throw new Error(`Entity search failed: ${error.message}`);
  }

  return data || [];
}

/**
 * Extract keywords from query for matching
 * Simple extraction: significant words not in stoplist
 */
function extractQueryKeywords(query) {
  const stopwords = new Set([
    'what', 'how', 'does', 'the', 'and', 'for', 'with', 'this', 'that', 'from',
    'are', 'is', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'do',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'about',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
    'why', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only',
    'own', 'same', 'than', 'too', 'very', 'just', 'also', 'now', 'explain', 'tell',
    'describe', 'show', 'give', 'find', 'help', 'need', 'want', 'like', 'know',
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')  // Remove punctuation except hyphens
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w))
    .slice(0, 10);  // Max 10 keywords
}
```

### Epic 3: API Integration

**File:** `server.js` - Update search endpoint

```javascript
// Replace existing /api/knowledge/search handler

// Semantic search with hybrid retrieval
app.get('/api/knowledge/search', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { 
      q,
      limit,
      threshold,
      keywords,
      hybrid,
      includeDated,
      freshnessDays,
      trackRetrieval,
      expand,
    } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    // Use hybrid search by default, fall back to basic if explicitly disabled
    const useHybrid = hybrid !== 'false';
    
    const searchFn = useHybrid 
      ? knowledge.searchDocumentsHybrid 
      : knowledge.searchDocuments;

    const results = await searchFn(q, {
      limit: limit ? parseInt(limit, 10) : 10,
      threshold: threshold ? parseFloat(threshold) : useHybrid ? 0.3 : 0.5,
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : null,
      includeDated: includeDated !== 'false',
      freshnessDays: freshnessDays ? parseInt(freshnessDays, 10) : 30,
      trackRetrieval: trackRetrieval !== 'false',
      expand: expand !== 'false',
    });

    res.json({ 
      results,
      meta: {
        hybrid: useHybrid,
        query: q,
        resultCount: results.length,
      }
    });
  } catch (error) {
    console.error('[Knowledge] Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Entity-based document lookup
app.get('/api/knowledge/entities/:name', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { name } = req.params;
    const { type, limit } = req.query;

    const documents = await knowledge.findByEntity(
      name,
      type || null,
      limit ? parseInt(limit, 10) : 10
    );

    res.json({ 
      entity: name,
      type: type || 'all',
      documents 
    });
  } catch (error) {
    console.error('[Knowledge] Entity search error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Epic 4: Module Export Updates

**File:** `lib/knowledge/index.js` - Add new exports

```javascript
// Add to existing exports
export { 
  searchDocuments,
  searchDocumentsHybrid,  // New
  trackRetrievals,        // New
  findByEntity,           // New
  findSimilarDocuments,
  getContextForQuery,
} from './search.js';
```

---

### Epic 5: Bulk Enrichment Pipeline

**Purpose:** Backfill enrichment metadata for existing documents so hybrid search has data to work with.

**File:** `lib/knowledge/enrich.js` (new file)

```javascript
// lib/knowledge/enrich.js
// Bulk enrichment pipeline for document corpus
// Sprint: rag-discovery-enhancement-v1

import { getSupabaseAdmin } from '../supabase.js';

/**
 * Get documents needing enrichment
 * @param {number} limit - Max docs to return
 * @param {Object} [options]
 * @param {string[]} [options.operations] - Which operations to check for
 * @returns {Promise<Array>}
 */
export async function getUnenrichedDocuments(limit = 10, options = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Find docs that have embeddings but no enrichment
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
 * @returns {Promise<Object>}
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
 * @param {number} batchSize - Docs per batch
 * @param {Object} [options]
 * @param {string[]} [options.operations] - Operations to run
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<Object>} - Results summary
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

  const results = {
    processed: 0,
    errors: [],
    enriched: [],
  };

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    
    try {
      // Call existing enrichment logic
      const enrichmentResult = await enrichDocument(doc.id, operations);
      
      results.processed++;
      results.enriched.push({ id: doc.id, title: doc.title });
      
      if (onProgress) {
        onProgress({ 
          current: i + 1, 
          total: docs.length, 
          doc: doc.title,
          success: true,
        });
      }

      // Rate limit: 1 second between docs to avoid API limits
      if (i < docs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      results.errors.push({ id: doc.id, title: doc.title, error: error.message });
      
      if (onProgress) {
        onProgress({ 
          current: i + 1, 
          total: docs.length, 
          doc: doc.title,
          success: false,
          error: error.message,
        });
      }
    }
  }

  return results;
}

/**
 * Enrich a single document and save results
 * @param {string} documentId
 * @param {string[]} operations
 */
async function enrichDocument(documentId, operations) {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Get document content
  const { data: doc, error: fetchError } = await supabaseAdmin
    .from('documents')
    .select('id, title, content')
    .eq('id', documentId)
    .single();

  if (fetchError || !doc) {
    throw new Error(`Document not found: ${documentId}`);
  }

  // Import enrichment helpers from server
  // (These would be refactored into this module in production)
  const enrichmentModule = await import('../../server-enrichment.js');
  
  const updates = {
    enriched_at: new Date().toISOString(),
    enriched_by: 'bulk',
    enrichment_model: 'gemini-2.0-flash',
  };

  // Run each operation
  for (const op of operations) {
    try {
      switch (op) {
        case 'keywords':
          updates.keywords = await enrichmentModule.extractKeywords(doc.content, doc.title);
          break;
        case 'summary':
          updates.summary = await enrichmentModule.generateSummary(doc.content, doc.title);
          break;
        case 'entities':
          updates.named_entities = await enrichmentModule.extractEntities(doc.content);
          break;
        case 'type':
          updates.document_type = await enrichmentModule.classifyDocumentType(doc.content);
          break;
        case 'questions':
          updates.questions_answered = await enrichmentModule.suggestQuestions(doc.content, doc.title);
          break;
        case 'freshness':
          updates.temporal_class = await enrichmentModule.checkFreshness(doc.content);
          break;
      }
    } catch (error) {
      console.error(`[Enrich] ${op} failed for ${documentId}:`, error.message);
      // Continue with other operations
    }
  }

  // Save updates
  const { error: updateError } = await supabaseAdmin
    .from('documents')
    .update(updates)
    .eq('id', documentId);

  if (updateError) {
    throw new Error(`Failed to save enrichment: ${updateError.message}`);
  }

  return updates;
}
```

**API Endpoints:**

```javascript
// GET /api/knowledge/enrich/stats - Get enrichment progress
app.get('/api/knowledge/enrich/stats', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    const stats = await knowledge.getEnrichmentStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/knowledge/enrich/batch - Enrich a batch of documents
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
```

**Pipeline Monitor UI Addition:**

Add enrichment status card to dashboard showing:
- Total / Enriched / Unenriched counts
- Progress bar
- "Enrich Next N" button
- Operation checkboxes (for selective enrichment)

---

## Test Plan

### Unit Tests

```javascript
// tests/knowledge/hybrid-search.test.js

describe('Hybrid Search', () => {
  describe('extractQueryKeywords', () => {
    it('extracts significant words', () => {
      const keywords = extractQueryKeywords('How does Raft consensus work?');
      expect(keywords).toContain('raft');
      expect(keywords).toContain('consensus');
      expect(keywords).not.toContain('how');
      expect(keywords).not.toContain('does');
    });

    it('handles empty query', () => {
      expect(extractQueryKeywords('')).toEqual([]);
    });

    it('limits to 10 keywords', () => {
      const long = 'one two three four five six seven eight nine ten eleven twelve';
      expect(extractQueryKeywords(long).length).toBeLessThanOrEqual(10);
    });
  });

  describe('searchDocumentsHybrid', () => {
    it('returns results with score breakdown', async () => {
      const results = await searchDocumentsHybrid('test query');
      expect(results[0]).toHaveProperty('scores');
      expect(results[0].scores).toHaveProperty('vector');
      expect(results[0].scores).toHaveProperty('keyword');
      expect(results[0].scores).toHaveProperty('final');
    });

    it('boosts keyword matches', async () => {
      // Document with matching keyword should rank higher
      const results = await searchDocumentsHybrid('Raft consensus', {
        keywords: ['raft', 'consensus'],
      });
      // Verify keyword score > 0 for matching docs
    });

    it('respects includeDated option', async () => {
      const withDated = await searchDocumentsHybrid('test', { includeDated: true });
      const withoutDated = await searchDocumentsHybrid('test', { includeDated: false });
      // Verify dated documents excluded when false
    });
  });

  describe('trackRetrievals', () => {
    it('increments retrieval count', async () => {
      const docId = 'test-doc-id';
      const before = await getDocument(docId);
      await trackRetrievals([docId], 'test query');
      const after = await getDocument(docId);
      expect(after.retrieval_count).toBe(before.retrieval_count + 1);
    });
  });
});
```

### Integration Tests

```javascript
// tests/api/knowledge-search.test.js

describe('GET /api/knowledge/search', () => {
  it('uses hybrid search by default', async () => {
    const res = await request(app).get('/api/knowledge/search?q=test');
    expect(res.body.meta.hybrid).toBe(true);
  });

  it('falls back to basic search when hybrid=false', async () => {
    const res = await request(app).get('/api/knowledge/search?q=test&hybrid=false');
    expect(res.body.meta.hybrid).toBe(false);
  });

  it('accepts comma-separated keywords', async () => {
    const res = await request(app).get('/api/knowledge/search?q=test&keywords=foo,bar,baz');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/knowledge/entities/:name', () => {
  it('finds documents by entity name', async () => {
    const res = await request(app).get('/api/knowledge/entities/Raft');
    expect(res.body).toHaveProperty('documents');
  });

  it('filters by entity type', async () => {
    const res = await request(app).get('/api/knowledge/entities/Raft?type=concepts');
    expect(res.body.type).toBe('concepts');
  });
});
```

---

## Definition of Done

### Epic 1: Database Functions
- [ ] Migration `005_hybrid_search.sql` created
- [ ] `search_documents_hybrid` RPC returns scored results
- [ ] `track_document_retrieval` updates retrieval stats
- [ ] `find_documents_by_entity` searches entity JSONB
- [ ] All functions tested in Supabase SQL editor
- [ ] Indexes support efficient queries

### Epic 2: Search Module
- [ ] `searchDocumentsHybrid` function implemented
- [ ] `trackRetrievals` function implemented
- [ ] `findByEntity` function implemented
- [ ] `extractQueryKeywords` helper works correctly
- [ ] Module exports updated
- [ ] Unit tests pass

### Epic 3: API Integration
- [ ] `/api/knowledge/search` supports hybrid parameter
- [ ] `/api/knowledge/entities/:name` endpoint added
- [ ] Backward compatible (hybrid=true default)
- [ ] Integration tests pass

### Epic 4: Documentation
- [ ] API documentation updated
- [ ] Search scoring formula documented
- [ ] Migration instructions added

### Epic 5: Bulk Enrichment
- [ ] `lib/knowledge/enrich.js` created
- [ ] `getUnenrichedDocuments()` function works
- [ ] `getEnrichmentStats()` returns accurate counts
- [ ] `enrichBatch()` processes documents with rate limiting
- [ ] `/api/knowledge/enrich/stats` endpoint added
- [ ] `/api/knowledge/enrich/batch` endpoint added
- [ ] Errors don't crash batch (graceful degradation)

---

## Open Questions for Review

1. **Weight Distribution:** Is 50% vector / 25% keyword / 15% utility / 10% freshness the right balance? Should utility be higher since it's based on actual usage?

2. **Temporal Decay:** 0.7 for "dated" and 0.5 for "historical" is aggressive. Should these be configurable, or is aggressive decay appropriate for a knowledge system?

3. **Freshness Window:** 30-day decay seems reasonable for a research corpus. Should this be longer (90 days) or configurable per query?

4. **Keyword Extraction:** The simple stopword approach is naive. Should we use TF-IDF, entity recognition, or just rely on enriched keywords when available?

5. **Question Matching:** The spec doesn't implement `questions_answered` embedding comparison. This requires storing question embeddings separately. Defer to future sprint?

6. **Full-Text Search:** Should we add PostgreSQL `tsvector` full-text search for more sophisticated keyword matching? Adds complexity but enables phrase matching.

7. **Backward Compatibility:** Should `/api/knowledge/search` default to `hybrid=true` or require explicit opt-in? Current spec defaults to hybrid.

---

## Advisory Council Consultation

### Park (Technical Feasibility - Weight 10)
> Hybrid search is well-understood and the formula is reasonable. The weights are empirical—plan to tune based on user behavior. Question embedding comparison adds storage and latency; defer unless you have evidence it's needed.

### Adams (Engagement - Weight 8)
> Utility score creates a "rich get richer" dynamic. The freshness boost helps but may not be enough. Consider a "discovery boost" for documents that haven't been surfaced recently despite good enrichment.

### Buterin (Mechanism Design - Weight 6)
> Retrieval tracking is a signal that can be gamed if exposed. The 50-query limit helps. Consider rate-limiting tracking calls per session to prevent amplification attacks.

### Taylor (Community Dynamics - Weight 7)
> Usage signals are valuable but reflect the current community's interests, not potential value. Ensure new content has a path to visibility beyond just freshness decay.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hybrid search slower than pure vector | Medium | Medium | Benchmark; set query timeout; fall back if >500ms |
| Keyword extraction poor quality | Medium | Low | Prefer enriched keywords when available |
| Utility cold start problem | High | Low | Freshness boost ensures new docs visible |
| Regression in Terminal search quality | Low | High | Feature flag; A/B test before full rollout |
| Query tracking bloat | Medium | Low | Cap queries array at 50; truncate to 200 chars |

---

## Rollout Plan

### Local Testing First

```bash
# 1. Run migration locally
cd supabase
supabase db push  # Or run SQL directly in local Supabase

# 2. Test hybrid search function in SQL editor
SELECT * FROM search_documents_hybrid(
  '[0.1, 0.2, ...]'::vector,  -- Sample embedding
  ARRAY['test', 'keyword'],
  10,
  0.3,
  true,
  30
);

# 3. Start dev server
npm run dev

# 4. Test API endpoint
curl "http://localhost:3000/api/knowledge/search?q=test&hybrid=true"

# 5. Compare results
curl "http://localhost:3000/api/knowledge/search?q=test&hybrid=false"
```

### Validation Checklist (Before Production)

- [ ] Hybrid search returns results with score breakdown
- [ ] Keyword matches boost relevant docs (manual verification)
- [ ] Utility scores update when docs are retrieved
- [ ] Freshness boost visible for new docs
- [ ] Temporal weight applied correctly (check dated docs)
- [ ] Basic search still works (`hybrid=false`)
- [ ] No regressions in existing functionality

### Production Deployment

1. **Phase 1: Database** - Deploy migration to production Supabase
2. **Phase 2: Backend** - Deploy updated server.js with new endpoints
3. **Phase 3: Soft Launch** - Default to `hybrid=false`, test with `?hybrid=true`
4. **Phase 4: Full Rollout** - Switch default to `hybrid=true`
5. **Phase 5: Monitor** - Track search quality, tune weights if needed

---

*Draft v0.2 for review. Awaiting approval before Foundation Loop execution.*
