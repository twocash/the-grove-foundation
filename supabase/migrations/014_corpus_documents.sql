-- Corpus Documents Table
-- Sprint: knowledge-base-integration-v1
--
-- Research documents promoted from sprouts to the knowledge corpus.
-- Separate from the `documents` table which is used for RAG knowledge vault.
-- Uses JSONB meta+payload pattern for GroveObject compatibility.

-- =============================================================================
-- Create corpus_documents table
-- =============================================================================

CREATE TABLE IF NOT EXISTS corpus_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- GroveObject meta as JSONB (for flexibility)
  meta JSONB NOT NULL DEFAULT '{}',

  -- GroveObject payload as JSONB (contains full document)
  payload JSONB NOT NULL DEFAULT '{}',

  -- Timestamps (duplicated from meta for indexing)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Index on meta.status for filtering active documents
CREATE INDEX IF NOT EXISTS corpus_documents_status_idx
  ON corpus_documents((meta->>'status'));

-- Index on payload.provenance.sproutId for provenance lookup
CREATE INDEX IF NOT EXISTS corpus_documents_sprout_idx
  ON corpus_documents((payload->'provenance'->>'sproutId'));

-- Index on updated_at for sorting
CREATE INDEX IF NOT EXISTS corpus_documents_updated_idx
  ON corpus_documents(updated_at DESC);

-- =============================================================================
-- Updated_at trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_corpus_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS corpus_documents_updated_at_trigger ON corpus_documents;
CREATE TRIGGER corpus_documents_updated_at_trigger
  BEFORE UPDATE ON corpus_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_corpus_documents_updated_at();

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE corpus_documents IS 'Research documents promoted from sprouts to the knowledge corpus';
COMMENT ON COLUMN corpus_documents.meta IS 'GroveObject meta: { id, type, title, description, status, tags, createdBy, ... }';
COMMENT ON COLUMN corpus_documents.payload IS 'CorpusDocumentPayload: { query, position, analysis, citations, provenance, ... }';
