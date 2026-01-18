-- Add evidence column to research_sprouts
-- Sprint: Fix schema mismatch
-- The code expects evidence as a JSONB column, not a separate table

ALTER TABLE public.research_sprouts
ADD COLUMN IF NOT EXISTS evidence JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.research_sprouts.evidence IS 'Research evidence collected during execution (JSONB array)';
