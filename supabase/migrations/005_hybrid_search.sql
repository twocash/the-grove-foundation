-- Migration: 005_hybrid_search.sql
-- Sprint: rag-discovery-enhancement-v1
-- Purpose: Add hybrid search, retrieval tracking, and entity search functions
--
-- This migration adds database functions to support hybrid search combining:
-- - Vector similarity (cosine distance)
-- - Keyword matching (partial match)
-- - Utility score boost (log-normalized)
-- - Freshness boost (decay function)
-- - Temporal weighting (content lifecycle)

-- =============================================================================
-- DEX Compliance Note
-- =============================================================================
-- Weights are hardcoded for MVP. Future sprint will move to search_config table.
-- Default weights: vector=0.50, keyword=0.25, utility=0.15, freshness=0.10
-- Temporal weights: evergreen=1.0, current=1.0, dated=0.7, historical=0.5

-- =============================================================================
-- 1. Hybrid Search Function
-- =============================================================================

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
      (1 - (e.embedding <=> query_embedding))::float AS vector_sim,
      -- Keyword score: fraction of query keywords that match document keywords
      (CASE
        WHEN d.keywords IS NULL OR array_length(query_keywords, 1) IS NULL THEN 0
        ELSE (
          SELECT COUNT(*)::float / GREATEST(array_length(query_keywords, 1), 1)
          FROM unnest(d.keywords) dk
          WHERE EXISTS (
            SELECT 1 FROM unnest(query_keywords) qk
            WHERE LOWER(dk) LIKE '%' || LOWER(qk) || '%'
          )
        )
      END)::float AS kw_score,
      -- Utility boost: log-normalized (0-1 range)
      (CASE
        WHEN d.utility_score IS NULL OR d.utility_score <= 0 THEN 0
        ELSE LN(d.utility_score + 1) / LN(10 + 1)
      END)::float AS util_boost,
      -- Freshness boost: decay function over days
      (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - d.created_at)) / (freshness_decay_days * 86400)))::float AS fresh_boost,
      -- Temporal weight: penalize dated/historical content
      (CASE d.temporal_class
        WHEN 'evergreen' THEN 1.0
        WHEN 'current' THEN 1.0
        WHEN 'dated' THEN 0.7
        WHEN 'historical' THEN 0.5
        ELSE 1.0
      END)::float AS temp_weight
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
    -- Final score: weighted combination * temporal weight
    ((s.vector_sim * 0.50 + s.kw_score * 0.25 + s.util_boost * 0.15 + s.fresh_boost * 0.10) * s.temp_weight)::float AS final_score,
    s.keywords,
    s.temporal_class
  FROM scored s
  ORDER BY final_score DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_documents_hybrid IS
'Hybrid search combining vector similarity with keyword matching, utility scores, freshness, and temporal weighting. Sprint: rag-discovery-enhancement-v1';

-- =============================================================================
-- 2. Retrieval Tracking Function
-- =============================================================================

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

COMMENT ON FUNCTION track_document_retrieval IS
'Track document retrieval for utility score computation. Stores truncated query (200 chars), max 50 unique queries. Sprint: rag-discovery-enhancement-v1';

-- =============================================================================
-- 3. Entity Search Function
-- =============================================================================

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

COMMENT ON FUNCTION find_documents_by_entity IS
'Find documents containing a specific named entity. Supports optional type filtering. Sprint: rag-discovery-enhancement-v1';

-- =============================================================================
-- Verification Query
-- =============================================================================

-- Run this after migration to verify functions exist:
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_name IN ('search_documents_hybrid', 'track_document_retrieval', 'find_documents_by_entity');
