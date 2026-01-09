-- Add user provenance fields to system_prompts (Hotfix: experiences-console-v1.1)
-- Supports DEX Provenance as Infrastructure principle
-- Fields nullable until multi-user auth is implemented

-- Add provenance columns
ALTER TABLE public.system_prompts
ADD COLUMN IF NOT EXISTS created_by_user_id TEXT,
ADD COLUMN IF NOT EXISTS updated_by_user_id TEXT;

-- Index for querying by creator (useful for "my prompts" views)
CREATE INDEX IF NOT EXISTS idx_system_prompts_created_by
  ON public.system_prompts(created_by_user_id)
  WHERE created_by_user_id IS NOT NULL;

-- Index for querying by last editor
CREATE INDEX IF NOT EXISTS idx_system_prompts_updated_by
  ON public.system_prompts(updated_by_user_id)
  WHERE updated_by_user_id IS NOT NULL;

-- Update payload constraint to accept new fields (replace existing)
ALTER TABLE public.system_prompts
DROP CONSTRAINT IF EXISTS valid_payload;

ALTER TABLE public.system_prompts
ADD CONSTRAINT valid_payload CHECK (
  payload ? 'identity' AND
  payload ? 'responseMode' AND
  payload ? 'closingBehavior'
);

COMMENT ON COLUMN public.system_prompts.created_by_user_id IS 'User ID who created this prompt (null for system-generated or pre-auth prompts)';
COMMENT ON COLUMN public.system_prompts.updated_by_user_id IS 'User ID who last modified this prompt';
