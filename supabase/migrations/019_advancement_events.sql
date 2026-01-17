-- Advancement Events Schema
-- Sprint: S7-SL-AutoAdvancement v1
-- Creates table for audit trail of tier advancements
--
-- PATTERN: Event sourcing audit log
-- Captures full provenance for every tier change (auto or manual)
-- Supports bulk rollback and operator override tracking

-- =============================================================================
-- Main Table: advancement_events
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.advancement_events (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  sprout_id UUID NOT NULL REFERENCES public.sprouts(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.advancement_rules(id) ON DELETE SET NULL, -- NULL for manual overrides

  -- Tier transition
  from_tier TEXT NOT NULL,
  to_tier TEXT NOT NULL,

  -- Evaluation provenance
  criteria_met JSONB NOT NULL DEFAULT '[]', -- Which criteria passed
  signal_values JSONB NOT NULL DEFAULT '{}', -- Full signal snapshot at evaluation time

  -- Event metadata
  event_type TEXT NOT NULL DEFAULT 'auto-advancement',
  -- event_type: 'auto-advancement' | 'manual-override' | 'bulk-rollback'

  operator_id TEXT, -- For manual overrides/rollbacks
  reason TEXT, -- Optional reason (required for manual operations)

  -- Rollback tracking
  rolled_back BOOLEAN NOT NULL DEFAULT false,
  rollback_event_id UUID REFERENCES public.advancement_events(id),

  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Primary index for sprout-based queries (audit trail)
CREATE INDEX IF NOT EXISTS idx_advancement_events_sprout
  ON public.advancement_events(sprout_id);

-- Index for rule-based queries (bulk rollback)
CREATE INDEX IF NOT EXISTS idx_advancement_events_rule
  ON public.advancement_events(rule_id)
  WHERE rule_id IS NOT NULL;

-- Index for timestamp ordering (recent events first)
CREATE INDEX IF NOT EXISTS idx_advancement_events_timestamp
  ON public.advancement_events(timestamp DESC);

-- Index for event type filtering
CREATE INDEX IF NOT EXISTS idx_advancement_events_type
  ON public.advancement_events(event_type);

-- Index for non-rolled-back events (valid audit trail)
CREATE INDEX IF NOT EXISTS idx_advancement_events_active
  ON public.advancement_events(sprout_id, timestamp DESC)
  WHERE rolled_back = false;

-- Index for operator-based queries
CREATE INDEX IF NOT EXISTS idx_advancement_events_operator
  ON public.advancement_events(operator_id)
  WHERE operator_id IS NOT NULL;

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.advancement_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all events (audit transparency)
CREATE POLICY "Allow read for all users" ON public.advancement_events
  FOR SELECT USING (true);

-- Allow inserts from system (batch job)
CREATE POLICY "Allow insert for authenticated users" ON public.advancement_events
  FOR INSERT WITH CHECK (true);

-- Allow updates (for marking rolled_back) from operators
CREATE POLICY "Allow update for authenticated users" ON public.advancement_events
  FOR UPDATE USING (true) WITH CHECK (true);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE public.advancement_events IS 'Audit trail for all tier advancement events (auto and manual)';
COMMENT ON COLUMN public.advancement_events.sprout_id IS 'Reference to the sprout that was advanced';
COMMENT ON COLUMN public.advancement_events.rule_id IS 'Reference to the rule that triggered advancement (NULL for manual)';
COMMENT ON COLUMN public.advancement_events.from_tier IS 'Tier before advancement';
COMMENT ON COLUMN public.advancement_events.to_tier IS 'Tier after advancement';
COMMENT ON COLUMN public.advancement_events.criteria_met IS 'JSONB array of criteria that passed evaluation';
COMMENT ON COLUMN public.advancement_events.signal_values IS 'JSONB snapshot of all signal values at evaluation time';
COMMENT ON COLUMN public.advancement_events.event_type IS 'Type: auto-advancement, manual-override, bulk-rollback';
COMMENT ON COLUMN public.advancement_events.operator_id IS 'ID of operator who performed manual action';
COMMENT ON COLUMN public.advancement_events.reason IS 'Reason for manual override/rollback';
COMMENT ON COLUMN public.advancement_events.rolled_back IS 'Whether this event was rolled back';
COMMENT ON COLUMN public.advancement_events.rollback_event_id IS 'Reference to the rollback event that undid this';

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get advancement history for a specific sprout
CREATE OR REPLACE FUNCTION get_sprout_advancement_history(p_sprout_id UUID)
RETURNS SETOF public.advancement_events AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.advancement_events
  WHERE sprout_id = p_sprout_id
  ORDER BY timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Get recent advancements (for operator dashboard)
CREATE OR REPLACE FUNCTION get_recent_advancements(p_limit INTEGER DEFAULT 100)
RETURNS SETOF public.advancement_events AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.advancement_events
  ORDER BY timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get events by rule (for bulk rollback)
CREATE OR REPLACE FUNCTION get_events_by_rule(
  p_rule_id UUID,
  p_hours_back INTEGER DEFAULT 24
)
RETURNS SETOF public.advancement_events AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.advancement_events
  WHERE rule_id = p_rule_id
    AND rolled_back = false
    AND timestamp > (now() - (p_hours_back || ' hours')::interval)
  ORDER BY timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Get latest advancement for a sprout (for TierBadge tooltip)
CREATE OR REPLACE FUNCTION get_latest_advancement(p_sprout_id UUID)
RETURNS public.advancement_events AS $$
DECLARE
  result public.advancement_events;
BEGIN
  SELECT * INTO result
  FROM public.advancement_events
  WHERE sprout_id = p_sprout_id
    AND rolled_back = false
  ORDER BY timestamp DESC
  LIMIT 1;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_sprout_advancement_history IS 'Get full advancement history for a sprout (audit trail)';
COMMENT ON FUNCTION get_recent_advancements IS 'Get recent advancement events for operator dashboard';
COMMENT ON FUNCTION get_events_by_rule IS 'Get events triggered by a specific rule (for bulk rollback)';
COMMENT ON FUNCTION get_latest_advancement IS 'Get the most recent advancement event for tooltip display';
