-- Kinetic Pipeline Schema
-- Sprint: kinetic-pipeline-v1
-- Run this in Supabase SQL Editor

-- Enable pgvector extension (should already be done)
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'sapling'
    CHECK (tier IN ('seed', 'sprout', 'sapling', 'tree', 'grove')),
  tier_updated_at TIMESTAMPTZ DEFAULT now(),
  source_type TEXT DEFAULT 'upload',
  source_url TEXT,
  file_type TEXT,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  embedding_status TEXT DEFAULT 'pending'
    CHECK (embedding_status IN ('pending', 'processing', 'complete', 'error')),
  embedding_error TEXT,
  archived BOOLEAN DEFAULT false
);

-- Document chunks for embedding
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  char_start INTEGER NOT NULL,
  char_end INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, chunk_index)
);

-- Embeddings with pgvector (768 dimensions for Gemini)
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  model TEXT DEFAULT 'text-embedding-004',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for similarity search
CREATE INDEX IF NOT EXISTS embeddings_vector_idx
ON embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Suggested hubs from clustering
CREATE TABLE IF NOT EXISTS suggested_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_title TEXT NOT NULL,
  member_doc_ids UUID[] NOT NULL,
  centroid vector(768),
  cluster_quality FLOAT,
  algorithm TEXT DEFAULT 'hdbscan',
  computed_at TIMESTAMPTZ DEFAULT now(),
  input_doc_count INTEGER,
  title_override TEXT,
  frozen BOOLEAN DEFAULT false,
  force_include_ids UUID[],
  force_exclude_ids UUID[],
  status TEXT DEFAULT 'suggested'
    CHECK (status IN ('suggested', 'approved', 'rejected'))
);

-- Suggested journeys
CREATE TABLE IF NOT EXISTS suggested_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES suggested_hubs(id) ON DELETE CASCADE,
  suggested_title TEXT NOT NULL,
  node_doc_ids UUID[] NOT NULL,
  synthesis_method TEXT DEFAULT 'semantic',
  computed_at TIMESTAMPTZ DEFAULT now(),
  title_override TEXT,
  must_include_ids UUID[],
  must_exclude_ids UUID[],
  preferred_order UUID[],
  status TEXT DEFAULT 'suggested'
    CHECK (status IN ('suggested', 'approved', 'rejected'))
);

-- Knowledge graph edges
CREATE TABLE IF NOT EXISTS knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  target_doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  strength FLOAT NOT NULL,
  created_by TEXT DEFAULT 'system',
  method TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_doc_id, target_doc_id, relationship_type)
);

-- Pipeline run tracking
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  documents_processed INTEGER DEFAULT 0,
  clusters_created INTEGER DEFAULT 0,
  journeys_created INTEGER DEFAULT 0,
  errors TEXT[],
  status TEXT DEFAULT 'running'
    CHECK (status IN ('running', 'complete', 'error'))
);

-- Search function using vector similarity
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(768),
  match_count INT DEFAULT 10,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  JOIN documents d ON e.document_id = d.id
  WHERE d.archived = false
    AND d.tier IN ('sapling', 'tree', 'grove')
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Index for faster document lookups
CREATE INDEX IF NOT EXISTS documents_tier_idx ON documents(tier);
CREATE INDEX IF NOT EXISTS documents_embedding_status_idx ON documents(embedding_status);
CREATE INDEX IF NOT EXISTS documents_archived_idx ON documents(archived);
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx ON document_chunks(document_id);
