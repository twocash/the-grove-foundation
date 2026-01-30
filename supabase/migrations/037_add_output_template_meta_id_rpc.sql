-- Add missing RPC function for output_template lookup by meta.id
-- Sprint: 1.0-release-qa
--
-- BUGFIX: The template-loader.ts calls get_output_template_by_meta_id
-- but this function was never created in migration 031.

-- =============================================================================
-- Get template by meta.id (the user-facing ID, not the table UUID)
-- =============================================================================

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

COMMENT ON FUNCTION get_output_template_by_meta_id IS 'Get an output template by its meta.id (user-facing ID like ot-seed-deep-dive)';
