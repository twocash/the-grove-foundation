-- Advancement Rules Schema
-- Sprint: S7-SL-AutoAdvancement v1
-- Creates table for GroveObject<AdvancementRulePayload>
--
-- PATTERN: INSTANCE (many active per grove)
-- Multiple advancement rules can be active simultaneously.
-- Follows the GroveObject pattern with meta + payload JSONB columns.

-- =============================================================================
-- Main Table: advancement_rules
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.advancement_rules (
  -- Identity (UUID, not serial - GroveObject pattern)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- GroveObject pattern: meta + payload as JSONB
  -- meta contains: id, type, title, description, icon, color, createdAt, updatedAt, createdBy, status, tags, favorite
  meta JSONB NOT NULL,

  -- payload contains: lifecycleModelId, fromTier, toTier, criteria[], logicOperator, isEnabled
  payload JSONB NOT NULL,

  -- Timestamps (database-level, in addition to meta)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Index for type-based queries (all advancement-rule objects)
CREATE INDEX IF NOT EXISTS idx_advancement_rules_meta_type
  ON public.advancement_rules ((meta->>'type'));

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_advancement_rules_meta_status
  ON public.advancement_rules ((meta->>'status'));

-- Index for enabled rules (batch job filters on this)
CREATE INDEX IF NOT EXISTS idx_advancement_rules_enabled
  ON public.advancement_rules ((payload->>'isEnabled'))
  WHERE (payload->>'isEnabled')::boolean = true;

-- Index for tier transition queries
CREATE INDEX IF NOT EXISTS idx_advancement_rules_from_tier
  ON public.advancement_rules ((payload->>'fromTier'));

CREATE INDEX IF NOT EXISTS idx_advancement_rules_to_tier
  ON public.advancement_rules ((payload->>'toTier'));

-- Index for lifecycle model filtering
CREATE INDEX IF NOT EXISTS idx_advancement_rules_lifecycle_model
  ON public.advancement_rules ((payload->>'lifecycleModelId'));

-- Index for updated_at ordering
CREATE INDEX IF NOT EXISTS idx_advancement_rules_updated_at
  ON public.advancement_rules(updated_at DESC);

-- =============================================================================
-- Updated At Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_advancement_rule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Also update meta.updatedAt for GroveObject consistency
  NEW.meta = jsonb_set(NEW.meta, '{updatedAt}', to_jsonb(now()::text));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_advancement_rule_updated_at ON public.advancement_rules;
CREATE TRIGGER trigger_advancement_rule_updated_at
  BEFORE UPDATE ON public.advancement_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_advancement_rule_updated_at();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.advancement_rules ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all rules
CREATE POLICY "Allow read for all users" ON public.advancement_rules
  FOR SELECT USING (true);

-- Allow all operations for now (will tighten when admin auth is implemented)
CREATE POLICY "Allow all for authenticated users" ON public.advancement_rules
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE public.advancement_rules IS 'Advancement rules following GroveObject<AdvancementRulePayload> pattern (INSTANCE: many active)';
COMMENT ON COLUMN public.advancement_rules.meta IS 'GroveObjectMeta: id, type, title, description, status, tags, timestamps, provenance';
COMMENT ON COLUMN public.advancement_rules.payload IS 'AdvancementRulePayload: lifecycleModelId, fromTier, toTier, criteria[], logicOperator, isEnabled';

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get all enabled advancement rules for batch evaluation
CREATE OR REPLACE FUNCTION get_enabled_advancement_rules()
RETURNS SETOF public.advancement_rules AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.advancement_rules
  WHERE (payload->>'isEnabled')::boolean = true
    AND meta->>'status' = 'active'
  ORDER BY (payload->>'fromTier') ASC;
END;
$$ LANGUAGE plpgsql;

-- Get rules for a specific tier transition
CREATE OR REPLACE FUNCTION get_rules_for_tier(p_from_tier TEXT)
RETURNS SETOF public.advancement_rules AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.advancement_rules
  WHERE (payload->>'isEnabled')::boolean = true
    AND meta->>'status' = 'active'
    AND payload->>'fromTier' = p_from_tier
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_enabled_advancement_rules IS 'Get all enabled advancement rules for batch evaluation';
COMMENT ON FUNCTION get_rules_for_tier IS 'Get advancement rules for a specific source tier';
