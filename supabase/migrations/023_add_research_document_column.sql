-- Add research_document column to research_sprouts
-- Sprint: S2-SFR-Display
-- Required for structured research document display in Finishing Room

ALTER TABLE public.research_sprouts
ADD COLUMN IF NOT EXISTS research_document JSONB;

COMMENT ON COLUMN public.research_sprouts.research_document
IS 'Research document content for display (S2-SFR-Display)';
