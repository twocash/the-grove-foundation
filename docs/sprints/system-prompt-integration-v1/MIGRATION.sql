-- ============================================================================
-- MIGRATION: Create system_prompts table
-- Sprint: system-prompt-integration-v1
-- Run in: Supabase SQL Editor
-- ============================================================================

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS system_prompts (
  -- Meta fields (GroveObject.meta)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'system-prompt',
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'smart_toy',
  color TEXT,
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('active', 'draft', 'archived', 'pending')),
  tags TEXT[] DEFAULT '{}',
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Payload (SystemPromptPayload) - stored as JSONB
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Provenance fields (DEX Pillar III)
  created_by_user_id TEXT,
  updated_by_user_id TEXT,
  activated_by_user_id TEXT,
  activated_at TIMESTAMPTZ
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_system_prompts_status 
  ON system_prompts(status);

CREATE INDEX IF NOT EXISTS idx_system_prompts_updated_at 
  ON system_prompts(updated_at DESC);

-- Step 3: Constraint - Only one active prompt at a time
-- This prevents multiple prompts from being active simultaneously
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_prompts_single_active 
  ON system_prompts(status) 
  WHERE status = 'active';

-- Step 4: Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_system_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_system_prompts_updated_at ON system_prompts;

CREATE TRIGGER update_system_prompts_updated_at
  BEFORE UPDATE ON system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_system_prompts_updated_at();

-- Step 5: Row Level Security
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (needed for server-side fetch)
DROP POLICY IF EXISTS "Allow public read" ON system_prompts;
CREATE POLICY "Allow public read" ON system_prompts
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete
DROP POLICY IF EXISTS "Allow authenticated write" ON system_prompts;
CREATE POLICY "Allow authenticated write" ON system_prompts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow service role full access
DROP POLICY IF EXISTS "Allow service role all" ON system_prompts;
CREATE POLICY "Allow service role all" ON system_prompts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 6: Verify table exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'system_prompts'
ORDER BY ordinal_position;
