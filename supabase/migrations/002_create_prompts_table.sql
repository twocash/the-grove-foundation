-- Create prompts table (Sprint: prompt-unification-v1)
-- Unified Prompt object with declarative sequence membership

-- Prerequisites: ensure knowledge schema and trigger function exist
CREATE SCHEMA IF NOT EXISTS knowledge;

CREATE OR REPLACE FUNCTION knowledge.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Main table
CREATE TABLE IF NOT EXISTS knowledge.prompts (
  -- GroveObjectMeta fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'prompt',
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  tags TEXT[] DEFAULT '{}',
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by JSONB,

  -- PromptPayload fields
  label TEXT NOT NULL,
  execution_prompt TEXT NOT NULL,
  system_context TEXT,
  variant TEXT DEFAULT 'default' CHECK (variant IN ('default', 'glow', 'subtle', 'urgent')),

  -- Affinities (JSONB arrays)
  topic_affinities JSONB DEFAULT '[]',
  lens_affinities JSONB DEFAULT '[]',

  -- Targeting (JSONB object)
  targeting JSONB DEFAULT '{}',

  -- Weight and sequences
  base_weight INTEGER DEFAULT 50,
  sequences JSONB DEFAULT '[]',

  -- Analytics
  stats JSONB DEFAULT '{"impressions":0,"selections":0,"completions":0,"avgEntropyDelta":0,"avgDwellMs":0}',

  -- Source tracking
  source TEXT DEFAULT 'library' CHECK (source IN ('library', 'generated', 'user')),
  generated_from JSONB,

  -- Rate limiting
  cooldown_ms INTEGER,
  max_shows INTEGER
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_prompts_status ON knowledge.prompts(status);
CREATE INDEX IF NOT EXISTS idx_prompts_source ON knowledge.prompts(source);
CREATE INDEX IF NOT EXISTS idx_prompts_base_weight ON knowledge.prompts(base_weight DESC);

-- GIN indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_prompts_sequences ON knowledge.prompts USING GIN (sequences);
CREATE INDEX IF NOT EXISTS idx_prompts_lens_affinities ON knowledge.prompts USING GIN (lens_affinities);
CREATE INDEX IF NOT EXISTS idx_prompts_topic_affinities ON knowledge.prompts USING GIN (topic_affinities);
CREATE INDEX IF NOT EXISTS idx_prompts_targeting ON knowledge.prompts USING GIN (targeting);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON knowledge.prompts USING GIN (tags);

-- Enable Row Level Security
ALTER TABLE knowledge.prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read prompts"
  ON knowledge.prompts
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated write prompts"
  ON knowledge.prompts
  FOR ALL
  USING (true);

-- Updated_at trigger (reuse existing function from knowledge schema)
CREATE TRIGGER set_prompts_updated_at
  BEFORE UPDATE ON knowledge.prompts
  FOR EACH ROW EXECUTE FUNCTION knowledge.set_updated_at();

-- Comment for documentation
COMMENT ON TABLE knowledge.prompts IS 'Unified Prompt objects with declarative sequence membership (Sprint: prompt-unification-v1)';
