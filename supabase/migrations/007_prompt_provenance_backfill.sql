-- Migration: 007_prompt_provenance_backfill
-- Sprint: exploration-node-unification-v1
-- Purpose: Backfill provenance field for existing prompts
--
-- This migration adds default provenance to all prompts that don't have it.
-- All existing prompts are considered "authored" by the Grove Team.

-- Backfill provenance for prompts without it
UPDATE prompts
SET payload = jsonb_set(
  COALESCE(payload, '{}'::jsonb),
  '{provenance}',
  '{
    "type": "authored",
    "reviewStatus": "approved",
    "authorId": "system",
    "authorName": "Grove Team"
  }'::jsonb
)
WHERE payload->>'provenance' IS NULL
   OR payload->'provenance' IS NULL;

-- Log the number of rows updated (for verification)
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled provenance for % prompts', updated_count;
END $$;
