-- Chunk Metadata for Knowledge Route Reconstruction
-- Sprint: S28-PIPE - Embedding metadata for provenance
--
-- Adds metadata JSONB column to document_chunks table.
-- Enables reverse-engineering knowledge routes from embedded content.
--
-- ID Chain Format: grove:lens:domain:path:template:writerConfig
-- Uses '_' placeholder for missing IDs.

-- Add metadata column to document_chunks
ALTER TABLE document_chunks
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add comment explaining the metadata structure
COMMENT ON COLUMN document_chunks.metadata IS 'Provenance metadata for knowledge route reconstruction. Schema: { idChain, groveId, lensId, cognitiveDomainId, experiencePathId, templateId, writerConfigId, researchConfigId, type, typeCode, status, confidenceScore, tags[], generatedAt, date }';

-- Create GIN index for JSONB queries (supports @> containment operator)
CREATE INDEX IF NOT EXISTS idx_chunks_metadata_gin
ON document_chunks USING gin (metadata);

-- Create B-tree indexes for common filter fields (faster for equality)
CREATE INDEX IF NOT EXISTS idx_chunks_metadata_grove
ON document_chunks ((metadata->>'groveId'))
WHERE metadata IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chunks_metadata_type
ON document_chunks ((metadata->>'typeCode'))
WHERE metadata IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chunks_metadata_domain
ON document_chunks ((metadata->>'cognitiveDomainId'))
WHERE metadata IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chunks_metadata_template
ON document_chunks ((metadata->>'templateId'))
WHERE metadata IS NOT NULL;

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_chunks_metadata_grove_type
ON document_chunks ((metadata->>'groveId'), (metadata->>'typeCode'))
WHERE metadata IS NOT NULL;
