-- Document Signal Aggregations
-- Sprint: S7-SL-AutoAdvancement v1 - Critical Fix
-- Creates document_signal_aggregations table to support advancement for documents

-- =============================================================================
-- Document Signal Aggregations Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.document_signal_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  period TEXT NOT NULL DEFAULT 'all_time'
    CHECK (period IN ('all_time', 'last_30d', 'last_7d')),

  -- Retrieval signals
  view_count INTEGER NOT NULL DEFAULT 0,
  retrieval_count INTEGER NOT NULL DEFAULT 0,
  reference_count INTEGER NOT NULL DEFAULT 0,
  search_appearances INTEGER NOT NULL DEFAULT 0,

  -- Utility signals
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  utility_score REAL NOT NULL DEFAULT 0,
  export_count INTEGER NOT NULL DEFAULT 0,
  promotion_count INTEGER NOT NULL DEFAULT 0,
  refinement_count INTEGER NOT NULL DEFAULT 0,

  -- Diversity signals
  unique_sessions INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  unique_lenses INTEGER NOT NULL DEFAULT 0,
  unique_hubs INTEGER NOT NULL DEFAULT 0,
  unique_queries INTEGER NOT NULL DEFAULT 0,
  diversity_index REAL NOT NULL DEFAULT 0,

  -- Timeline
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  days_active INTEGER NOT NULL DEFAULT 0,

  -- Computed indicators
  quality_score REAL NOT NULL DEFAULT 0,
  advancement_eligible BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(document_id, period)
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_document_signal_aggregations_document
  ON public.document_signal_aggregations(document_id);

CREATE INDEX IF NOT EXISTS idx_document_signal_aggregations_period
  ON public.document_signal_aggregations(period);

CREATE INDEX IF NOT EXISTS idx_document_signal_aggregations_eligible
  ON public.document_signal_aggregations(advancement_eligible)
  WHERE advancement_eligible = true;

CREATE INDEX IF NOT EXISTS idx_document_signal_aggregations_quality
  ON public.document_signal_aggregations(quality_score DESC);

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE public.document_signal_aggregations ENABLE ROW LEVEL SECURITY;

-- Allow read for all (transparency)
CREATE POLICY "Allow read for all users" ON public.document_signal_aggregations
  FOR SELECT USING (true);

-- Allow all for service role (system updates)
CREATE POLICY "Allow write for service role" ON public.document_signal_aggregations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow writes for authenticated users
CREATE POLICY "Allow write for authenticated users" ON public.document_signal_aggregations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.document_signal_aggregations
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================================================
-- Refresh Function (simplified version)
-- =============================================================================

CREATE OR REPLACE FUNCTION refresh_document_aggregations(
  p_document_id UUID DEFAULT NULL,
  p_period TEXT DEFAULT 'all_time'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_doc RECORD;
BEGIN
  -- For now, just set default values for all documents
  -- In production, this would aggregate from actual usage events
  IF p_document_id IS NOT NULL THEN
    -- Single document
    INSERT INTO public.document_signal_aggregations (
      document_id, period, computed_at
    )
    VALUES (
      p_document_id, p_period, now()
    )
    ON CONFLICT (document_id, period) DO UPDATE
    SET computed_at = now();

    v_count := 1;
  ELSE
    -- All documents
    FOR v_doc IN
      SELECT id FROM public.documents WHERE archived = false
    LOOP
      INSERT INTO public.document_signal_aggregations (
        document_id, period, computed_at
      )
      VALUES (
        v_doc.id, p_period, now()
      )
      ON CONFLICT (document_id, period) DO UPDATE
      SET computed_at = now();

      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION refresh_document_aggregations IS 'Initialize document signal aggregations with default values';

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Get latest aggregation for a document
CREATE OR REPLACE FUNCTION get_document_latest_aggregation(
  p_document_id UUID,
  p_period TEXT DEFAULT 'all_time'
)
RETURNS public.document_signal_aggregations AS $$
DECLARE
  result public.document_signal_aggregations;
BEGIN
  SELECT * INTO result
  FROM public.document_signal_aggregations
  WHERE document_id = p_document_id
    AND period = p_period;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_document_latest_aggregation IS 'Get latest signal aggregation for a document';

-- Initialize with sample data for testing
CREATE OR REPLACE FUNCTION initialize_document_signals_for_testing()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_doc RECORD;
BEGIN
  -- Insert sample data for testing advancement
  FOR v_doc IN
    SELECT id, tier FROM public.documents WHERE archived = false LIMIT 10
  LOOP
    INSERT INTO public.document_signal_aggregations (
      document_id,
      period,
      retrieval_count,
      reference_count,
      diversity_index,
      utility_score,
      quality_score,
      advancement_eligible,
      computed_at
    )
    VALUES (
      v_doc.id,
      'all_time',
      -- Simulate some signals based on tier
      CASE v_doc.tier
        WHEN 'seed' THEN 5
        WHEN 'sprout' THEN 15
        WHEN 'sapling' THEN 35
        WHEN 'tree' THEN 75
        WHEN 'grove' THEN 150
        ELSE 10
      END,
      -- References
      CASE v_doc.tier
        WHEN 'seed' THEN 2
        WHEN 'sprout' THEN 8
        WHEN 'sapling' THEN 20
        WHEN 'tree' THEN 45
        WHEN 'grove' THEN 100
        ELSE 5
      END,
      -- Diversity (random-ish but tier-based)
      0.3 + (random() * 0.4) + (CASE v_doc.tier
        WHEN 'seed' THEN 0.0
        WHEN 'sprout' THEN 0.1
        WHEN 'sapling' THEN 0.2
        WHEN 'tree' THEN 0.3
        WHEN 'grove' THEN 0.4
        ELSE 0.1
      END),
      -- Utility score (normalized -1 to 1, we use 0.3 to 0.9)
      0.3 + (random() * 0.6),
      -- Quality score
      CASE v_doc.tier
        WHEN 'seed' THEN 0.2
        WHEN 'sprout' THEN 0.4
        WHEN 'sapling' THEN 0.6
        WHEN 'tree' THEN 0.8
        WHEN 'grove' THEN 0.9
        ELSE 0.5
      END,
      -- Eligible
      v_doc.tier IN ('sprout', 'sapling', 'tree'),
      now()
    )
    ON CONFLICT (document_id, period) DO UPDATE SET
      retrieval_count = EXCLUDED.retrieval_count,
      reference_count = EXCLUDED.reference_count,
      diversity_index = EXCLUDED.diversity_index,
      utility_score = EXCLUDED.utility_score,
      quality_score = EXCLUDED.quality_score,
      advancement_eligible = EXCLUDED.advancement_eligible,
      computed_at = now();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION initialize_document_signals_for_testing IS 'Initialize test signals for documents (for testing advancement system)';
