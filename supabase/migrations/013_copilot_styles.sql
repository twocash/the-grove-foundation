-- Copilot Styles Table Schema
-- Sprint: inspector-copilot-v1
-- Creates table for GroveObject<CopilotStylePayload>
--
-- PATTERN: SINGLETON (one active per grove)
-- Only one copilot style should be active at a time.
-- Follows the GroveObject pattern with meta + payload JSONB columns.

-- =============================================================================
-- Table: copilot_styles
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.copilot_styles (
  -- Identity (UUID, not serial - GroveObject pattern)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- GroveObject pattern: meta + payload as JSONB
  -- meta contains: id, type, title, description, icon, color, createdAt, updatedAt, status, tags
  meta JSONB NOT NULL,

  -- payload contains: styleId, preset, colors, typography, decorations, behavior
  payload JSONB NOT NULL,

  -- Timestamps (database-level, in addition to meta)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Index for type-based queries
CREATE INDEX IF NOT EXISTS idx_copilot_styles_meta_type
  ON public.copilot_styles ((meta->>'type'));

-- Index for status filtering (important for SINGLETON pattern)
CREATE INDEX IF NOT EXISTS idx_copilot_styles_meta_status
  ON public.copilot_styles ((meta->>'status'));

-- Index for preset filtering
CREATE INDEX IF NOT EXISTS idx_copilot_styles_preset
  ON public.copilot_styles ((payload->>'preset'));

-- Index for updated_at ordering
CREATE INDEX IF NOT EXISTS idx_copilot_styles_updated_at
  ON public.copilot_styles(updated_at DESC);

-- =============================================================================
-- Updated At Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_copilot_style_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Also update meta.updatedAt for GroveObject consistency
  NEW.meta = jsonb_set(NEW.meta, '{updatedAt}', to_jsonb(now()::text));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_copilot_style_updated_at ON public.copilot_styles;
CREATE TRIGGER trigger_copilot_style_updated_at
  BEFORE UPDATE ON public.copilot_styles
  FOR EACH ROW
  EXECUTE FUNCTION update_copilot_style_updated_at();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.copilot_styles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all styles
CREATE POLICY "Allow read for all users" ON public.copilot_styles
  FOR SELECT USING (true);

-- Allow all operations for now (will tighten when admin auth is implemented)
CREATE POLICY "Allow all for authenticated users" ON public.copilot_styles
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE public.copilot_styles IS 'Copilot styles following GroveObject<CopilotStylePayload> pattern (SINGLETON: one active)';
COMMENT ON COLUMN public.copilot_styles.meta IS 'GroveObjectMeta: id, type, title, description, status, tags, timestamps';
COMMENT ON COLUMN public.copilot_styles.payload IS 'CopilotStylePayload: styleId, preset, colors, typography, decorations, behavior';

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get the active copilot style
CREATE OR REPLACE FUNCTION get_active_copilot_style()
RETURNS public.copilot_styles AS $$
DECLARE
  result public.copilot_styles;
BEGIN
  SELECT * INTO result
  FROM public.copilot_styles
  WHERE meta->>'status' = 'active'
  LIMIT 1;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get copilot style by preset name
CREATE OR REPLACE FUNCTION get_copilot_style_by_preset(p_preset TEXT)
RETURNS public.copilot_styles AS $$
DECLARE
  result public.copilot_styles;
BEGIN
  SELECT * INTO result
  FROM public.copilot_styles
  WHERE payload->>'preset' = p_preset;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_active_copilot_style IS 'Get the active copilot style configuration (SINGLETON)';
COMMENT ON FUNCTION get_copilot_style_by_preset IS 'Get a copilot style by its preset name';
