-- Migration: 006_prompt_telemetry.sql
-- Sprint: 4d-prompt-refactor-telemetry-v1
-- Purpose: Telemetry infrastructure for prompt performance tracking

-- =============================================================================
-- PROMPT TELEMETRY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS prompt_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'selection', 'completion', 'feedback', 'skip')),
  prompt_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Context snapshot
  context_stage TEXT CHECK (context_stage IN ('genesis', 'exploration', 'synthesis', 'advocacy')),
  context_lens_id TEXT,
  context_entropy FLOAT CHECK (context_entropy >= 0 AND context_entropy <= 1),
  context_interaction_count INTEGER DEFAULT 0,
  context_active_topics TEXT[] DEFAULT '{}',
  context_active_moments TEXT[] DEFAULT '{}',

  -- Scoring metadata (for impressions/selections)
  scoring_final_score FLOAT,
  scoring_rank INTEGER,
  scoring_stage_match BOOLEAN,
  scoring_lens_weight FLOAT,
  scoring_topic_weight FLOAT,
  scoring_moment_boost FLOAT,
  scoring_base_weight FLOAT,

  -- Outcome metrics (for completions)
  outcome_dwell_time_ms INTEGER,
  outcome_entropy_delta FLOAT,
  outcome_follow_up_prompt_id TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_prompt_telemetry_prompt_id ON prompt_telemetry(prompt_id);
CREATE INDEX idx_prompt_telemetry_session_id ON prompt_telemetry(session_id);
CREATE INDEX idx_prompt_telemetry_timestamp ON prompt_telemetry(timestamp DESC);
CREATE INDEX idx_prompt_telemetry_event_type ON prompt_telemetry(event_type);
CREATE INDEX idx_prompt_telemetry_lens ON prompt_telemetry(context_lens_id) WHERE context_lens_id IS NOT NULL;

-- Composite index for performance queries
CREATE INDEX idx_prompt_telemetry_performance ON prompt_telemetry(prompt_id, event_type, timestamp DESC);

-- =============================================================================
-- PROMPT PERFORMANCE VIEW (Aggregated Metrics)
-- =============================================================================

CREATE OR REPLACE VIEW prompt_performance AS
SELECT
  prompt_id,
  COUNT(*) FILTER (WHERE event_type = 'impression') as impressions,
  COUNT(*) FILTER (WHERE event_type = 'selection') as selections,
  COUNT(*) FILTER (WHERE event_type = 'completion') as completions,
  CASE
    WHEN COUNT(*) FILTER (WHERE event_type = 'impression') > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE event_type = 'selection')::NUMERIC /
      COUNT(*) FILTER (WHERE event_type = 'impression'),
      4
    )
    ELSE 0
  END as selection_rate,
  ROUND(AVG(outcome_entropy_delta) FILTER (WHERE event_type = 'completion')::NUMERIC, 4) as avg_entropy_delta,
  ROUND(AVG(outcome_dwell_time_ms) FILTER (WHERE event_type = 'completion')::NUMERIC, 0) as avg_dwell_time_ms,
  MAX(timestamp) as last_surfaced
FROM prompt_telemetry
GROUP BY prompt_id;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE prompt_telemetry ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for telemetry (no auth required)
CREATE POLICY "Allow anonymous telemetry inserts" ON prompt_telemetry
  FOR INSERT
  WITH CHECK (true);

-- Read access for service role only (admin queries)
CREATE POLICY "Service role can read telemetry" ON prompt_telemetry
  FOR SELECT
  USING (auth.role() = 'service_role');
