-- Quality Scoring Schema
-- Sprint: S10-SL-AICuration v1
-- Creates tables for AI-curated quality assessment system
--
-- Tables:
--   quality_scores: Individual quality assessments
--   quality_thresholds: Configurable threshold settings (GroveObject pattern)
--   quality_overrides: Manual override records

-- =============================================================================
-- Table 1: quality_scores
-- Stores quality assessments for sprouts/content
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.quality_scores (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target reference (what is being scored)
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,  -- 'sprout', 'research-sprout', 'document', etc.

  -- Multi-dimensional scores (0.0 to 1.0)
  accuracy NUMERIC(4,3) CHECK (accuracy >= 0 AND accuracy <= 1),
  utility NUMERIC(4,3) CHECK (utility >= 0 AND utility <= 1),
  novelty NUMERIC(4,3) CHECK (novelty >= 0 AND novelty <= 1),
  provenance NUMERIC(4,3) CHECK (provenance >= 0 AND provenance <= 1),

  -- Composite score (weighted average)
  composite_score NUMERIC(4,3) CHECK (composite_score >= 0 AND composite_score <= 1),

  -- Scoring metadata
  scoring_model TEXT NOT NULL DEFAULT 'default-v1',  -- Model used for scoring
  confidence NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1),

  -- Federation metadata (for cross-grove learning)
  federation_id UUID,
  source_grove TEXT,

  -- Reasoning/explanation
  reasoning JSONB,  -- { accuracy: "...", utility: "...", ... }

  -- Timestamps
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Table 2: quality_thresholds (GroveObject pattern)
-- Configurable quality threshold settings
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.quality_thresholds (
  -- Identity (UUID - GroveObject pattern)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- GroveObject pattern: meta + payload as JSONB
  meta JSONB NOT NULL,

  -- payload contains threshold configuration
  payload JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Table 3: quality_overrides
-- Manual override records for quality scores
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.quality_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Score reference
  score_id UUID NOT NULL REFERENCES public.quality_scores(id) ON DELETE CASCADE,

  -- Override values (null means no override for that dimension)
  override_accuracy NUMERIC(4,3) CHECK (override_accuracy IS NULL OR (override_accuracy >= 0 AND override_accuracy <= 1)),
  override_utility NUMERIC(4,3) CHECK (override_utility IS NULL OR (override_utility >= 0 AND override_utility <= 1)),
  override_novelty NUMERIC(4,3) CHECK (override_novelty IS NULL OR (override_novelty >= 0 AND override_novelty <= 1)),
  override_provenance NUMERIC(4,3) CHECK (override_provenance IS NULL OR (override_provenance >= 0 AND override_provenance <= 1)),
  override_composite NUMERIC(4,3) CHECK (override_composite IS NULL OR (override_composite >= 0 AND override_composite <= 1)),

  -- Override metadata
  reason TEXT NOT NULL,
  overridden_by TEXT,  -- user/operator ID

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Table 4: federated_learning_participation
-- Tracks grove participation in federated learning
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.federated_learning_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Grove identity
  grove_id TEXT NOT NULL UNIQUE,
  grove_name TEXT NOT NULL,

  -- Participation settings
  opt_in BOOLEAN NOT NULL DEFAULT false,
  share_scores BOOLEAN NOT NULL DEFAULT false,
  share_model_updates BOOLEAN NOT NULL DEFAULT false,

  -- Statistics
  scores_contributed INTEGER NOT NULL DEFAULT 0,
  model_updates_received INTEGER NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- quality_scores indexes
CREATE INDEX IF NOT EXISTS idx_quality_scores_target
  ON public.quality_scores(target_id, target_type);

CREATE INDEX IF NOT EXISTS idx_quality_scores_composite
  ON public.quality_scores(composite_score DESC);

CREATE INDEX IF NOT EXISTS idx_quality_scores_scored_at
  ON public.quality_scores(scored_at DESC);

CREATE INDEX IF NOT EXISTS idx_quality_scores_federation
  ON public.quality_scores(federation_id)
  WHERE federation_id IS NOT NULL;

-- quality_thresholds indexes
CREATE INDEX IF NOT EXISTS idx_quality_thresholds_meta_type
  ON public.quality_thresholds ((meta->>'type'));

CREATE INDEX IF NOT EXISTS idx_quality_thresholds_meta_status
  ON public.quality_thresholds ((meta->>'status'));

CREATE INDEX IF NOT EXISTS idx_quality_thresholds_updated_at
  ON public.quality_thresholds(updated_at DESC);

-- quality_overrides indexes
CREATE INDEX IF NOT EXISTS idx_quality_overrides_score_id
  ON public.quality_overrides(score_id);

-- federated_learning_participation indexes
CREATE INDEX IF NOT EXISTS idx_federated_learning_grove_id
  ON public.federated_learning_participation(grove_id);

CREATE INDEX IF NOT EXISTS idx_federated_learning_opt_in
  ON public.federated_learning_participation(opt_in)
  WHERE opt_in = true;

-- =============================================================================
-- Updated At Triggers
-- =============================================================================

-- quality_scores trigger
CREATE OR REPLACE FUNCTION update_quality_score_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quality_score_updated_at ON public.quality_scores;
CREATE TRIGGER trigger_quality_score_updated_at
  BEFORE UPDATE ON public.quality_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_quality_score_updated_at();

-- quality_thresholds trigger (GroveObject pattern)
CREATE OR REPLACE FUNCTION update_quality_threshold_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.meta = jsonb_set(NEW.meta, '{updatedAt}', to_jsonb(now()::text));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quality_threshold_updated_at ON public.quality_thresholds;
CREATE TRIGGER trigger_quality_threshold_updated_at
  BEFORE UPDATE ON public.quality_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION update_quality_threshold_updated_at();

-- federated_learning_participation trigger
CREATE OR REPLACE FUNCTION update_federated_learning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_federated_learning_updated_at ON public.federated_learning_participation;
CREATE TRIGGER trigger_federated_learning_updated_at
  BEFORE UPDATE ON public.federated_learning_participation
  FOR EACH ROW
  EXECUTE FUNCTION update_federated_learning_updated_at();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.federated_learning_participation ENABLE ROW LEVEL SECURITY;

-- Allow read for all users
CREATE POLICY "Allow read quality_scores" ON public.quality_scores
  FOR SELECT USING (true);
CREATE POLICY "Allow read quality_thresholds" ON public.quality_thresholds
  FOR SELECT USING (true);
CREATE POLICY "Allow read quality_overrides" ON public.quality_overrides
  FOR SELECT USING (true);
CREATE POLICY "Allow read federated_learning" ON public.federated_learning_participation
  FOR SELECT USING (true);

-- Allow all operations for now (tighten when admin auth implemented)
CREATE POLICY "Allow all quality_scores" ON public.quality_scores
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all quality_thresholds" ON public.quality_thresholds
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all quality_overrides" ON public.quality_overrides
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all federated_learning" ON public.federated_learning_participation
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get quality score for a target
CREATE OR REPLACE FUNCTION get_quality_score(p_target_id UUID)
RETURNS public.quality_scores AS $$
BEGIN
  RETURN (
    SELECT *
    FROM public.quality_scores
    WHERE target_id = p_target_id
    ORDER BY scored_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Get effective quality score (with overrides applied)
CREATE OR REPLACE FUNCTION get_effective_quality_score(p_target_id UUID)
RETURNS TABLE (
  accuracy NUMERIC(4,3),
  utility NUMERIC(4,3),
  novelty NUMERIC(4,3),
  provenance NUMERIC(4,3),
  composite_score NUMERIC(4,3),
  is_overridden BOOLEAN
) AS $$
DECLARE
  v_score public.quality_scores;
  v_override public.quality_overrides;
BEGIN
  -- Get base score
  SELECT * INTO v_score
  FROM public.quality_scores qs
  WHERE qs.target_id = p_target_id
  ORDER BY qs.scored_at DESC
  LIMIT 1;

  IF v_score IS NULL THEN
    RETURN;
  END IF;

  -- Get override if exists
  SELECT * INTO v_override
  FROM public.quality_overrides qo
  WHERE qo.score_id = v_score.id
  ORDER BY qo.created_at DESC
  LIMIT 1;

  -- Return effective values
  RETURN QUERY SELECT
    COALESCE(v_override.override_accuracy, v_score.accuracy),
    COALESCE(v_override.override_utility, v_score.utility),
    COALESCE(v_override.override_novelty, v_score.novelty),
    COALESCE(v_override.override_provenance, v_score.provenance),
    COALESCE(v_override.override_composite, v_score.composite_score),
    v_override IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Get active quality thresholds
CREATE OR REPLACE FUNCTION get_active_quality_thresholds()
RETURNS SETOF public.quality_thresholds AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.quality_thresholds
  WHERE meta->>'status' = 'active'
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Get federated learning participants
CREATE OR REPLACE FUNCTION get_federated_learning_participants()
RETURNS SETOF public.federated_learning_participation AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.federated_learning_participation
  WHERE opt_in = true
  ORDER BY grove_name ASC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE public.quality_scores IS 'Quality assessments with multi-dimensional scoring (accuracy, utility, novelty, provenance)';
COMMENT ON TABLE public.quality_thresholds IS 'Quality threshold configurations following GroveObject pattern (SINGLETON)';
COMMENT ON TABLE public.quality_overrides IS 'Manual override records for quality scores';
COMMENT ON TABLE public.federated_learning_participation IS 'Grove participation in federated quality learning';

COMMENT ON FUNCTION get_quality_score IS 'Get latest quality score for a target';
COMMENT ON FUNCTION get_effective_quality_score IS 'Get quality score with manual overrides applied';
COMMENT ON FUNCTION get_active_quality_thresholds IS 'Get all active quality threshold configurations';
COMMENT ON FUNCTION get_federated_learning_participants IS 'Get groves participating in federated learning';
