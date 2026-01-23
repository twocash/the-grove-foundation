-- Output Templates Schema
-- Sprint: prompt-template-architecture-v1
-- Creates table for GroveObject<OutputTemplatePayload>
--
-- PATTERN: Fork-to-Customize
-- System seeds are read-only; users fork to create editable copies.
-- Follows the GroveObject pattern with meta + payload JSONB columns.

-- =============================================================================
-- Main Table: output_templates
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.output_templates (
  -- Identity (UUID, not serial - GroveObject pattern)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- GroveObject pattern: meta + payload as JSONB
  -- meta contains: id, type, title, description, icon, createdAt, updatedAt, status, tags
  meta JSONB NOT NULL,

  -- payload contains: version, name, description, agentType, systemPrompt, config, status, isDefault, source, forkedFromId
  payload JSONB NOT NULL,

  -- Timestamps (database-level, in addition to meta)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Index for type-based queries
CREATE INDEX IF NOT EXISTS idx_output_templates_meta_type
  ON public.output_templates ((meta->>'type'));

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_output_templates_meta_status
  ON public.output_templates ((meta->>'status'));

-- Index for agentType filtering (writer, research, code)
CREATE INDEX IF NOT EXISTS idx_output_templates_agent_type
  ON public.output_templates ((payload->>'agentType'));

-- Index for source filtering (system-seed, user-created, forked, imported)
CREATE INDEX IF NOT EXISTS idx_output_templates_source
  ON public.output_templates ((payload->>'source'));

-- Index for isDefault filtering
CREATE INDEX IF NOT EXISTS idx_output_templates_is_default
  ON public.output_templates ((payload->>'isDefault'));

-- Index for updated_at ordering
CREATE INDEX IF NOT EXISTS idx_output_templates_updated_at
  ON public.output_templates(updated_at DESC);

-- =============================================================================
-- Updated At Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION update_output_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Also update meta.updatedAt for GroveObject consistency
  NEW.meta = jsonb_set(NEW.meta, '{updatedAt}', to_jsonb(now()::text));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_output_template_updated_at ON public.output_templates;
CREATE TRIGGER trigger_output_template_updated_at
  BEFORE UPDATE ON public.output_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_output_template_updated_at();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.output_templates ENABLE ROW LEVEL SECURITY;

-- Allow all users to read templates (public read)
CREATE POLICY "Allow read for all users" ON public.output_templates
  FOR SELECT USING (true);

-- Allow all operations for now (will tighten when admin auth is implemented)
CREATE POLICY "Allow all for authenticated users" ON public.output_templates
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE public.output_templates IS 'Output templates for Writer/Research agents following GroveObject<OutputTemplatePayload> pattern';
COMMENT ON COLUMN public.output_templates.meta IS 'GroveObjectMeta: id, type, title, description, icon, status, tags, timestamps';
COMMENT ON COLUMN public.output_templates.payload IS 'OutputTemplatePayload: version, name, agentType, systemPrompt, config, source, forkedFromId';

-- =============================================================================
-- Seed Data: System Templates
-- =============================================================================

-- Engineering / Architecture (Writer)
INSERT INTO public.output_templates (id, meta, payload)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-100000000001'::uuid,
  '{
    "id": "ot-seed-engineering",
    "type": "output-template",
    "title": "Engineering / Architecture",
    "description": "Technical analysis with implementation patterns and trade-offs",
    "icon": "architecture",
    "status": "active",
    "tags": ["technical", "writer"],
    "createdAt": "2026-01-22T00:00:00Z",
    "updatedAt": "2026-01-22T00:00:00Z"
  }'::jsonb,
  '{
    "version": 1,
    "name": "Engineering / Architecture",
    "description": "Technical analysis with implementation patterns and trade-offs",
    "agentType": "writer",
    "systemPrompt": "Transform research into a technical architecture document.\n\nFocus on: implementation patterns, trade-offs, technical constraints.\nVoice: Precise, technical, evidence-based.\nStructure: Problem → Analysis → Architecture → Trade-offs → Recommendations.\nCitations: Chicago style, endnotes with links.\n\nKey guidelines:\n- Lead with the technical problem being solved\n- Present multiple architectural options when applicable\n- Analyze trade-offs explicitly (performance, maintainability, complexity)\n- Include code examples or pseudocode where helpful\n- End with clear, actionable recommendations",
    "config": {"category": "technical", "citationStyle": "chicago", "citationFormat": "endnotes"},
    "status": "active",
    "isDefault": false,
    "source": "system-seed"
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Vision Paper (Writer)
INSERT INTO public.output_templates (id, meta, payload)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-100000000002'::uuid,
  '{
    "id": "ot-seed-vision",
    "type": "output-template",
    "title": "Vision Paper",
    "description": "Forward-looking strategic perspective on emerging possibilities",
    "icon": "lightbulb",
    "status": "active",
    "tags": ["strategy", "writer"],
    "createdAt": "2026-01-22T00:00:00Z",
    "updatedAt": "2026-01-22T00:00:00Z"
  }'::jsonb,
  '{
    "version": 1,
    "name": "Vision Paper",
    "description": "Forward-looking strategic perspective on emerging possibilities",
    "agentType": "writer",
    "systemPrompt": "Transform research into a forward-looking vision document.\n\nFocus on: emerging possibilities, strategic implications, transformative potential.\nVoice: Aspirational yet grounded, thought-provoking.\nStructure: Current State → Emerging Signals → Vision → Path Forward.\nCitations: Light touch, inline references for credibility.\n\nKey guidelines:\n- Paint a vivid picture of the possible future\n- Ground vision in observable trends and evidence\n- Acknowledge uncertainty while maintaining conviction\n- Connect dots between disparate developments\n- Inspire action with a clear call to engagement",
    "config": {"category": "strategy", "citationStyle": "apa", "citationFormat": "inline"},
    "status": "active",
    "isDefault": false,
    "source": "system-seed"
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Higher Ed Policy (Writer)
INSERT INTO public.output_templates (id, meta, payload)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-100000000003'::uuid,
  '{
    "id": "ot-seed-higher-ed",
    "type": "output-template",
    "title": "Higher Ed Policy",
    "description": "Policy analysis for academic and institutional contexts",
    "icon": "school",
    "status": "active",
    "tags": ["policy", "writer"],
    "createdAt": "2026-01-22T00:00:00Z",
    "updatedAt": "2026-01-22T00:00:00Z"
  }'::jsonb,
  '{
    "version": 1,
    "name": "Higher Ed Policy",
    "description": "Policy analysis for academic and institutional contexts",
    "agentType": "writer",
    "systemPrompt": "Transform research into a higher education policy brief.\n\nFocus on: institutional implications, student outcomes, implementation feasibility.\nVoice: Academic but accessible, balanced perspective.\nStructure: Executive Summary → Context → Analysis → Policy Recommendations → Implementation.\nCitations: APA style, comprehensive reference list.\n\nKey guidelines:\n- Lead with an executive summary for busy administrators\n- Contextualize within higher education landscape\n- Consider multiple stakeholder perspectives (students, faculty, administration)\n- Address implementation challenges realistically\n- Provide phased recommendations with clear success metrics",
    "config": {"category": "policy", "citationStyle": "apa", "citationFormat": "endnotes"},
    "status": "active",
    "isDefault": false,
    "source": "system-seed"
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;

