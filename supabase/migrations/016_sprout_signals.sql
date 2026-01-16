-- Migration: 016_sprout_signals.sql
-- Sprint: S6-SL-ObservableSignals v1
-- Phase 2 of Observable Knowledge System EPIC
-- "We're not building analytics. We're building the nervous system for emergent quality."

-- ============================================================================
-- SPROUT USAGE EVENTS TABLE
-- Append-only event log capturing all sprout interactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS sprout_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to sprout (not enforced to allow async/offline events)
  sprout_id UUID NOT NULL,

  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'sprout_viewed',
    'sprout_retrieved',
    'sprout_referenced',
    'sprout_searched',
    'sprout_rated',
    'sprout_exported',
    'sprout_promoted',
    'sprout_refined'
  )),

  -- Session tracking (anonymous)
  session_id TEXT NOT NULL,

  -- Optional authenticated user
  user_id UUID,

  -- Full provenance (DEX Pillar III)
  -- Tracks: lens, journey, hub, query context
  provenance JSONB NOT NULL DEFAULT '{}',

  -- Event-specific metadata
  -- Each event type has its own metadata schema
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comment on table purpose
COMMENT ON TABLE sprout_usage_events IS
  'Append-only event log for sprout usage signals. Phase 2 of Observable Knowledge System.';

-- ============================================================================
-- INDEXES FOR AGGREGATION QUERIES
-- Optimized for Phase 3 auto-advancement calculations
-- ============================================================================

-- Primary aggregation index: per-sprout by type over time
CREATE INDEX IF NOT EXISTS idx_sprout_events_sprout_type_time
  ON sprout_usage_events(sprout_id, event_type, created_at DESC);

-- Event type analysis: what types are most common?
CREATE INDEX IF NOT EXISTS idx_sprout_events_type_time
  ON sprout_usage_events(event_type, created_at DESC);

-- Session analysis: user journey tracking
CREATE INDEX IF NOT EXISTS idx_sprout_events_session
  ON sprout_usage_events(session_id, created_at DESC);

-- User analysis (for authenticated users)
CREATE INDEX IF NOT EXISTS idx_sprout_events_user
  ON sprout_usage_events(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Recent events (for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_sprout_events_recent
  ON sprout_usage_events(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Public read, session-based write
-- ============================================================================

ALTER TABLE sprout_usage_events ENABLE ROW LEVEL SECURITY;

-- Anyone can read events (analytics are public)
CREATE POLICY "Public read access" ON sprout_usage_events
  FOR SELECT
  USING (true);

-- Session-based write: any session can record events
-- This allows anonymous event tracking
CREATE POLICY "Session write access" ON sprout_usage_events
  FOR INSERT
  WITH CHECK (session_id IS NOT NULL);

-- ============================================================================
-- SIGNAL AGGREGATIONS TABLE
-- Pre-computed rollups for fast analytics and Phase 3 decisions
-- ============================================================================

CREATE TABLE IF NOT EXISTS sprout_signal_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The sprout being aggregated
  sprout_id UUID NOT NULL,

  -- Aggregation period
  period TEXT NOT NULL CHECK (period IN ('all_time', 'last_30d', 'last_7d')),

  -- Retrieval signals
  view_count INTEGER NOT NULL DEFAULT 0,
  retrieval_count INTEGER NOT NULL DEFAULT 0,
  reference_count INTEGER NOT NULL DEFAULT 0,
  search_appearances INTEGER NOT NULL DEFAULT 0,

  -- Utility signals
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  utility_score DECIMAL(5,4) NOT NULL DEFAULT 0, -- (up - down) / total, -1 to 1
  export_count INTEGER NOT NULL DEFAULT 0,
  promotion_count INTEGER NOT NULL DEFAULT 0,
  refinement_count INTEGER NOT NULL DEFAULT 0,

  -- Diversity signals
  unique_sessions INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  unique_lenses INTEGER NOT NULL DEFAULT 0,
  unique_hubs INTEGER NOT NULL DEFAULT 0,
  unique_queries INTEGER NOT NULL DEFAULT 0,
  diversity_index DECIMAL(5,4) NOT NULL DEFAULT 0, -- 0 to 1

  -- Timeline tracking
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  days_active INTEGER NOT NULL DEFAULT 0,

  -- Computed quality indicators (for Phase 3)
  quality_score DECIMAL(5,4) NOT NULL DEFAULT 0, -- Weighted composite, 0 to 1
  advancement_eligible BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint: one aggregation per sprout per period
  UNIQUE(sprout_id, period)
);

-- Comment on table purpose
COMMENT ON TABLE sprout_signal_aggregations IS
  'Pre-computed signal rollups per sprout. Powers analytics dashboards and Phase 3 auto-advancement.';

-- ============================================================================
-- AGGREGATION TABLE INDEXES
-- ============================================================================

-- Lookup by sprout
CREATE INDEX IF NOT EXISTS idx_aggregations_sprout
  ON sprout_signal_aggregations(sprout_id);

-- Find advancement-eligible sprouts (Phase 3 query)
CREATE INDEX IF NOT EXISTS idx_aggregations_eligible
  ON sprout_signal_aggregations(advancement_eligible, quality_score DESC)
  WHERE advancement_eligible = true;

-- Quality leaderboard
CREATE INDEX IF NOT EXISTS idx_aggregations_quality
  ON sprout_signal_aggregations(period, quality_score DESC);

-- Recent computations
CREATE INDEX IF NOT EXISTS idx_aggregations_computed
  ON sprout_signal_aggregations(computed_at DESC);

-- ============================================================================
-- AGGREGATION TABLE RLS
-- ============================================================================

ALTER TABLE sprout_signal_aggregations ENABLE ROW LEVEL SECURITY;

-- Public read for analytics
CREATE POLICY "Public read aggregations" ON sprout_signal_aggregations
  FOR SELECT
  USING (true);

-- Only system can write (via aggregation job)
-- In practice, this allows authenticated writes for the cron job
CREATE POLICY "Authenticated write aggregations" ON sprout_signal_aggregations
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get aggregation for a specific sprout and period
CREATE OR REPLACE FUNCTION get_sprout_signals(
  p_sprout_id UUID,
  p_period TEXT DEFAULT 'all_time'
)
RETURNS sprout_signal_aggregations
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM sprout_signal_aggregations
  WHERE sprout_id = p_sprout_id
    AND period = p_period;
$$;

-- Get top sprouts by quality score
CREATE OR REPLACE FUNCTION get_top_quality_sprouts(
  p_period TEXT DEFAULT 'all_time',
  p_limit INTEGER DEFAULT 10
)
RETURNS SETOF sprout_signal_aggregations
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM sprout_signal_aggregations
  WHERE period = p_period
  ORDER BY quality_score DESC
  LIMIT p_limit;
$$;

-- Get advancement-eligible sprouts
CREATE OR REPLACE FUNCTION get_eligible_for_advancement(
  p_period TEXT DEFAULT 'all_time'
)
RETURNS SETOF sprout_signal_aggregations
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM sprout_signal_aggregations
  WHERE period = p_period
    AND advancement_eligible = true
  ORDER BY quality_score DESC;
$$;

-- ============================================================================
-- SEED DATA: Create initial aggregation for existing sprouts
-- (This will be populated by the aggregation engine in Epic 6)
-- ============================================================================

-- No seed data needed - aggregations are computed from events

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE sprout_usage_events IS
  'Migration 016: Sprout usage signals for S6-SL-ObservableSignals v1';
