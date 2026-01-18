-- Research Sprouts Schema - ROLLBACK
-- Sprint: sprout-research-v1, Phase 2d
-- This migration rolls back 010_research_sprouts.sql
--
-- WARNING: This will permanently delete all research sprout data!
-- Only use in development or when data loss is acceptable.

-- =============================================================================
-- Drop Tables (order matters due to foreign keys)
-- Dropping tables first removes triggers and policies automatically
-- =============================================================================

DROP TABLE IF EXISTS public.research_sprout_evidence CASCADE;
DROP TABLE IF EXISTS public.research_sprout_gate_decisions CASCADE;
DROP TABLE IF EXISTS public.research_sprout_status_history CASCADE;
DROP TABLE IF EXISTS public.research_sprouts CASCADE;

-- =============================================================================
-- Drop Functions (after tables are gone, no more dependencies)
-- =============================================================================

DROP FUNCTION IF EXISTS get_pending_sprouts(TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_sprout_status_counts(TEXT);
DROP FUNCTION IF EXISTS update_research_sprout_updated_at();

-- =============================================================================
-- Verification
-- =============================================================================

-- This query should return no rows if rollback was successful
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'research_sprouts'
  ) THEN
    RAISE EXCEPTION 'Rollback incomplete: research_sprouts table still exists';
  END IF;
END $$;
