-- Document Enrichment Schema Extension
-- Sprint: pipeline-inspector-v1 (Epic 1)
-- Authority: ADR-001-knowledge-commons-unification.md
--
-- This migration adds enrichment columns to support:
-- - Semantic extraction (keywords, entities, summary)
-- - Quality signals (utility score, retrieval tracking)
-- - Attribution chain (derived_from, derivatives)
-- - Editorial workflow (notes, enrichment tracking)

-- =============================================================================
-- Fix Legacy Tier Values (if any exist)
-- =============================================================================

-- Note: The schema already enforces canonical tiers via CHECK constraint
-- These updates fix any data that might have been inserted with legacy values
UPDATE documents SET tier = 'seed' WHERE tier = 'seedling';
UPDATE documents SET tier = 'tree' WHERE tier = 'oak';

-- =============================================================================
-- Provenance Tracking
-- =============================================================================

-- Source context (how the document was ingested)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS
  source_context JSONB DEFAULT '{}';
  -- Schema: { uploadedBy?, uploadSession?, originalPath?, capturedFrom? }

-- =============================================================================
-- Semantic Enrichment
-- =============================================================================

-- Keywords for hybrid retrieval
ALTER TABLE documents ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Summary for preview and embedding enhancement
ALTER TABLE documents ADD COLUMN IF NOT EXISTS summary TEXT;

-- Document type classification
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type TEXT
  CHECK (document_type IS NULL OR document_type IN ('research', 'tutorial', 'reference', 'opinion', 'announcement', 'transcript'));

-- Named entities (people, orgs, concepts, tech)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS
  named_entities JSONB DEFAULT '{}';
  -- Schema: { people: [], organizations: [], concepts: [], technologies: [] }

-- Questions this document answers (for retrieval optimization)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS questions_answered TEXT[];

-- Temporal classification (affects retrieval weighting)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS temporal_class TEXT DEFAULT 'evergreen'
  CHECK (temporal_class IS NULL OR temporal_class IN ('evergreen', 'current', 'dated', 'historical'));

-- =============================================================================
-- Usage Signals (Quality Through Use)
-- =============================================================================

-- Retrieval count (how often this doc is surfaced)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS retrieval_count INTEGER DEFAULT 0;

-- Queries that surface this document (for pattern analysis)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS retrieval_queries TEXT[];

-- Last retrieval timestamp
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_retrieved_at TIMESTAMPTZ;

-- Utility score (computed from retrieval patterns)
-- Formula: ln(retrieval_count + 1) * (1 + 0.1 * unique_query_count)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS utility_score FLOAT DEFAULT 0;

-- =============================================================================
-- Attribution Chain
-- =============================================================================

-- Parent documents (for derived/synthesized content)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS derived_from UUID[];

-- Child documents (auto-populated when this doc spawns derivatives)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS derivatives UUID[];

-- Sprouts that cite this document
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cited_by_sprouts UUID[];

-- =============================================================================
-- Editorial Workflow
-- =============================================================================

-- Curator notes
ALTER TABLE documents ADD COLUMN IF NOT EXISTS editorial_notes TEXT;

-- Enrichment tracking
ALTER TABLE documents ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS enriched_by TEXT
  CHECK (enriched_by IS NULL OR enriched_by IN ('copilot', 'manual', 'bulk'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS enrichment_model TEXT;

-- =============================================================================
-- Indexes for Retrieval Optimization
-- =============================================================================

-- GIN index for keyword array overlap queries
CREATE INDEX IF NOT EXISTS documents_keywords_idx
  ON documents USING gin(keywords);

-- B-tree index for temporal filtering
CREATE INDEX IF NOT EXISTS documents_temporal_class_idx
  ON documents(temporal_class);

-- B-tree index for utility-based sorting (DESC for top-utility first)
CREATE INDEX IF NOT EXISTS documents_utility_score_idx
  ON documents(utility_score DESC);

-- B-tree index for document type filtering
CREATE INDEX IF NOT EXISTS documents_document_type_idx
  ON documents(document_type);

-- =============================================================================
-- Utility Score Computation Trigger
-- =============================================================================

-- Function to automatically update utility score when retrieval_count changes
CREATE OR REPLACE FUNCTION update_document_utility()
RETURNS TRIGGER AS $$
BEGIN
  -- Formula: ln(retrieval_count + 1) * (1 + 0.1 * unique_query_count)
  -- This rewards both volume and diversity of queries
  NEW.utility_score := ln(COALESCE(NEW.retrieval_count, 0) + 1) *
    (1 + 0.1 * COALESCE(array_length(NEW.retrieval_queries, 1), 0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only fire when retrieval_count actually changes
DROP TRIGGER IF EXISTS documents_utility_trigger ON documents;
CREATE TRIGGER documents_utility_trigger
  BEFORE UPDATE ON documents
  FOR EACH ROW
  WHEN (OLD.retrieval_count IS DISTINCT FROM NEW.retrieval_count
    OR OLD.retrieval_queries IS DISTINCT FROM NEW.retrieval_queries)
  EXECUTE FUNCTION update_document_utility();

-- =============================================================================
-- Comments for documentation
-- =============================================================================

COMMENT ON COLUMN documents.keywords IS 'AI-extracted or manually curated keywords for hybrid retrieval';
COMMENT ON COLUMN documents.summary IS '2-3 sentence summary for preview and embedding enhancement';
COMMENT ON COLUMN documents.document_type IS 'Content classification: research, tutorial, reference, opinion, announcement, transcript';
COMMENT ON COLUMN documents.named_entities IS 'JSON: { people: [], organizations: [], concepts: [], technologies: [] }';
COMMENT ON COLUMN documents.questions_answered IS 'Questions this document answers (retrieval targets)';
COMMENT ON COLUMN documents.temporal_class IS 'Time sensitivity: evergreen, current, dated, historical';
COMMENT ON COLUMN documents.utility_score IS 'Computed from retrieval patterns - higher = more useful';
COMMENT ON COLUMN documents.derived_from IS 'UUIDs of parent documents';
COMMENT ON COLUMN documents.derivatives IS 'UUIDs of child documents (auto-populated)';
COMMENT ON COLUMN documents.cited_by_sprouts IS 'UUIDs of Sprouts that reference this document';
COMMENT ON COLUMN documents.enriched_by IS 'Source of enrichment: copilot, manual, or bulk';
