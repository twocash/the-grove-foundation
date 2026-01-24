-- Migration: 032_nursery_table.sql
-- Sprint: S22-WP research-writer-panel-v1
-- Purpose: Store raw research + generated documents before promotion to Garden
--
-- DEX Compliance:
-- - Provenance: Full audit trail (sprout_id, template_id, created_at)
-- - Declarative: Schema-driven, no hardcoded logic
-- - Scalable: Standard table pattern, no custom behaviors

CREATE TABLE IF NOT EXISTS public.nursery (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to source sprout
  sprout_id UUID NOT NULL,

  -- Raw research artifacts (from Research Agent)
  research_evidence JSONB,           -- Full EvidenceBundle from research
  research_synthesis TEXT,           -- AI synthesis summary

  -- Writer configuration
  writer_template_id TEXT,           -- e.g., 'ot-seed-higher-ed'
  writer_template_name TEXT,         -- Denormalized for display
  user_notes TEXT,                   -- User's additional context/notes

  -- Generated output
  generated_document JSONB,          -- ResearchDocument from Writer Agent
  generated_document_text TEXT,      -- Plain text version for search

  -- Lifecycle status
  status TEXT NOT NULL DEFAULT 'provisional',  -- provisional | promoted | archived

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  promoted_at TIMESTAMPTZ,
  promoted_by UUID,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('provisional', 'promoted', 'archived'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_nursery_sprout_id ON public.nursery(sprout_id);
CREATE INDEX IF NOT EXISTS idx_nursery_status ON public.nursery(status);
CREATE INDEX IF NOT EXISTS idx_nursery_created_at ON public.nursery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nursery_template_id ON public.nursery(writer_template_id);

-- Full text search on generated document
CREATE INDEX IF NOT EXISTS idx_nursery_document_search
  ON public.nursery USING gin(to_tsvector('english', COALESCE(generated_document_text, '')));

-- Row Level Security
ALTER TABLE public.nursery ENABLE ROW LEVEL SECURITY;

-- Policies (start permissive, tighten later)
CREATE POLICY "nursery_read_all" ON public.nursery
  FOR SELECT USING (true);

CREATE POLICY "nursery_insert_all" ON public.nursery
  FOR INSERT WITH CHECK (true);

CREATE POLICY "nursery_update_all" ON public.nursery
  FOR UPDATE USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_nursery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nursery_updated_at
  BEFORE UPDATE ON public.nursery
  FOR EACH ROW
  EXECUTE FUNCTION update_nursery_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.nursery IS 'Provisional storage for research documents before Garden promotion';
COMMENT ON COLUMN public.nursery.sprout_id IS 'Source sprout that triggered the research';
COMMENT ON COLUMN public.nursery.research_evidence IS 'Full EvidenceBundle from Claude Deep Research API';
COMMENT ON COLUMN public.nursery.writer_template_id IS 'Output template used (e.g., ot-seed-higher-ed)';
COMMENT ON COLUMN public.nursery.generated_document IS 'ResearchDocument created by Writer Agent';
COMMENT ON COLUMN public.nursery.status IS 'provisional = pending review, promoted = in Garden, archived = discarded';
