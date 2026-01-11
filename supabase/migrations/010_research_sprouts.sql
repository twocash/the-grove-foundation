-- Research Sprouts Schema
-- Sprint: sprout-research-v1, Phase 2d
-- Creates tables for the Sprout Research System
--
-- PATTERN: INSTANCE (many active per grove)
-- Each grove can have multiple active research sprouts simultaneously.

-- =============================================================================
-- Main Table: research_sprouts
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.research_sprouts (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_id TEXT NOT NULL,
  parent_sprout_id UUID REFERENCES public.research_sprouts(id) ON DELETE SET NULL,
  spawn_depth INTEGER NOT NULL DEFAULT 0,

  -- Origin
  spark TEXT NOT NULL,
  title TEXT NOT NULL,
  creator_id TEXT,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Research Configuration (JSONB for flexibility)
  strategy JSONB NOT NULL DEFAULT '{"depth": "medium", "sourceTypes": ["academic", "practitioner", "primary"], "balanceMode": "balanced"}'::jsonb,
  branches JSONB NOT NULL DEFAULT '[]'::jsonb,
  applied_rule_ids TEXT[] NOT NULL DEFAULT '{}',
  inference_confidence REAL NOT NULL DEFAULT 0,

  -- Provenance Snapshot (DEX Pillar III)
  grove_config_snapshot JSONB NOT NULL,
  architect_session_id TEXT,

  -- Status (enforced via constraint)
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'paused', 'blocked', 'completed', 'archived')),

  -- Execution (JSONB for nested structure)
  execution JSONB,

  -- Results
  synthesis JSONB,
  child_sprout_ids UUID[] NOT NULL DEFAULT '{}',

  -- User Interaction
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),

  -- Review Flag
  requires_review BOOLEAN NOT NULL DEFAULT false
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_research_sprouts_grove_id
  ON public.research_sprouts(grove_id);

CREATE INDEX IF NOT EXISTS idx_research_sprouts_status
  ON public.research_sprouts(status);

CREATE INDEX IF NOT EXISTS idx_research_sprouts_grove_status
  ON public.research_sprouts(grove_id, status);

CREATE INDEX IF NOT EXISTS idx_research_sprouts_parent
  ON public.research_sprouts(parent_sprout_id)
  WHERE parent_sprout_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_research_sprouts_creator
  ON public.research_sprouts(creator_id)
  WHERE creator_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_research_sprouts_updated_at
  ON public.research_sprouts(updated_at DESC);

-- GIN index for tag search
CREATE INDEX IF NOT EXISTS idx_research_sprouts_tags
  ON public.research_sprouts USING GIN(tags);

-- Comments
COMMENT ON TABLE public.research_sprouts IS 'Research sprouts - agent-driven research investigations (INSTANCE pattern: many active per grove)';
COMMENT ON COLUMN public.research_sprouts.grove_id IS 'Grove this sprout belongs to';
COMMENT ON COLUMN public.research_sprouts.spark IS 'User''s original research question (verbatim)';
COMMENT ON COLUMN public.research_sprouts.grove_config_snapshot IS 'Snapshot of PromptArchitectConfig at creation time (provenance)';
COMMENT ON COLUMN public.research_sprouts.architect_session_id IS 'ID of the Prompt Architect intake session';

-- =============================================================================
-- Status History Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.research_sprout_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprout_id UUID NOT NULL REFERENCES public.research_sprouts(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  actor TEXT NOT NULL,
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_history_sprout_id
  ON public.research_sprout_status_history(sprout_id);

CREATE INDEX IF NOT EXISTS idx_status_history_transitioned_at
  ON public.research_sprout_status_history(transitioned_at DESC);

COMMENT ON TABLE public.research_sprout_status_history IS 'Status transition audit trail for research sprouts';

-- =============================================================================
-- Gate Decisions Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.research_sprout_gate_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprout_id UUID NOT NULL REFERENCES public.research_sprouts(id) ON DELETE CASCADE,
  gate_id TEXT NOT NULL,
  gate_type TEXT NOT NULL CHECK (gate_type IN ('intake', 'execution', 'review')),
  passed BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  score REAL,
  threshold REAL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gate_decisions_sprout_id
  ON public.research_sprout_gate_decisions(sprout_id);

CREATE INDEX IF NOT EXISTS idx_gate_decisions_gate_type
  ON public.research_sprout_gate_decisions(gate_type);

COMMENT ON TABLE public.research_sprout_gate_decisions IS 'Quality gate decision audit trail for research sprouts';

-- =============================================================================
-- Evidence Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.research_sprout_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprout_id UUID NOT NULL REFERENCES public.research_sprouts(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('academic', 'practitioner', 'primary', 'news')),
  content TEXT NOT NULL,
  relevance REAL NOT NULL CHECK (relevance >= 0 AND relevance <= 1),
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_sprout_id
  ON public.research_sprout_evidence(sprout_id);

CREATE INDEX IF NOT EXISTS idx_evidence_branch_id
  ON public.research_sprout_evidence(branch_id);

COMMENT ON TABLE public.research_sprout_evidence IS 'Research evidence collected by sprout branches';

-- =============================================================================
-- Updated At Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_research_sprout_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_research_sprout_updated_at ON public.research_sprouts;
CREATE TRIGGER trigger_research_sprout_updated_at
  BEFORE UPDATE ON public.research_sprouts
  FOR EACH ROW
  EXECUTE FUNCTION update_research_sprout_updated_at();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE public.research_sprouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sprout_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sprout_gate_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sprout_evidence ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all for now (will tighten when auth is implemented)
-- Service role bypasses RLS, anon needs explicit policies

CREATE POLICY "Allow all for authenticated users" ON public.research_sprouts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON public.research_sprout_status_history
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON public.research_sprout_gate_decisions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON public.research_sprout_evidence
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get active sprout counts by status for a grove
CREATE OR REPLACE FUNCTION get_sprout_status_counts(p_grove_id TEXT)
RETURNS TABLE (
  status TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT rs.status, COUNT(*) as count
  FROM public.research_sprouts rs
  WHERE rs.grove_id = p_grove_id
  GROUP BY rs.status
  ORDER BY rs.status;
END;
$$ LANGUAGE plpgsql;

-- Get pending sprouts for agent pickup
CREATE OR REPLACE FUNCTION get_pending_sprouts(
  p_grove_id TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS SETOF public.research_sprouts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.research_sprouts
  WHERE grove_id = p_grove_id
    AND status = 'pending'
  ORDER BY created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_sprout_status_counts IS 'Get sprout counts grouped by status for a grove';
COMMENT ON FUNCTION get_pending_sprouts IS 'Get pending sprouts ready for agent pickup';
