-- Add missing columns to research_sprouts
-- Sprint: Fix schema mismatch between code and database
-- The code expects these columns directly on the table

-- status_history - array of status change records
ALTER TABLE public.research_sprouts
ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]'::jsonb;

-- rating - user rating for the sprout
ALTER TABLE public.research_sprouts
ADD COLUMN IF NOT EXISTS rating INTEGER;

-- reviewed - whether the sprout has been reviewed
ALTER TABLE public.research_sprouts
ADD COLUMN IF NOT EXISTS reviewed BOOLEAN NOT NULL DEFAULT false;

-- requires_review - flag indicating sprout needs review
ALTER TABLE public.research_sprouts
ADD COLUMN IF NOT EXISTS requires_review BOOLEAN NOT NULL DEFAULT false;

-- research_document - the generated research document
ALTER TABLE public.research_sprouts
ADD COLUMN IF NOT EXISTS research_document JSONB;

COMMENT ON COLUMN public.research_sprouts.status_history IS 'History of status changes (JSONB array)';
COMMENT ON COLUMN public.research_sprouts.rating IS 'User rating (1-5)';
COMMENT ON COLUMN public.research_sprouts.reviewed IS 'Whether sprout has been reviewed by user';
COMMENT ON COLUMN public.research_sprouts.requires_review IS 'Flag indicating sprout needs user review';
COMMENT ON COLUMN public.research_sprouts.research_document IS 'Generated research document (JSONB)';
