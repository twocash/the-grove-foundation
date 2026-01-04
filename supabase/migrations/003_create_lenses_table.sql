-- Create lenses table (Sprint: grove-data-layer-v1)
-- This table was missing from the original data layer migration
-- Note: SupabaseAdapter now falls back to DEFAULT_PERSONAS when table is empty

-- Main table matching GroveObject<LensPayload> structure
CREATE TABLE IF NOT EXISTS public.lenses (
  -- GroveObjectMeta fields
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'lens',
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'pending')),
  tags TEXT[] DEFAULT '{}',
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Payload stored as JSONB (contains full Persona object)
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_lenses_status ON public.lenses(status);
CREATE INDEX IF NOT EXISTS idx_lenses_updated_at ON public.lenses(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.lenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow public access for now, can restrict later)
CREATE POLICY "Public read lenses"
  ON public.lenses
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated write lenses"
  ON public.lenses
  FOR ALL
  USING (true);

-- Updated_at trigger (reuse function if exists)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_lenses_updated_at ON public.lenses;
CREATE TRIGGER set_lenses_updated_at
  BEFORE UPDATE ON public.lenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.lenses IS 'Grove lens/persona objects - falls back to DEFAULT_PERSONAS when empty';
