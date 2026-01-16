-- Lifecycle Configs Schema
-- Sprint: S5-SL-LifecycleEngine v1
-- Creates table for GroveObject<LifecycleConfigPayload>
--
-- PATTERN: SINGLETON (one active per grove)
-- Only one lifecycle configuration can be active at a time.
-- Follows the GroveObject pattern with meta + payload JSONB columns.

-- =============================================================================
-- Main Table: lifecycle_configs
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lifecycle_configs (
  -- Identity (UUID, not serial - GroveObject pattern)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- GroveObject pattern: meta + payload as JSONB
  -- meta contains: id, type, title, description, icon, color, createdAt, updatedAt, createdBy, status, tags, favorite
  meta JSONB NOT NULL,

  -- payload contains: activeModelId, models[]
  -- models[] contains: { id, name, description, isEditable, tiers[], mappings[] }
  payload JSONB NOT NULL,

  -- Timestamps (database-level, in addition to meta)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Index for type-based queries (all lifecycle-config objects)
CREATE INDEX IF NOT EXISTS idx_lifecycle_configs_meta_type
  ON public.lifecycle_configs ((meta->>'type'));

-- Index for status filtering (SINGLETON: only one should be active)
CREATE INDEX IF NOT EXISTS idx_lifecycle_configs_meta_status
  ON public.lifecycle_configs ((meta->>'status'));

-- Index for activeModelId queries
CREATE INDEX IF NOT EXISTS idx_lifecycle_configs_active_model
  ON public.lifecycle_configs ((payload->>'activeModelId'));

-- Index for updated_at ordering
CREATE INDEX IF NOT EXISTS idx_lifecycle_configs_updated_at
  ON public.lifecycle_configs(updated_at DESC);

-- =============================================================================
-- Updated At Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_lifecycle_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Also update meta.updatedAt for GroveObject consistency
  NEW.meta = jsonb_set(NEW.meta, '{updatedAt}', to_jsonb(now()::text));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lifecycle_config_updated_at ON public.lifecycle_configs;
CREATE TRIGGER trigger_lifecycle_config_updated_at
  BEFORE UPDATE ON public.lifecycle_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_lifecycle_config_updated_at();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.lifecycle_configs ENABLE ROW LEVEL SECURITY;

-- Allow all users to read configs (public read)
CREATE POLICY "Allow read for all users" ON public.lifecycle_configs
  FOR SELECT USING (true);

-- Allow all operations for now (will tighten when admin auth is implemented)
CREATE POLICY "Allow all for authenticated users" ON public.lifecycle_configs
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE public.lifecycle_configs IS 'Lifecycle configurations following GroveObject<LifecycleConfigPayload> pattern (SINGLETON: one active)';
COMMENT ON COLUMN public.lifecycle_configs.meta IS 'GroveObjectMeta: id, type, title, description, status, tags, timestamps, provenance';
COMMENT ON COLUMN public.lifecycle_configs.payload IS 'LifecycleConfigPayload: activeModelId, models[] (each model has tiers[] and mappings[])';

-- =============================================================================
-- Seed Data: Default Botanical Model
-- =============================================================================

INSERT INTO public.lifecycle_configs (id, meta, payload)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-000000000001'::uuid,
  '{
    "id": "a1b2c3d4-e5f6-7890-abcd-000000000001",
    "type": "lifecycle-config",
    "title": "Default Lifecycle Configuration",
    "description": "Botanical growth model for sprout lifecycle (system default)",
    "icon": "seedling",
    "status": "active",
    "createdAt": "2026-01-15T00:00:00Z",
    "updatedAt": "2026-01-15T00:00:00Z",
    "createdBy": "system"
  }'::jsonb,
  '{
    "activeModelId": "botanical",
    "models": [
      {
        "id": "botanical",
        "name": "Botanical Growth",
        "description": "The default 5-tier botanical lifecycle model",
        "isEditable": false,
        "tiers": [
          { "id": "seed", "label": "Seed", "emoji": "🌰", "order": 0, "description": "Just planted, not yet sprouted" },
          { "id": "sprout", "label": "Sprout", "emoji": "🌱", "order": 1, "description": "Breaking ground, early growth" },
          { "id": "sapling", "label": "Sapling", "emoji": "🌿", "order": 2, "description": "Growing stronger, taking shape" },
          { "id": "tree", "label": "Tree", "emoji": "🌳", "order": 3, "description": "Fully established, bearing fruit" },
          { "id": "grove", "label": "Grove", "emoji": "🌲", "order": 4, "description": "Part of the greater forest" }
        ],
        "mappings": [
          { "stage": "tender", "tierId": "seed" },
          { "stage": "rooting", "tierId": "seed" },
          { "stage": "branching", "tierId": "sprout" },
          { "stage": "hardened", "tierId": "sapling" },
          { "stage": "grafted", "tierId": "sapling" },
          { "stage": "established", "tierId": "tree" },
          { "stage": "dormant", "tierId": "grove" },
          { "stage": "withered", "tierId": "grove" }
        ]
      }
    ]
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get the active lifecycle configuration (SINGLETON)
CREATE OR REPLACE FUNCTION get_active_lifecycle_config()
RETURNS public.lifecycle_configs AS $$
DECLARE
  result public.lifecycle_configs;
BEGIN
  SELECT * INTO result
  FROM public.lifecycle_configs
  WHERE meta->>'status' = 'active'
  ORDER BY updated_at DESC
  LIMIT 1;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get a specific lifecycle model from the active config
CREATE OR REPLACE FUNCTION get_lifecycle_model(p_model_id TEXT)
RETURNS JSONB AS $$
DECLARE
  config_row public.lifecycle_configs;
  model JSONB;
BEGIN
  SELECT * INTO config_row
  FROM public.lifecycle_configs
  WHERE meta->>'status' = 'active'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF config_row IS NULL THEN
    RETURN NULL;
  END IF;

  -- Find the model in the models array
  SELECT elem INTO model
  FROM jsonb_array_elements(config_row.payload->'models') elem
  WHERE elem->>'id' = p_model_id;

  RETURN model;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_active_lifecycle_config IS 'Get the currently active lifecycle configuration (SINGLETON pattern)';
COMMENT ON FUNCTION get_lifecycle_model IS 'Get a specific lifecycle model by ID from the active configuration';
