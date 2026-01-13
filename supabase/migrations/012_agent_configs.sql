-- Agent Config Tables Schema
-- Sprint: experience-console-cleanup-v1
-- Creates tables for ResearchAgentConfig and WriterAgentConfig
--
-- PATTERN: SINGLETON (one active per grove)
-- Only one config of each type should be active at a time.
-- Follows the GroveObject pattern with meta + payload JSONB columns.

-- =============================================================================
-- Table: research_agent_configs
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.research_agent_configs (
  -- Identity (UUID, not serial - GroveObject pattern)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- GroveObject pattern: meta + payload as JSONB
  meta JSONB NOT NULL,
  payload JSONB NOT NULL,

  -- Timestamps (database-level, in addition to meta)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for research_agent_configs
CREATE INDEX IF NOT EXISTS idx_research_agent_configs_meta_type
  ON public.research_agent_configs ((meta->>'type'));

CREATE INDEX IF NOT EXISTS idx_research_agent_configs_meta_status
  ON public.research_agent_configs ((meta->>'status'));

CREATE INDEX IF NOT EXISTS idx_research_agent_configs_updated_at
  ON public.research_agent_configs(updated_at DESC);

-- Updated At Trigger for research_agent_configs
CREATE OR REPLACE FUNCTION update_research_agent_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.meta = jsonb_set(NEW.meta, '{updatedAt}', to_jsonb(now()::text));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_research_agent_config_updated_at ON public.research_agent_configs;
CREATE TRIGGER trigger_research_agent_config_updated_at
  BEFORE UPDATE ON public.research_agent_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_research_agent_config_updated_at();

-- RLS for research_agent_configs
ALTER TABLE public.research_agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all users" ON public.research_agent_configs
  FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated users" ON public.research_agent_configs
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.research_agent_configs IS 'Research agent configs following GroveObject pattern (SINGLETON: one active)';

-- =============================================================================
-- Table: writer_agent_configs
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.writer_agent_configs (
  -- Identity (UUID, not serial - GroveObject pattern)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- GroveObject pattern: meta + payload as JSONB
  meta JSONB NOT NULL,
  payload JSONB NOT NULL,

  -- Timestamps (database-level, in addition to meta)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for writer_agent_configs
CREATE INDEX IF NOT EXISTS idx_writer_agent_configs_meta_type
  ON public.writer_agent_configs ((meta->>'type'));

CREATE INDEX IF NOT EXISTS idx_writer_agent_configs_meta_status
  ON public.writer_agent_configs ((meta->>'status'));

CREATE INDEX IF NOT EXISTS idx_writer_agent_configs_updated_at
  ON public.writer_agent_configs(updated_at DESC);

-- Updated At Trigger for writer_agent_configs
CREATE OR REPLACE FUNCTION update_writer_agent_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.meta = jsonb_set(NEW.meta, '{updatedAt}', to_jsonb(now()::text));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_writer_agent_config_updated_at ON public.writer_agent_configs;
CREATE TRIGGER trigger_writer_agent_config_updated_at
  BEFORE UPDATE ON public.writer_agent_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_writer_agent_config_updated_at();

-- RLS for writer_agent_configs
ALTER TABLE public.writer_agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all users" ON public.writer_agent_configs
  FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated users" ON public.writer_agent_configs
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.writer_agent_configs IS 'Writer agent configs following GroveObject pattern (SINGLETON: one active)';

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get active research agent config
CREATE OR REPLACE FUNCTION get_active_research_agent_config()
RETURNS public.research_agent_configs AS $$
DECLARE
  result public.research_agent_configs;
BEGIN
  SELECT * INTO result
  FROM public.research_agent_configs
  WHERE meta->>'status' = 'active'
  LIMIT 1;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get active writer agent config
CREATE OR REPLACE FUNCTION get_active_writer_agent_config()
RETURNS public.writer_agent_configs AS $$
DECLARE
  result public.writer_agent_configs;
BEGIN
  SELECT * INTO result
  FROM public.writer_agent_configs
  WHERE meta->>'status' = 'active'
  LIMIT 1;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_active_research_agent_config IS 'Get the active research agent configuration (SINGLETON)';
COMMENT ON FUNCTION get_active_writer_agent_config IS 'Get the active writer agent configuration (SINGLETON)';