-- Deep Dive (Research)
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
    "isDefault": false,
    "source": "system-seed"
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;

-- Academic Review (Research)
INSERT INTO public.output_templates (id, meta, payload)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-100000000007'::uuid,
  '{
    "id": "ot-seed-academic",
    "type": "output-template",
    "title": "Academic Review",
    "description": "Scholarly literature review with citation emphasis",
    "icon": "library_books",
    "status": "active",
    "tags": ["research", "academic"],
    "createdAt": "2026-01-22T00:00:00Z",
    "updatedAt": "2026-01-22T00:00:00Z"
  }'::jsonb,
  '{
    "version": 1,
    "name": "Academic Review",
    "description": "Scholarly literature review with citation emphasis",
    "agentType": "research",
    "systemPrompt": "Conduct scholarly literature review.\n\nBehavior: Moderate depth (3-4), follow citation trails.\nSources: Academic databases, peer-reviewed journals, scholarly books.\nQuality: High confidence required, comprehensive citation tracking.\n\nKey guidelines:\n- Start with seminal works and follow citation networks\n- Identify key researchers and research groups\n- Map the evolution of ideas over time\n- Note methodological approaches and their limitations\n- Synthesize current state of knowledge and gaps",
    "config": {"category": "research"},
    "status": "active",
    "isDefault": false,
    "source": "system-seed"
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Trend Analysis (Research)
INSERT INTO public.output_templates (id, meta, payload)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-100000000008'::uuid,
  '{
    "id": "ot-seed-trends",
    "type": "output-template",
    "title": "Trend Analysis",
    "description": "Trend-focused research emphasizing temporal patterns",
    "icon": "trending_up",
    "status": "active",
    "tags": ["research", "trends"],
    "createdAt": "2026-01-22T00:00:00Z",
    "updatedAt": "2026-01-22T00:00:00Z"
  }'::jsonb,
  '{
    "version": 1,
    "name": "Trend Analysis",
    "description": "Trend-focused research emphasizing temporal patterns",
    "agentType": "research",
    "systemPrompt": "Conduct trend-focused research.\n\nBehavior: Moderate depth, emphasis on temporal patterns.\nSources: News, industry reports, recent publications.\nQuality: Balanced thresholds, highlight emerging patterns.\n\nKey guidelines:\n- Track how topics have evolved over time\n- Identify inflection points and catalysts for change\n- Compare current state to historical baselines\n- Project forward based on observable trajectories\n- Distinguish signal from noise in emerging developments",
    "config": {"category": "research"},
    "status": "active",
    "isDefault": false,
    "source": "system-seed"
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Helper Functions
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
    (payload->>'isDefault')::boolean DESC,  -- Default first
    (payload->>'source') = 'system-seed' DESC,  -- System seeds next
    updated_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_default_output_template IS 'Get the default output template for a given agent type';
COMMENT ON FUNCTION get_output_templates_by_agent IS 'Get all active output templates for a given agent type, ordered by default/system/recent';
