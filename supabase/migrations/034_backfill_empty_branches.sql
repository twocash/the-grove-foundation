-- Migration: 034_backfill_empty_branches.sql
-- Sprint: S22-WP (research-writer-panel-v1)
-- Purpose: Backfill branches for existing sprouts that have empty branches
--
-- Root Cause: Prior to the E2E testing improvements in S22-WP, some sprouts
-- were created with empty branches arrays, causing "zero API calls" during
-- research execution.
--
-- This migration creates a fallback "Main Research" branch for each affected
-- sprout using their original spark as the query.

-- =============================================================================
-- Step 1: Count affected sprouts (for verification)
-- =============================================================================

DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM public.research_sprouts
  WHERE branches = '[]'::jsonb
     OR branches IS NULL
     OR jsonb_array_length(branches) = 0;

  RAISE NOTICE 'Found % sprouts with empty branches that need backfill', affected_count;
END $$;

-- =============================================================================
-- Step 2: Backfill empty branches with fallback "Main Research" branch
-- =============================================================================

UPDATE public.research_sprouts
SET
  branches = jsonb_build_array(
    jsonb_build_object(
      'id', 'branch-main-' || EXTRACT(EPOCH FROM now())::bigint || '-' || SUBSTR(id::text, 1, 8),
      'label', 'Main Research',
      'queries', jsonb_build_array(COALESCE(spark, title, notes, 'Research query')),
      'priority', 'primary',
      'status', 'pending'
    )
  ),
  updated_at = now()
WHERE branches = '[]'::jsonb
   OR branches IS NULL
   OR jsonb_array_length(branches) = 0;

-- =============================================================================
-- Step 3: Verify the migration
-- =============================================================================

DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM public.research_sprouts
  WHERE branches = '[]'::jsonb
     OR branches IS NULL
     OR jsonb_array_length(branches) = 0;

  IF remaining_count > 0 THEN
    RAISE WARNING 'Migration incomplete: % sprouts still have empty branches', remaining_count;
  ELSE
    RAISE NOTICE 'Migration complete: All sprouts now have at least one branch';
  END IF;
END $$;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE public.research_sprouts IS
'Research sprouts - agent-driven research investigations.
Migration 034 ensures all sprouts have at least one branch for research execution.';
