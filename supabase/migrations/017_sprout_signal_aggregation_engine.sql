-- Migration: 017_sprout_signal_aggregation_engine.sql
-- Sprint: S6-SL-ObservableSignals v1
-- Phase 2 of Observable Knowledge System EPIC
-- Epic 6: Aggregation Engine

-- ============================================================================
-- AGGREGATION REFRESH FUNCTION
-- Computes signal aggregations from raw events
-- ============================================================================

/**
 * Refresh aggregations for all sprouts or a specific sprout.
 *
 * Parameters:
 *   p_sprout_id  - Optional. If NULL, refresh all sprouts. Otherwise, only this sprout.
 *   p_period     - The aggregation period: 'all_time', 'last_30d', or 'last_7d'
 *
 * Usage:
 *   -- Refresh all sprouts for all_time
 *   SELECT refresh_sprout_aggregations(NULL, 'all_time');
 *
 *   -- Refresh specific sprout
 *   SELECT refresh_sprout_aggregations('uuid-here', 'all_time');
 */
CREATE OR REPLACE FUNCTION refresh_sprout_aggregations(
  p_sprout_id UUID DEFAULT NULL,
  p_period TEXT DEFAULT 'all_time'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_start_date TIMESTAMPTZ;
  v_sprout RECORD;
BEGIN
  -- Determine date range based on period
  CASE p_period
    WHEN 'last_7d' THEN
      v_start_date := now() - INTERVAL '7 days';
    WHEN 'last_30d' THEN
      v_start_date := now() - INTERVAL '30 days';
    ELSE
      v_start_date := '1970-01-01'::TIMESTAMPTZ;  -- all_time
  END CASE;

  -- Get unique sprout IDs from events (or specific sprout if provided)
  FOR v_sprout IN
    SELECT DISTINCT sprout_id
    FROM sprout_usage_events
    WHERE (p_sprout_id IS NULL OR sprout_id = p_sprout_id)
      AND created_at >= v_start_date
  LOOP
    -- Compute and upsert aggregation for this sprout
    INSERT INTO sprout_signal_aggregations (
      sprout_id,
      period,
      -- Retrieval signals
      view_count,
      retrieval_count,
      reference_count,
      search_appearances,
      -- Utility signals
      upvotes,
      downvotes,
      utility_score,
      export_count,
      promotion_count,
      refinement_count,
      -- Diversity signals
      unique_sessions,
      unique_users,
      unique_lenses,
      unique_hubs,
      unique_queries,
      diversity_index,
      -- Timeline
      first_event_at,
      last_event_at,
      days_active,
      -- Computed indicators
      quality_score,
      advancement_eligible,
      -- Metadata
      computed_at
    )
    SELECT
      v_sprout.sprout_id,
      p_period,
      -- Retrieval signals (counts by event type)
      COALESCE(SUM(CASE WHEN event_type = 'sprout_viewed' THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN event_type = 'sprout_retrieved' THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN event_type = 'sprout_referenced' THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN event_type = 'sprout_searched' THEN 1 ELSE 0 END), 0),
      -- Utility signals
      COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' AND (metadata->>'rating')::TEXT = 'up' THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' AND (metadata->>'rating')::TEXT = 'down' THEN 1 ELSE 0 END), 0),
      -- Utility score: (upvotes - downvotes) / total_votes, or 0 if no votes
      CASE
        WHEN COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' THEN 1 ELSE 0 END), 0) = 0 THEN 0
        ELSE (
          COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' AND (metadata->>'rating')::TEXT = 'up' THEN 1 ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' AND (metadata->>'rating')::TEXT = 'down' THEN 1 ELSE 0 END), 0)
        )::DECIMAL / COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' THEN 1 ELSE 0 END), 1)
      END,
      COALESCE(SUM(CASE WHEN event_type = 'sprout_exported' THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN event_type = 'sprout_promoted' THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN event_type = 'sprout_refined' THEN 1 ELSE 0 END), 0),
      -- Diversity signals (unique counts)
      COUNT(DISTINCT session_id),
      COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL),
      COUNT(DISTINCT provenance->>'lensId') FILTER (WHERE provenance->>'lensId' IS NOT NULL),
      COUNT(DISTINCT provenance->>'hubId') FILTER (WHERE provenance->>'hubId' IS NOT NULL),
      COUNT(DISTINCT provenance->>'queryHash') FILTER (WHERE provenance->>'queryHash' IS NOT NULL),
      -- Diversity index: weighted average of unique counts (normalized 0-1)
      -- Formula: (unique_sessions/10 + unique_lenses/5 + unique_hubs/5) / 3, capped at 1
      LEAST(
        (
          LEAST(COUNT(DISTINCT session_id)::DECIMAL / 10, 1) +
          LEAST(COUNT(DISTINCT provenance->>'lensId')::DECIMAL / 5, 1) +
          LEAST(COUNT(DISTINCT provenance->>'hubId')::DECIMAL / 5, 1)
        ) / 3,
        1
      ),
      -- Timeline
      MIN(created_at),
      MAX(created_at),
      COALESCE(EXTRACT(DAY FROM MAX(created_at) - MIN(created_at))::INTEGER + 1, 0),
      -- Quality score: weighted composite (0-1)
      -- Formula: 0.3*view_score + 0.3*utility_score + 0.2*diversity + 0.2*activity
      LEAST(
        (
          -- View score: views/50 capped at 1
          0.3 * LEAST(COALESCE(SUM(CASE WHEN event_type = 'sprout_viewed' THEN 1 ELSE 0 END), 0)::DECIMAL / 50, 1) +
          -- Utility score (already -1 to 1, normalize to 0-1)
          0.3 * (
            CASE
              WHEN COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' THEN 1 ELSE 0 END), 0) = 0 THEN 0.5
              ELSE (
                (
                  COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' AND (metadata->>'rating')::TEXT = 'up' THEN 1 ELSE 0 END), 0) -
                  COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' AND (metadata->>'rating')::TEXT = 'down' THEN 1 ELSE 0 END), 0)
                )::DECIMAL / COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' THEN 1 ELSE 0 END), 1) + 1
              ) / 2
            END
          ) +
          -- Diversity component
          0.2 * LEAST(
            (
              LEAST(COUNT(DISTINCT session_id)::DECIMAL / 10, 1) +
              LEAST(COUNT(DISTINCT provenance->>'lensId')::DECIMAL / 5, 1) +
              LEAST(COUNT(DISTINCT provenance->>'hubId')::DECIMAL / 5, 1)
            ) / 3,
            1
          ) +
          -- Activity component: days_active/30 capped at 1
          0.2 * LEAST(
            COALESCE(EXTRACT(DAY FROM MAX(created_at) - MIN(created_at))::DECIMAL / 30, 0),
            1
          )
        ),
        1
      ),
      -- Advancement eligible: quality_score >= 0.6 AND view_count >= 10
      (
        LEAST(
          (
            0.3 * LEAST(COALESCE(SUM(CASE WHEN event_type = 'sprout_viewed' THEN 1 ELSE 0 END), 0)::DECIMAL / 50, 1) +
            0.3 * CASE
              WHEN COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' THEN 1 ELSE 0 END), 0) = 0 THEN 0.5
              ELSE ((
                COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' AND (metadata->>'rating')::TEXT = 'up' THEN 1 ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' AND (metadata->>'rating')::TEXT = 'down' THEN 1 ELSE 0 END), 0)
              )::DECIMAL / COALESCE(SUM(CASE WHEN event_type = 'sprout_rated' THEN 1 ELSE 0 END), 1) + 1) / 2
            END +
            0.2 * LEAST((LEAST(COUNT(DISTINCT session_id)::DECIMAL / 10, 1) + LEAST(COUNT(DISTINCT provenance->>'lensId')::DECIMAL / 5, 1) + LEAST(COUNT(DISTINCT provenance->>'hubId')::DECIMAL / 5, 1)) / 3, 1) +
            0.2 * LEAST(COALESCE(EXTRACT(DAY FROM MAX(created_at) - MIN(created_at))::DECIMAL / 30, 0), 1)
          ),
          1
        ) >= 0.6
        AND COALESCE(SUM(CASE WHEN event_type = 'sprout_viewed' THEN 1 ELSE 0 END), 0) >= 10
      ),
      -- Metadata
      now()
    FROM sprout_usage_events
    WHERE sprout_id = v_sprout.sprout_id
      AND created_at >= v_start_date
    ON CONFLICT (sprout_id, period)
    DO UPDATE SET
      view_count = EXCLUDED.view_count,
      retrieval_count = EXCLUDED.retrieval_count,
      reference_count = EXCLUDED.reference_count,
      search_appearances = EXCLUDED.search_appearances,
      upvotes = EXCLUDED.upvotes,
      downvotes = EXCLUDED.downvotes,
      utility_score = EXCLUDED.utility_score,
      export_count = EXCLUDED.export_count,
      promotion_count = EXCLUDED.promotion_count,
      refinement_count = EXCLUDED.refinement_count,
      unique_sessions = EXCLUDED.unique_sessions,
      unique_users = EXCLUDED.unique_users,
      unique_lenses = EXCLUDED.unique_lenses,
      unique_hubs = EXCLUDED.unique_hubs,
      unique_queries = EXCLUDED.unique_queries,
      diversity_index = EXCLUDED.diversity_index,
      first_event_at = EXCLUDED.first_event_at,
      last_event_at = EXCLUDED.last_event_at,
      days_active = EXCLUDED.days_active,
      quality_score = EXCLUDED.quality_score,
      advancement_eligible = EXCLUDED.advancement_eligible,
      computed_at = EXCLUDED.computed_at;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Comment on function
