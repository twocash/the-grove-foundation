-- Add template_id column to research_sprouts
-- Sprint: S22-WP research-writer-panel-v1
-- Purpose: Store the selected output template ID for research execution
--
-- This column was missing, causing the template dropdown selection
-- to not persist to the database and not be applied to research.

ALTER TABLE public.research_sprouts
ADD COLUMN IF NOT EXISTS template_id TEXT;

COMMENT ON COLUMN public.research_sprouts.template_id IS 'Output template ID selected by user (e.g., ot-seed-deep-dive)';

-- Create index for template-based queries
CREATE INDEX IF NOT EXISTS idx_research_sprouts_template_id
  ON public.research_sprouts(template_id)
  WHERE template_id IS NOT NULL;
