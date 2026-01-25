-- Migration: 035_add_canonical_research_column
-- Sprint: S22-WP (research-writer-panel-v1)
-- Purpose: Add canonical_research JSONB column for 100% lossless structured output storage
--
-- S22-WP: The canonical_research field stores the FULL structured output from the
-- `deliver_research_results` tool, preserving every field returned by the AI provider.
-- This is the single source of truth for research results.
-- Refinement/consolidation into documents happens in the Writer phase (user-triggered).
--
-- DEX Pillar III: Provenance as Infrastructure
-- - All research data preserved exactly as returned
-- - No transformation or subsetting at storage layer

-- Add canonical_research column to research_sprouts table
ALTER TABLE public.research_sprouts
ADD COLUMN IF NOT EXISTS canonical_research JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.research_sprouts.canonical_research IS
'S22-WP: 100% lossless canonical research from structured API output (deliver_research_results tool). Single source of truth - refinement happens in Writer.';

-- Create index for JSONB queries (title, confidence level searches)
CREATE INDEX IF NOT EXISTS idx_research_sprouts_canonical_title
ON public.research_sprouts ((canonical_research->>'title'))
WHERE canonical_research IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_research_sprouts_canonical_confidence
ON public.research_sprouts ((canonical_research->'confidence_assessment'->>'level'))
WHERE canonical_research IS NOT NULL;