COMMENT ON FUNCTION refresh_sprout_aggregations IS
  'Computes signal aggregations from raw events. Run periodically via cron or API call.';

-- ============================================================================
-- REFRESH ALL PERIODS HELPER
-- ============================================================================

/**
 * Refresh aggregations for all periods for a sprout or all sprouts.
 */
CREATE OR REPLACE FUNCTION refresh_all_aggregation_periods(
  p_sprout_id UUID DEFAULT NULL
)
RETURNS TABLE(period TEXT, sprouts_updated INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh all three periods
  RETURN QUERY
  SELECT 'all_time'::TEXT, refresh_sprout_aggregations(p_sprout_id, 'all_time');

  RETURN QUERY
  SELECT 'last_30d'::TEXT, refresh_sprout_aggregations(p_sprout_id, 'last_30d');

  RETURN QUERY
  SELECT 'last_7d'::TEXT, refresh_sprout_aggregations(p_sprout_id, 'last_7d');
END;
$$;

-- ============================================================================
-- TRIGGER FOR REAL-TIME UPDATES (Optional)
-- Updates aggregations when significant events occur
-- ============================================================================

/**
 * Trigger function to update aggregations on important events.
 * Only fires for high-value events to avoid excessive computation.
 */
CREATE OR REPLACE FUNCTION trigger_update_aggregation_on_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only update on high-value events (ratings, promotions, refinements)
  -- Views and retrievals are too frequent for real-time aggregation
  IF NEW.event_type IN ('sprout_rated', 'sprout_promoted', 'sprout_refined', 'sprout_exported') THEN
    -- Update all_time aggregation for this sprout only
    PERFORM refresh_sprout_aggregations(NEW.sprout_id, 'all_time');
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger (disabled by default - enable for real-time updates)
-- DROP TRIGGER IF EXISTS trg_update_aggregation_on_event ON sprout_usage_events;
-- CREATE TRIGGER trg_update_aggregation_on_event
--   AFTER INSERT ON sprout_usage_events
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_update_aggregation_on_event();

-- ============================================================================
-- CRON SCHEDULING (Supabase pg_cron)
-- ============================================================================

-- Uncomment these lines if pg_cron extension is available:
--
-- -- Refresh all_time aggregations every 15 minutes
-- SELECT cron.schedule(
--   'refresh-sprout-aggregations-all-time',
--   '*/15 * * * *',
--   $$SELECT refresh_sprout_aggregations(NULL, 'all_time')$$
-- );
--
-- -- Refresh last_7d aggregations every hour
-- SELECT cron.schedule(
--   'refresh-sprout-aggregations-7d',
--   '0 * * * *',
--   $$SELECT refresh_sprout_aggregations(NULL, 'last_7d')$$
-- );
--
-- -- Refresh last_30d aggregations every 6 hours
-- SELECT cron.schedule(
--   'refresh-sprout-aggregations-30d',
--   '0 */6 * * *',
--   $$SELECT refresh_sprout_aggregations(NULL, 'last_30d')$$
-- );

-- ============================================================================
-- API-CALLABLE RPC FUNCTION
-- ============================================================================

/**
 * API-callable function to refresh aggregations.
 * Can be called from Supabase client:
 *   await supabase.rpc('refresh_signal_aggregations', { period: 'all_time' })
 */
CREATE OR REPLACE FUNCTION refresh_signal_aggregations(
  sprout_id UUID DEFAULT NULL,
  period TEXT DEFAULT 'all_time'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  v_count := refresh_sprout_aggregations(sprout_id, period);

  RETURN jsonb_build_object(
    'success', true,
    'sprouts_updated', v_count,
    'period', period,
    'refreshed_at', now()
  );
END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON FUNCTION refresh_signal_aggregations IS
  'Migration 017: Aggregation engine for S6-SL-ObservableSignals v1';
