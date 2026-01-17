-- Lifecycle Models Schema
-- Sprint: EPIC4-SL-MultiModel v1
-- Creates table for GroveObject<LifecycleModelPayload>
--
-- PATTERN: MULTIPLE (many lifecycle models can exist)
-- Each model defines its own tier structure and validation rules.
-- Follows the GroveObject pattern with meta + payload JSONB columns.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- Main Table: lifecycle_models
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lifecycle_models (
  -- Identity (UUID, not serial - GroveObject pattern)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- GroveObject pattern: meta + payload as JSONB
  -- meta contains: id, type, title, description, icon, color, createdAt, updatedAt, createdBy, status, tags, favorite
  meta JSONB NOT NULL,

  -- payload contains: name, description, tiers[], validationRules[], templates?, modelType, version
  -- tiers[] contains: { id, label, emoji, order, description, requirements? }
  -- validationRules[] contains: { type, config } for advancement rules
  -- templates[] contains: { id, name, description, data } for pre-built examples
  payload JSONB NOT NULL,

  -- Timestamps (database-level, in addition to meta)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Index for type-based queries (all lifecycle-model objects)
CREATE INDEX IF NOT EXISTS idx_lifecycle_models_meta_type
  ON public.lifecycle_models ((meta->>'type'));

-- Index for status filtering (active/inactive models)
CREATE INDEX IF NOT EXISTS idx_lifecycle_models_meta_status
  ON public.lifecycle_models ((meta->>'status'));

-- Index for model type (botanical, academic, research, creative)
CREATE INDEX IF NOT EXISTS idx_lifecycle_models_model_type
  ON public.lifecycle_models ((payload->>'modelType'));

-- Index for version queries
CREATE INDEX IF NOT EXISTS idx_lifecycle_models_version
  ON public.lifecycle_models ((payload->>'version'));

-- Index for updated_at ordering
CREATE INDEX IF NOT EXISTS idx_lifecycle_models_updated_at
  ON public.lifecycle_models(updated_at DESC);

-- Index for title search
CREATE INDEX IF NOT EXISTS idx_lifecycle_models_title
  ON public.lifecycle_models USING gin ((meta->>'title') gin_trgm_ops);

-- =============================================================================
-- Updated At Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_lifecycle_model_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Also update meta.updatedAt for GroveObject consistency
  NEW.meta = jsonb_set(NEW.meta, '{updatedAt}', to_jsonb(now()::text));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lifecycle_model_updated_at ON public.lifecycle_models;
CREATE TRIGGER trigger_lifecycle_model_updated_at
  BEFORE UPDATE ON public.lifecycle_models
  FOR EACH ROW
  EXECUTE FUNCTION update_lifecycle_model_updated_at();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.lifecycle_models ENABLE ROW LEVEL SECURITY;

-- Allow all users to read models (public read)
CREATE POLICY "Allow read for all users" ON public.lifecycle_models
  FOR SELECT USING (true);

-- Allow all operations for now (will tighten when admin auth is implemented)
CREATE POLICY "Allow all for authenticated users" ON public.lifecycle_models
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE public.lifecycle_models IS 'Lifecycle models following GroveObject<LifecycleModelPayload> pattern (MULTIPLE: many models can exist)';
COMMENT ON COLUMN public.lifecycle_models.meta IS 'GroveObjectMeta: id, type, title, description, status, tags, timestamps, provenance';
COMMENT ON COLUMN public.lifecycle_models.payload IS 'LifecycleModelPayload: name, description, modelType, version, tiers[], validationRules[], templates?';

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get all active lifecycle models
CREATE OR REPLACE FUNCTION get_active_lifecycle_models()
RETURNS SETOF public.lifecycle_models AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.lifecycle_models
  WHERE meta->>'status' = 'active'
  ORDER BY meta->>'title';
END;
$$ LANGUAGE plpgsql;

-- Get a specific lifecycle model by ID
CREATE OR REPLACE FUNCTION get_lifecycle_model(p_model_id UUID)
RETURNS public.lifecycle_models AS $$
DECLARE
  result public.lifecycle_models;
BEGIN
  SELECT * INTO result
  FROM public.lifecycle_models
  WHERE id = p_model_id
    AND meta->>'status' = 'active'
  LIMIT 1;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get lifecycle model by modelType (e.g., 'botanical', 'academic')
CREATE OR REPLACE FUNCTION get_lifecycle_models_by_type(p_model_type TEXT)
RETURNS SETOF public.lifecycle_models AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.lifecycle_models
  WHERE payload->>'modelType' = p_model_type
    AND meta->>'status' = 'active'
  ORDER BY payload->>'version' DESC, meta->>'title';
END;
$$ LANGUAGE plpgsql;

-- Get all tier definitions for a model
CREATE OR REPLACE FUNCTION get_lifecycle_model_tiers(p_model_id UUID)
RETURNS TABLE (
  tier_id TEXT,
  tier_label TEXT,
  tier_emoji TEXT,
  tier_order INTEGER,
  tier_description TEXT,
  tier_requirements JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tier->>'id' as tier_id,
    tier->>'label' as tier_label,
    tier->>'emoji' as tier_emoji,
    (tier->>'order')::INTEGER as tier_order,
    tier->>'description' as tier_description,
    tier->'requirements' as tier_requirements
  FROM public.lifecycle_models lm,
       jsonb_array_elements(lm.payload->'tiers') tier
  WHERE lm.id = p_model_id
    AND lm.meta->>'status' = 'active'
  ORDER BY (tier->>'order')::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Get validation rules for a model
CREATE OR REPLACE FUNCTION get_lifecycle_model_validation_rules(p_model_id UUID)
RETURNS TABLE (
  rule_type TEXT,
  rule_config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rule->>'type' as rule_type,
    rule->'config' as rule_config
  FROM public.lifecycle_models lm,
       jsonb_array_elements(lm.payload->'validationRules') rule
  WHERE lm.id = p_model_id
    AND lm.meta->>'status' = 'active';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_active_lifecycle_models() IS 'Get all active lifecycle models';
COMMENT ON FUNCTION get_lifecycle_model(UUID) IS 'Get a specific lifecycle model by UUID';
COMMENT ON FUNCTION get_lifecycle_models_by_type(TEXT) IS 'Get all lifecycle models of a specific type (botanical, academic, research, creative)';
COMMENT ON FUNCTION get_lifecycle_model_tiers(UUID) IS 'Get all tier definitions for a lifecycle model';
COMMENT ON FUNCTION get_lifecycle_model_validation_rules(UUID) IS 'Get all validation rules for a lifecycle model';
