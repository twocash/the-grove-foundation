-- PRODUCTION FIX: Output Templates Missing
-- Sprint: 1.0-release-qa
-- Run this in Supabase SQL Editor to fix the "systemPrompt is required" error
--
-- This script:
-- 1. Creates output_templates table if it doesn't exist
-- 2. Seeds with default research and writer templates
-- 3. Creates the missing RPC functions

-- =============================================================================
-- Step 1: Create table (if not exists)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.output_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.output_templates ENABLE ROW LEVEL SECURITY;

-- Policies (drop and recreate to be idempotent)
DROP POLICY IF EXISTS "Allow read for all users" ON public.output_templates;
CREATE POLICY "Allow read for all users" ON public.output_templates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.output_templates;
CREATE POLICY "Allow all for authenticated users" ON public.output_templates
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- Step 2: Seed default templates (UPSERT to be idempotent)
-- =============================================================================

-- Quick Scan (Research, DEFAULT)
INSERT INTO public.output_templates (id, meta, payload)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-100000000006'::uuid,
  '{
    "id": "ot-seed-quick-scan",
    "type": "output-template",
    "title": "Quick Scan",
    "description": "Rapid research overview with limited depth",
    "icon": "bolt",
    "status": "active",
    "tags": ["research", "fast"],
    "createdAt": "2026-01-22T00:00:00Z",
    "updatedAt": "2026-01-22T00:00:00Z"
  }'::jsonb,
  '{
    "version": 1,
    "name": "Quick Scan",
    "description": "Rapid research overview with limited depth",
    "agentType": "research",
    "systemPrompt": "Conduct rapid research overview.\n\nBehavior: Limited depth (2-3 branches), focus on top results.\nSources: Balanced mix, prefer recent publications.\nQuality: Lower confidence thresholds acceptable, prioritize speed.\n\nKey guidelines:\n- Focus on the most authoritative sources first\n- Extract key facts and figures quickly\n- Identify major themes without exhaustive detail\n- Flag areas that warrant deeper investigation\n- Deliver actionable summary within time constraints",
    "config": {"category": "research"},
    "status": "active",
    "isDefault": true,
    "source": "system-seed"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  meta = EXCLUDED.meta,
  payload = EXCLUDED.payload,
  updated_at = now();

-- Deep Dive (Research, also DEFAULT for variety)
INSERT INTO public.output_templates (id, meta, payload)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-100000000005'::uuid,
  '{
    "id": "ot-seed-deep-dive",
    "type": "output-template",
    "title": "Deep Dive",
    "description": "Exhaustive research exploration with maximum branching depth",
    "icon": "biotech",
    "status": "active",
    "tags": ["research", "thorough"],
    "createdAt": "2026-01-22T00:00:00Z",
    "updatedAt": "2026-01-22T00:00:00Z"
  }'::jsonb,
  '{
    "version": 1,
    "name": "Deep Dive",
    "description": "Exhaustive research exploration with maximum branching depth",
    "agentType": "research",
    "systemPrompt": "Conduct exhaustive research exploration.\n\nBehavior: Maximum branching depth (5+), explore tangential connections.\nSources: Prioritize primary sources, academic papers, technical documentation.\nQuality: Strict confidence thresholds, flag all uncertainty.\n\nKey guidelines:\n- Follow every promising thread to its conclusion\n- Cross-reference multiple sources for verification\n- Document the research trail for reproducibility\n- Note contradictions and unresolved questions\n- Synthesize findings into a coherent knowledge map",
    "config": {"category": "research"},
    "status": "active",
    "isDefault": true,
    "source": "system-seed"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  meta = EXCLUDED.meta,
  payload = EXCLUDED.payload,
  updated_at = now();

-- Blog Post (Writer, DEFAULT)
INSERT INTO public.output_templates (id, meta, payload)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-100000000004'::uuid,
  '{
    "id": "ot-seed-blog",
    "type": "output-template",
    "title": "Blog Post",
    "description": "Engaging content for general audience with practical takeaways",
    "icon": "article",
    "status": "active",
    "tags": ["content", "writer"],
    "createdAt": "2026-01-22T00:00:00Z",
    "updatedAt": "2026-01-22T00:00:00Z"
  }'::jsonb,
  '{
    "version": 1,
    "name": "Blog Post",
    "description": "Engaging content for general audience with practical takeaways",
    "agentType": "writer",
    "systemPrompt": "Transform research into an engaging blog post.\n\nFocus on: accessibility, narrative flow, practical takeaways.\nVoice: Conversational but authoritative, engaging.\nStructure: Hook → Story/Context → Key Insights → Actionable Conclusion.\nCitations: Minimal, hyperlinks to sources.\n\nKey guidelines:\n- Open with a hook that creates curiosity or relevance\n- Use concrete examples and relatable analogies\n- Break complex ideas into digestible chunks\n- Include subheadings for scanability\n- End with clear takeaways the reader can act on",
    "config": {"category": "content", "citationStyle": "mla", "citationFormat": "inline"},
    "status": "active",
    "isDefault": true,
    "source": "system-seed"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  meta = EXCLUDED.meta,
  payload = EXCLUDED.payload,
  updated_at = now();

-- =============================================================================
-- Step 3: Create RPC functions (CREATE OR REPLACE is idempotent)
-- =============================================================================

-- Get the default template for an agent type
CREATE OR REPLACE FUNCTION get_default_output_template(p_agent_type TEXT)
RETURNS public.output_templates AS $$
DECLARE
  result public.output_templates;
BEGIN
  SELECT * INTO result
  FROM public.output_templates
  WHERE payload->>'agentType' = p_agent_type
    AND (payload->>'isDefault')::boolean = true
    AND meta->>'status' = 'active'
  ORDER BY updated_at DESC
  LIMIT 1;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get all active templates for an agent type
CREATE OR REPLACE FUNCTION get_output_templates_by_agent(p_agent_type TEXT)
RETURNS SETOF public.output_templates AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.output_templates
  WHERE payload->>'agentType' = p_agent_type
    AND meta->>'status' = 'active'
  ORDER BY
    (payload->>'isDefault')::boolean DESC,
    (payload->>'source') = 'system-seed' DESC,
    updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get template by meta.id (the user-facing ID like ot-seed-deep-dive)
CREATE OR REPLACE FUNCTION get_output_template_by_meta_id(p_meta_id TEXT)
RETURNS public.output_templates AS $$
DECLARE
  result public.output_templates;
BEGIN
  SELECT * INTO result
  FROM public.output_templates
  WHERE meta->>'id' = p_meta_id
    AND meta->>'status' = 'active'
  ORDER BY updated_at DESC
  LIMIT 1;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Step 4: Verify
-- =============================================================================

-- Check that templates exist
SELECT
  meta->>'id' as template_id,
  meta->>'title' as title,
  payload->>'agentType' as agent_type,
  payload->>'isDefault' as is_default
FROM public.output_templates
ORDER BY payload->>'agentType', meta->>'title';

-- Test the RPC function
SELECT meta->>'title' as default_research_template
FROM get_default_output_template('research');
