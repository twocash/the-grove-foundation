-- Feature Flags Schema
-- Sprint: feature-flags-v1, Phase 2a
-- Creates table for GroveObject<FeatureFlagPayload>
--
-- PATTERN: INSTANCE (many active per grove)
-- Multiple feature flags can be active simultaneously.
-- Follows the GroveObject pattern with meta + payload JSONB columns.

-- =============================================================================
-- Main Table: feature_flags
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
  -- Identity (UUID, not serial - GroveObject pattern)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- GroveObject pattern: meta + payload as JSONB
  -- meta contains: id, type, title, description, icon, color, createdAt, updatedAt, createdBy, status, tags, favorite
  meta JSONB NOT NULL,

  -- payload contains: flagId, available, defaultEnabled, showInExploreHeader, headerLabel, headerOrder, category, changelog
  payload JSONB NOT NULL,

  -- Timestamps (database-level, in addition to meta)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Unique index on flagId for fast lookups and prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_flag_id
  ON public.feature_flags ((payload->>'flagId'));

-- Index for type-based queries (all feature-flag objects)
CREATE INDEX IF NOT EXISTS idx_feature_flags_meta_type
  ON public.feature_flags ((meta->>'type'));

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_feature_flags_meta_status
  ON public.feature_flags ((meta->>'status'));

-- Index for header flags (sorted by order)
CREATE INDEX IF NOT EXISTS idx_feature_flags_header_order
  ON public.feature_flags ((payload->>'showInExploreHeader'), ((payload->>'headerOrder')::int))
  WHERE (payload->>'showInExploreHeader')::boolean = true;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_feature_flags_category
  ON public.feature_flags ((payload->>'category'));

-- Index for updated_at ordering
CREATE INDEX IF NOT EXISTS idx_feature_flags_updated_at
  ON public.feature_flags(updated_at DESC);

-- =============================================================================
-- Updated At Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_feature_flag_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Also update meta.updatedAt for GroveObject consistency
  NEW.meta = jsonb_set(NEW.meta, '{updatedAt}', to_jsonb(now()::text));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_feature_flag_updated_at ON public.feature_flags;
CREATE TRIGGER trigger_feature_flag_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flag_updated_at();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all flags
CREATE POLICY "Allow read for all users" ON public.feature_flags
  FOR SELECT USING (true);

-- Allow all operations for now (will tighten when admin auth is implemented)
CREATE POLICY "Allow all for authenticated users" ON public.feature_flags
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE public.feature_flags IS 'Feature flags following GroveObject<FeatureFlagPayload> pattern (INSTANCE: many active)';
COMMENT ON COLUMN public.feature_flags.meta IS 'GroveObjectMeta: id, type, title, description, status, tags, timestamps, provenance';
COMMENT ON COLUMN public.feature_flags.payload IS 'FeatureFlagPayload: flagId (immutable), available, defaultEnabled, showInExploreHeader, headerLabel, headerOrder, category, changelog';

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get all flags for header display (sorted by headerOrder)
CREATE OR REPLACE FUNCTION get_header_feature_flags()
RETURNS SETOF public.feature_flags AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.feature_flags
  WHERE (payload->>'showInExploreHeader')::boolean = true
    AND (payload->>'available')::boolean = true
  ORDER BY (payload->>'headerOrder')::int ASC;
END;
$$ LANGUAGE plpgsql;

-- Get flag by flagId
CREATE OR REPLACE FUNCTION get_feature_flag_by_id(p_flag_id TEXT)
RETURNS public.feature_flags AS $$
DECLARE
  result public.feature_flags;
BEGIN
  SELECT * INTO result
  FROM public.feature_flags
  WHERE payload->>'flagId' = p_flag_id;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get all available flags (for consumer hooks)
CREATE OR REPLACE FUNCTION get_available_feature_flags()
RETURNS SETOF public.feature_flags AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.feature_flags
  WHERE (payload->>'available')::boolean = true
  ORDER BY (payload->>'flagId') ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_header_feature_flags IS 'Get feature flags configured for Explore header display';
COMMENT ON FUNCTION get_feature_flag_by_id IS 'Get a single feature flag by its immutable flagId';
COMMENT ON FUNCTION get_available_feature_flags IS 'Get all currently available feature flags';
